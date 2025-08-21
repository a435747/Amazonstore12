import { validateUserSession } from '@/lib/auth';
import { destroyUserSessions } from '@/lib/session';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    if (!sessionId) return Response.json({ error: '未登录' }, { status: 401 });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sess = await validateUserSession(sessionId, ip);
    if (!sess.valid || sess.user?.role !== 'admin') return Response.json({ error: '权限不足' }, { status: 403 });

    const { id } = await params;
    const count = await destroyUserSessions(id);
    return Response.json({ data: { destroyed: count } });
  } catch (e) {
    return Response.json({ error: '注销会话失败' }, { status: 500 });
  }
}


