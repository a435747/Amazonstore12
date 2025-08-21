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
    const type = (url.searchParams.get('type') || '').trim();
    const status = (url.searchParams.get('status') || '').trim();
    const method = (url.searchParams.get('method') || '').trim();
    const user = (url.searchParams.get('user') || '').trim();
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = (url.searchParams.get('sortOrder') || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const db = await getDatabase();
    const where: string[] = [];
    const params: any[] = [];

    if (type) { where.push('fr.type = ?'); params.push(type); }
    if (status) { where.push('fr.status = ?'); params.push(status); }
    if (method) { where.push('fr.method = ?'); params.push(method); }
    if (user) { where.push('(u.username LIKE ? OR u.name LIKE ?)'); params.push(`%${user}%`, `%${user}%`); }
    if (from) { where.push('fr.created_at >= ?'); params.push(from); }
    if (to) { where.push('fr.created_at <= ?'); params.push(to); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalRow = await db.get(
      `SELECT COUNT(1) as cnt
       FROM finance_records fr
       LEFT JOIN users u ON u.id = fr.user_id
       ${whereSql}`,
      params
    );

    const allowedSortBy = new Set(['created_at','amount','type','status','method']);
    const sortColumn = allowedSortBy.has(sortBy) ? sortBy : 'created_at';

    const rows = await db.all(
      `SELECT fr.id, fr.type, fr.user_id, fr.amount, fr.status, fr.created_at, fr.method, fr.description,
              u.name as user_name
       FROM finance_records fr
       LEFT JOIN users u ON u.id = fr.user_id
       ${whereSql}
       ORDER BY ${sortColumn} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const data = rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      userId: r.user_id,
      amount: r.amount,
      status: r.status,
      createdAt: r.created_at,
      method: r.method,
      description: r.description,
      user_name: r.user_name,
    }));

    return Response.json({ data, total: totalRow?.cnt || 0, page, limit });
  } catch (e) {
    return Response.json({ error: '获取财务记录失败' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  // 用于导出，根据筛选返回全部数据（不分页）
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    if (!sessionId) return Response.json({ error: '未登录' }, { status: 401 });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sess = await validateUserSession(sessionId, ip);
    if (!sess.valid || sess.user?.role !== 'admin') return Response.json({ error: '权限不足' }, { status: 403 });

    const body = await req.json().catch(()=>({} as any));
    const { type = '', status = '', method = '', user = '', from, to, sortBy = 'created_at', sortOrder = 'DESC' } = body || {};

    const db = await getDatabase();
    const where: string[] = [];
    const params: any[] = [];

    if (type) { where.push('fr.type = ?'); params.push(type); }
    if (status) { where.push('fr.status = ?'); params.push(status); }
    if (method) { where.push('fr.method = ?'); params.push(method); }
    if (user) { where.push('(u.username LIKE ? OR u.name LIKE ?)'); params.push(`%${user}%`, `%${user}%`); }
    if (from) { where.push('fr.created_at >= ?'); params.push(from); }
    if (to) { where.push('fr.created_at <= ?'); params.push(to); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const allowedSortBy = new Set(['created_at','amount','type','status','method']);
    const sortColumn = allowedSortBy.has(sortBy) ? sortBy : 'created_at';
    const order = (String(sortOrder || 'DESC').toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

    const rows = await db.all(
      `SELECT fr.id, fr.type, fr.user_id, fr.amount, fr.status, fr.created_at, fr.method, fr.description,
              u.name as user_name
       FROM finance_records fr
       LEFT JOIN users u ON u.id = fr.user_id
       ${whereSql}
       ORDER BY ${sortColumn} ${order}`,
      params
    );

    const data = rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      userId: r.user_id,
      amount: r.amount,
      status: r.status,
      createdAt: r.created_at,
      method: r.method,
      description: r.description,
      user_name: r.user_name,
    }));

    return Response.json({ data });
  } catch (e) {
    return Response.json({ error: '导出失败' }, { status: 500 });
  }
}
