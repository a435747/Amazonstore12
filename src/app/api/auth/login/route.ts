import { authenticateUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/security';

export async function POST(req: Request) {
  try {
    // 速率限制检查
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `login:${ipAddress}`;
    
    if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) { // 15分钟内最多5次尝试
      return Response.json({ error: '登录尝试过于频繁，请稍后再试' }, { status: 429 });
    }
    
    const body = await req.json().catch(() => ({}));
    const { username, password } = body as { username?: string; password?: string };
    
    if (!username || !password) {
      return Response.json({ error: '缺少参数' }, { status: 400 });
    }
    
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const result = await authenticateUser(username, password, ipAddress, userAgent);
    
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 401 });
    }
    
    const res = Response.json({ 
      data: { 
        id: result.user.id, 
        name: result.user.name, 
        role: result.user.role,
        level: result.user.level
      } 
    });
    
    // 设置安全的 Cookie
    const cookieOptions = [
      `sessionId=${result.sessionId}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      'Max-Age=86400' // 24小时
    ];
    
    // 在生产环境中添加 Secure 标志
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.push('Secure');
    }
    
    res.headers.set('Set-Cookie', cookieOptions.join('; '));
    return res;
    
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: '登录失败，请重试' }, { status: 500 });
  }
}




