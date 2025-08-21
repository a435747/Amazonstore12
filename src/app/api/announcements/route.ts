import { createAnnouncement, listAnnouncements } from '@/lib/data';
import { validateUserSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    if (!sessionId) return Response.json({ error: '未登录' }, { status: 401 });

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sess = await validateUserSession(sessionId, ip);
    if (!sess.valid) return Response.json({ error: '会话无效' }, { status: 401 });

    const data = await listAnnouncements(sess.user.id, 20);
    return Response.json({ data });
  } catch {
    return Response.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    if (!sessionId) return Response.json({ error: '未登录' }, { status: 401 });
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sess = await validateUserSession(sessionId, ip);
    if (!sess.valid || sess.user?.role !== 'admin') return Response.json({ error: '权限不足' }, { status: 403 });

    const body = await req.json().catch(()=>({}));
    const { title, message, type = 'info', target = 'all', targetUserId } = body || {};
    if (!title || !message) return Response.json({ error: '标题和内容必填' }, { status: 400 });
    const created = await createAnnouncement({ title, message, type, target, targetUserId });
    if (!created) return Response.json({ error: '创建失败' }, { status: 500 });
    return Response.json({ data: created });
  } catch {
    return Response.json({ error: '创建失败' }, { status: 500 });
  }
}


