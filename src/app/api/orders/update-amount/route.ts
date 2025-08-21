import { validateUserSession } from '@/lib/auth';
import { getDatabase } from '@/lib/database';
import { logSecurityEvent } from '@/lib/security';

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    if (!sessionId) return Response.json({ error: '未登录' }, { status: 401 });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const ua = req.headers.get('user-agent') || 'unknown';
    const sess = await validateUserSession(sessionId, ip);
    if (!sess.valid || sess.user?.role !== 'admin') return Response.json({ error: '权限不足' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { code, amount } = body as { code?: string; amount?: number };
    if (!code || typeof amount !== 'number' || amount < 0) return Response.json({ error: '参数错误' }, { status: 400 });

    const db = await getDatabase();
    const order = await db.get('SELECT * FROM orders WHERE code = ?', [code]);
    if (!order) return Response.json({ error: '订单不存在' }, { status: 404 });

    await db.run('UPDATE orders SET total_amount = ? WHERE code = ?', [amount, code]);
    const updated = await db.get('SELECT * FROM orders WHERE code = ?', [code]);

    await logSecurityEvent('order_amount_update', 'medium', `Admin ${sess.user?.id} updated order ${code} to ${amount}`, sess.user?.id, ip, ua);

    return Response.json({ data: {
      id: updated.id,
      code: updated.code,
      customerName: updated.customer_name,
      totalAmount: updated.total_amount,
      status: updated.status,
      createdAt: updated.created_at
    }});
  } catch (e) {
    return Response.json({ error: '更新失败' }, { status: 500 });
  }
}





