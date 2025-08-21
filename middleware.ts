import { NextResponse } from 'next/server';
import { validateUserSession } from '@/lib/auth';

// 公开路径 - 不需要登录就可以访问
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/debug',
  '/force-logout',
  '/test-middleware',
  '/test-auth',
  '/test-middleware-simple',
];

// 管理员专用路径
const ADMIN_PATHS = [
  '/admin',
];

export async function middleware(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  
  // 调试信息
  console.log(`[Middleware] Processing: ${pathname}`);
  
  // 如果是API路由，直接放行（API路由有自己的认证逻辑）
  if (pathname.startsWith('/api/')) {
    console.log(`[Middleware] API route, allowing: ${pathname}`);
    return NextResponse.next();
  }
  
  // 如果是静态资源，直接放行
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
    console.log(`[Middleware] Static resource, allowing: ${pathname}`);
    return NextResponse.next();
  }
  
  // 公开路径直接放行
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p);
  if (isPublic) {
    console.log(`[Middleware] Public path, allowing: ${pathname}`);
    return NextResponse.next();
  }
  
  // 检查用户登录状态
  const cookie = req.headers.get('cookie') || '';
  const sessionId = (/\bsessionId=([^;]+)/.exec(cookie)?.[1]) || '';
  
  console.log(`[Middleware] Session ID: ${sessionId}`);
  
  // 如果没有会话ID，重定向到登录页面
  if (!sessionId) {
    console.log(`[Middleware] No session, redirecting to login: ${pathname}`);
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // 验证会话
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const sessionValidation = await validateUserSession(sessionId, ipAddress);
  
  if (!sessionValidation.valid) {
    console.log(`[Middleware] Invalid session, redirecting to login: ${pathname}`);
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // 检查管理员权限
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath && sessionValidation.user?.role !== 'admin') {
    console.log(`[Middleware] Not admin, redirecting to home: ${pathname}`);
    const homeUrl = new URL('/', req.url);
    return NextResponse.redirect(homeUrl);
  }
  
  console.log(`[Middleware] Allowing access: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};


