import { registerUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/security';

export async function POST(req: Request) {
  try {
    // 速率限制检查
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `register:${ipAddress}`;
    
    if (!checkRateLimit(rateLimitKey, 3, 60 * 60 * 1000)) { // 1小时内最多3次注册尝试
      return Response.json({ error: '注册尝试过于频繁，请稍后再试' }, { status: 429 });
    }
    
    const body = await req.json().catch(() => ({}));
    const { username, password, name } = body as { username?: string; password?: string; name?: string };
    
    if (!username || !password) {
      return Response.json({ error: '缺少参数' }, { status: 400 });
    }
    
    const result = await registerUser({ username, password, name });
    
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    
    return Response.json({ 
      data: { 
        message: '注册成功，请登录',
        userId: result.userId 
      } 
    });
    
  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: '注册失败，请重试' }, { status: 500 });
  }
}


