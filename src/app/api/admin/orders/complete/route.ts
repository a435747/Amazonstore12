import { validateUserSession } from '@/lib/auth';
import { getDatabase } from '@/lib/database';
import { updateWalletBalanceWithMeta } from '@/lib/data';

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    if (!sessionId) return Response.json({ error: '未登录' }, { status: 401 });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sess = await validateUserSession(sessionId, ip);
    if (!sess.valid || sess.user?.role !== 'admin') return Response.json({ error: '权限不足' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { code } = body as { code?: string };
    if (!code) return Response.json({ error: '缺少参数' }, { status: 400 });

    const db = await getDatabase();
    const order = await db.get('SELECT * FROM orders WHERE code = ?', [code]);
    if (!order) return Response.json({ error: '订单不存在' }, { status: 404 });

    if (!order.user_id || !order.commission || order.commission <= 0) {
      return Response.json({ error: '订单未设置佣金或归属用户' }, { status: 400 });
    }

    // 标记订单完成
    await db.run('UPDATE orders SET status = ? WHERE code = ?', ['completed', code]);

    // 钱包入账 + 记流水
    const ok = await updateWalletBalanceWithMeta(order.user_id, order.commission, 'order_commission', String(order.code), '订单佣金发放');
    if (!ok) return Response.json({ error: '发放佣金失败' }, { status: 500 });

    // 写财务记录（已完成）
    await db.run(
      'INSERT INTO finance_records (id, user_id, type, amount, status, description, created_at, processed_at, processed_by) VALUES (?,?,?,?,?,?,?,?,?)',
      [
        'fin' + Date.now(),
        order.user_id,
        'commission',
        order.commission,
        'completed',
        `订单佣金：${order.code}`,
        new Date().toISOString(),
        new Date().toISOString(),
        sess.user?.id,
      ]
    );

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
    return Response.json({ error: '完成失败' }, { status: 500 });
  }
}


