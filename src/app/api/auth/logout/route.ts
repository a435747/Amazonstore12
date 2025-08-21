import { destroySession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
    
    if (sessionId) {
      await destroySession(sessionId);
    }
    
    const res = Response.json({ data: true });
    
    // 清除所有相关的 Cookie
    const cookieOptions = [
      'sessionId=',
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      'Max-Age=0'
    ];
    
    if (process.env.NODE_ENV === 'production') {
      cookieOptions.push('Secure');
    }
    
    res.headers.set('Set-Cookie', cookieOptions.join('; '));
    return res;
    
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({ error: '登出失败' }, { status: 500 });
  }
}



