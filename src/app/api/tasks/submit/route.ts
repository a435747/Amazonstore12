import { submitTask } from '@/lib/data';
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
    const { taskId, note, evidenceUrl, userId } = body as { 
      taskId?: string; 
      note?: string; 
      evidenceUrl?: string; 
      userId?: string;
    };
    
    if (!taskId || !note) {
      return Response.json({ error: '缺少必要参数' }, { status: 400 });
    }
    
    const actingUserId = (sessionValidation.user.role === 'admin' && userId) ? userId : sessionValidation.user.id;
    const submission = await submitTask(taskId, actingUserId, note, evidenceUrl);
    
    if (!submission) {
      return Response.json({ error: '提交任务失败' }, { status: 500 });
    }
    
    return Response.json({ data: submission });
    
  } catch (error) {
    console.error('Submit task error:', error);
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: '提交任务失败' }, { status: 500 });
  }
}




