import { claimTask } from '@/lib/data';
import { validateUserSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    
    if (!sessionId) {
      return Response.json({ error: '未登录' }, { status: 401 });
    }
    
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sessionValidation = await validateUserSession(sessionId, ipAddress);
    
    if (!sessionValidation.valid) {
      return Response.json({ error: '会话无效' }, { status: 401 });
    }
    
    const body = await req.json().catch(() => ({}));
    const { taskId, userId } = body as { taskId?: string; userId?: string };
    
    if (!taskId) {
      return Response.json({ error: '缺少任务ID' }, { status: 400 });
    }
    
    const actingUserId = (sessionValidation.user.role === 'admin' && userId) ? userId : sessionValidation.user.id;
    const claim = await claimTask(taskId, actingUserId);
    
    if (!claim) {
      return Response.json({ error: '认领任务失败' }, { status: 500 });
    }
    
    return Response.json({ data: claim });
    
  } catch (error) {
    console.error('Claim task error:', error);
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: '认领任务失败' }, { status: 500 });
  }
}




