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

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;
    const user = (url.searchParams.get('user') || '').trim();
    const refType = (url.searchParams.get('refType') || '').trim();
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = (url.searchParams.get('sortOrder') || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const db = await getDatabase();
    const where: string[] = [];
    const params: any[] = [];
    if (user) { where.push('(u.username LIKE ? OR u.name LIKE ?)'); params.push(`%${user}%`, `%${user}%`); }
    if (refType) { where.push('wl.ref_type = ?'); params.push(refType); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const allowedSortBy = new Set(['created_at','change']);
    const sortColumn = allowedSortBy.has(sortBy) ? sortBy : 'created_at';

    const totalRow = await db.get(
      `SELECT COUNT(1) as cnt FROM wallet_ledger wl LEFT JOIN users u ON u.id = wl.user_id ${whereSql}`,
      params
    );

    const rows = await db.all(
      `SELECT wl.*, u.name as user_name
       FROM wallet_ledger wl
       LEFT JOIN users u ON u.id = wl.user_id
       ${whereSql}
       ORDER BY ${sortColumn} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const data = (rows as any[]).map(r => ({
      id: r.id,
      userId: r.user_id,
      user_name: r.user_name,
      change: r.change,
      balanceBefore: r.balance_before,
      balanceAfter: r.balance_after,
      refType: r.ref_type,
      refId: r.ref_id,
      description: r.description,
      createdAt: r.created_at,
    }));

    return Response.json({ data, total: totalRow?.cnt || 0, page, limit });
  } catch (e) {
    return Response.json({ error: '获取流水失败' }, { status: 500 });
  }
}


