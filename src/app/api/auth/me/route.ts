import { validateUserSession } from '@/lib/auth';

export async function GET(req: Request) {
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
    
    return Response.json({ 
      data: { 
        id: sessionValidation.user.id, 
        name: sessionValidation.user.name, 
        role: sessionValidation.user.role,
        level: sessionValidation.user.level,
        status: sessionValidation.user.status
      } 
    });
    
  } catch (error) {
    console.error('Get user info error:', error);
    return Response.json({ error: '获取用户信息失败' }, { status: 500 });
  }
}




