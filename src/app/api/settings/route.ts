import { getSettings, updateSettings } from '@/lib/data';
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
    
    const data = await getSettings();
    return Response.json({ data });
    
  } catch (error) {
    console.error('Get settings error:', error);
    return Response.json({ error: '获取设置失败' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    
    if (!sessionId) {
      return Response.json({ error: '未登录' }, { status: 401 });
    }
    
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const sessionValidation = await validateUserSession(sessionId, ipAddress);
    
    if (!sessionValidation.valid || sessionValidation.user?.role !== 'admin') {
      return Response.json({ error: '权限不足' }, { status: 403 });
    }
    
    const body = await req.json().catch(() => ({}));
    
    // 允许批量更新 key/value
    const pairs: Record<string, string> = body && typeof body === 'object' ? body : {};
    const success = await updateSettings(pairs);
    
    if (!success) {
      return Response.json({ error: '更新失败' }, { status: 500 });
    }
    
    const data = await getSettings();
    return Response.json({ data });
    
  } catch (error) {
    console.error('Update settings error:', error);
    return Response.json({ error: '更新失败' }, { status: 500 });
  }
}



