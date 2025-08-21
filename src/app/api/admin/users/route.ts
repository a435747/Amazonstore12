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
    const q = (url.searchParams.get('q') || '').trim();
    const status = url.searchParams.get('status') || '';
    const level = url.searchParams.get('level') || '';
    const role = url.searchParams.get('role') || '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    const db = await getDatabase();
    const where: string[] = [];
    const params: any[] = [];

    if (q) {
      where.push('(username LIKE ? OR name LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (status) { where.push('status = ?'); params.push(status); }
    if (level) { where.push('level = ?'); params.push(level); }
    if (role) { where.push('role = ?'); params.push(role); }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const totalRow = await db.get(`SELECT COUNT(1) as cnt FROM users ${whereSql}`, params);
    const rows = await db.all(
      `SELECT id, username, name, role, status, level, created_at, last_login
       FROM users ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const data = rows.map((u: any) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      status: u.status,
      level: u.level,
      createdAt: u.created_at,
      lastLogin: u.last_login,
    }));

    return Response.json({ data, total: totalRow?.cnt || 0, page, limit });
  } catch (e) {
    return Response.json({ error: '获取用户失败' }, { status: 500 });
  }
}
