import { validateUserSession } from '@/lib/auth';
import { getDatabase } from '@/lib/database';

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    if (!sessionId) return Response.json({ error: '未登录' }, { status: 401 });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sess = await validateUserSession(sessionId, ip);
    if (!sess.valid || sess.user?.role !== 'admin') return Response.json({ error: '权限不足' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { code, userId, commission } = body as { code?: string; userId?: string; commission?: number };
    if (!code || !userId || typeof commission !== 'number' || commission < 0) {
      return Response.json({ error: '参数错误' }, { status: 400 });
    }

    const db = await getDatabase();
    const order = await db.get('SELECT * FROM orders WHERE code = ?', [code]);
    if (!order) return Response.json({ error: '订单不存在' }, { status: 404 });

    const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) return Response.json({ error: '用户不存在' }, { status: 404 });

    await db.run('UPDATE orders SET user_id = ?, commission = ? WHERE code = ?', [userId, commission, code]);
    const updated = await db.get('SELECT * FROM orders WHERE code = ?', [code]);

    return Response.json({ data: {
      id: updated.id,
      code: updated.code,
      customerName: updated.customer_name,
      totalAmount: updated.total_amount,
      status: updated.status,
      userId: updated.user_id,
      commission: updated.commission,
      createdAt: updated.created_at
    }});
  } catch (e) {
    return Response.json({ error: '指派失败' }, { status: 500 });
  }
}


