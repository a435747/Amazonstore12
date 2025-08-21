import { validateUserSession } from '@/lib/auth';
import { updateUser, getUserById } from '@/lib/data';
import { getDatabase } from '@/lib/database';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    if (!sessionId) return Response.json({ error: '未登录' }, { status: 401 });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sess = await validateUserSession(sessionId, ip);
    if (!sess.valid || sess.user?.role !== 'admin') return Response.json({ error: '权限不足' }, { status: 403 });

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { status, level, role } = body as { status?: string; level?: string; role?: 'user' | 'admin' };

    const updates: any = {};
    if (status) updates.status = status;
    if (level) updates.level = level;
    if (role) updates.role = role;

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: '无有效更新字段' }, { status: 400 });
    }

    const ok = await updateUser(id, updates);
    if (!ok) return Response.json({ error: '更新失败或用户不存在' }, { status: 400 });
    return Response.json({ data: true });
  } catch (e) {
    return Response.json({ error: '更新失败' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    if (!sessionId) return Response.json({ error: '未登录' }, { status: 401 });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sess = await validateUserSession(sessionId, ip);
    if (!sess.valid || sess.user?.role !== 'admin') return Response.json({ error: '权限不足' }, { status: 403 });

    const { id } = await params;
    const user = await getUserById(id);
    if (!user) return Response.json({ error: '用户不存在' }, { status: 404 });

    const db = await getDatabase();
    const wallet = await db.get(`SELECT balance FROM wallets WHERE user_id = ?`, [id]);
    const last30 = await db.get(
      `SELECT 
          (SELECT IFNULL(SUM(amount),0) FROM finance_records WHERE user_id = ? AND type='commission' AND date(created_at) >= date('now','-30 day')) as commission,
          (SELECT IFNULL(COUNT(1),0) FROM task_claims WHERE user_id = ? AND date(claimed_at) >= date('now','-30 day')) as tasks`,
      [id, id]
    );
    const sessions = await db.all(`SELECT id, ip_address, user_agent, created_at, expires_at FROM sessions WHERE user_id = ? AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 10`, [id]);
    const loginIps = await db.all(
      `SELECT DISTINCT ip_address FROM security_logs 
       WHERE user_id = ? AND type = 'login_success' AND date(created_at) >= date('now','-7 day') 
       AND ip_address IS NOT NULL AND ip_address <> '' ORDER BY created_at DESC LIMIT 20`,
      [id]
    );
    const failed24h = await db.get(
      `SELECT COUNT(1) as cnt FROM security_logs WHERE user_id = ? AND type = 'login_failed' AND datetime(created_at) >= datetime('now','-1 day')`,
      [id]
    );
    const risk = {
      isBlacklisted: user.status === 'blacklisted',
      failedLogin24h: failed24h?.cnt || 0,
      multiIp7d: (loginIps?.length || 0) > 5,
    };

    return Response.json({ data: { ...user, walletBalance: wallet?.balance || 0, last30: { commission: last30?.commission || 0, tasks: last30?.tasks || 0 }, sessions, loginIps: (loginIps || []).map((r:any)=>r.ip_address), risk } });
  } catch (e) {
    return Response.json({ error: '获取用户详情失败' }, { status: 500 });
  }
}
