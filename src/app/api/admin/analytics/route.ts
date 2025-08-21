import { validateUserSession } from '@/lib/auth';
import { getDatabase } from '@/lib/database';

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    if (!sessionId) return Response.json({ error: '未登录' }, { status: 401 });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sess = await validateUserSession(sessionId, ip);
    if (!sess.valid || sess.user?.role !== 'admin') return Response.json({ error: '权限不足' }, { status: 403 });

    const db = await getDatabase();
    const url = new URL(req.url);
    const trendDays = Math.min(90, Math.max(1, parseInt(url.searchParams.get('trendDays') || '7', 10)));
    const topDays = Math.min(90, Math.max(1, parseInt(url.searchParams.get('topDays') || '30', 10)));
    const dim = (url.searchParams.get('dimension') || 'commission').toLowerCase();
    const dimension: 'commission'|'deposit'|'withdraw' = dim === 'deposit' ? 'deposit' : dim === 'withdraw' ? 'withdraw' : 'commission';

    // totals
    const users = await db.get('SELECT COUNT(1) as cnt FROM users');
    const tasks = await db.get('SELECT COUNT(1) as cnt FROM tasks');
    const revenue = await db.get("SELECT IFNULL(SUM(amount),0) as sum FROM finance_records WHERE type IN ('deposit','commission')");
    const todayRevenue = await db.get("SELECT IFNULL(SUM(amount),0) as sum FROM finance_records WHERE date(created_at)=date('now')");

    // 近 N 天趋势（每日收入、每日任务新增）
    const trendRaw = await db.all(
      `WITH RECURSIVE seq(x) AS (
          SELECT 0
          UNION ALL
          SELECT x + 1 FROM seq WHERE x + 1 < ?
        )
        SELECT 
          date('now', printf('-%d day', (? - x - 1))) as date,
          IFNULL((SELECT SUM(amount) FROM finance_records fr WHERE date(fr.created_at)=date('now', printf('-%d day', (? - x - 1))) AND fr.type = 'deposit'), 0) as deposit,
          IFNULL((SELECT SUM(amount) FROM finance_records fr WHERE date(fr.created_at)=date('now', printf('-%d day', (? - x - 1))) AND fr.type = 'commission'), 0) as commission,
          IFNULL((SELECT SUM(amount) FROM finance_records fr WHERE date(fr.created_at)=date('now', printf('-%d day', (? - x - 1))) AND fr.type = 'withdraw'), 0) as withdrawals,
          IFNULL((SELECT COUNT(1) FROM tasks t WHERE date(t.created_at)=date('now', printf('-%d day', (? - x - 1)))), 0) as tasks
        FROM seq`,
      [trendDays, trendDays, trendDays, trendDays]
    );

    const trend = trendRaw.map((r: any) => ({
      date: r.date,
      revenue: dimension === 'deposit' ? r.deposit : (dimension === 'commission' ? r.commission : (r.deposit + r.commission)),
      withdrawals: r.withdrawals,
      netRevenue: (r.deposit + r.commission) - r.withdrawals,
      tasks: r.tasks,
    }));

    // 近 M 天佣金 Top 用户
    const topType = dimension === 'deposit' ? 'deposit' : (dimension === 'withdraw' ? 'withdraw' : 'commission');
    const topUsers = await db.all(
      `SELECT u.id, u.name, IFNULL(SUM(fr.amount),0) as earnings, 
              IFNULL((SELECT COUNT(1) FROM task_claims tc WHERE tc.user_id = u.id AND date(tc.claimed_at) >= date('now', ?)),0) as tasks
       FROM users u
       LEFT JOIN finance_records fr ON fr.user_id = u.id AND fr.type = ? AND date(fr.created_at) >= date('now', ?)
       GROUP BY u.id, u.name
       ORDER BY earnings DESC
       LIMIT 10`,
      [`-${topDays} day`, topType, `-${topDays} day`]
    );

    return Response.json({
      data: {
        totals: {
          users: users?.cnt || 0,
          tasks: tasks?.cnt || 0,
          revenue: revenue?.sum || 0,
          todayRevenue: todayRevenue?.sum || 0
        },
        trend,
        topUsers
      }
    });
  } catch (e) {
    return Response.json({ error: '获取统计失败' }, { status: 500 });
  }
}
