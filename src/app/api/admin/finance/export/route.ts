import { validateUserSession } from '@/lib/auth';
import { getDatabase } from '@/lib/database';

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    if (!sessionId) return new Response('未登录', { status: 401 });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sess = await validateUserSession(sessionId, ip);
    if (!sess.valid || sess.user?.role !== 'admin') return new Response('权限不足', { status: 403 });

    const url = new URL(req.url);
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

    const allowedSortBy = new Set(['created_at','amount','type','status','method']);
    const sortColumn = allowedSortBy.has(sortBy) ? sortBy : 'created_at';

    const rows = await db.all(
      `SELECT fr.id, fr.type, fr.user_id, fr.amount, fr.status, fr.created_at, fr.method, fr.description,
              u.name as user_name
       FROM finance_records fr
       LEFT JOIN users u ON u.id = fr.user_id
       ${whereSql}
       ORDER BY ${sortColumn} ${sortOrder}`,
      params
    );

    const header = ['id','type','user','amount','status','method','createdAt','description'];
    const lines = [header.join(',')];
    for (const r of rows as any[]) {
      const arr = [r.id, r.type, (r.user_name || r.user_id), r.amount, r.status, (r.method || ''), r.created_at, (r.description || '')]
        .map((v: any) => String(v).replace(/"/g,'""'))
        .map((v: string) => /,|\n|\"/.test(v) ? `"${v}"` : v);
      lines.push(arr.join(','));
    }
    const csv = lines.join('\n');
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="finance_${Date.now()}.csv"`
      }
    });
  } catch (e) {
    return new Response('导出失败', { status: 500 });
  }
}


