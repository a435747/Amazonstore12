import { validateUserSession } from '@/lib/auth';
import { getDatabase } from '@/lib/database';
import { getWallet, updateWalletBalance } from '@/lib/data';

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    if (!sessionId) return Response.json({ error: '未登录' }, { status: 401 });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sess = await validateUserSession(sessionId, ip);
    if (!sess.valid || sess.user?.role !== 'admin') return Response.json({ error: '权限不足' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { recordId, approve } = body as { recordId?: string; approve?: boolean };
    if (!recordId || typeof approve !== 'boolean') return Response.json({ error: '参数错误' }, { status: 400 });

    const db = await getDatabase();
    const rec = await db.get('SELECT * FROM finance_records WHERE id = ?', [recordId]);
    if (!rec) return Response.json({ error: '记录不存在' }, { status: 404 });

    let newStatus = approve ? 'completed' : 'rejected';
    if (approve) {
      if (rec.type === 'deposit') {
        const ok = await updateWalletBalance(rec.user_id, rec.amount);
        if (!ok) return Response.json({ error: '入账失败' }, { status: 500 });
      } else if (rec.type === 'withdraw') {
        const wallet = await getWallet(rec.user_id);
        if (!wallet || wallet.balance < rec.amount) {
          newStatus = 'rejected';
        } else {
          const ok = await updateWalletBalance(rec.user_id, -rec.amount);
          if (!ok) return Response.json({ error: '扣款失败' }, { status: 500 });
        }
      }
    }

    await db.run(
      'UPDATE finance_records SET status = ?, processed_at = datetime("now"), processed_by = ? WHERE id = ?',
      [newStatus, sess.user?.id, recordId]
    );

    return Response.json({ data: { recordId, status: newStatus } });
  } catch (e) {
    return Response.json({ error: '审核失败' }, { status: 500 });
  }
}
