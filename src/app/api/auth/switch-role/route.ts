import { updateUser, getAllUsers } from '@/lib/data';
import { validateUserSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // 验证管理员权限
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
    const { role } = body as { role?: 'user' | 'admin' };
    
    if (role !== 'user' && role !== 'admin') {
      return Response.json({ error: '无效角色' }, { status: 400 });
    }
    
    // 查找目标角色的用户
    const users = await getAllUsers();
    const targetUser = users.find((u) => u.role === role);
    
    if (!targetUser) {
      return Response.json({ error: '目标角色不存在' }, { status: 400 });
    }
    
    // 创建新的会话（模拟登录）
    const res = Response.json({ data: targetUser });
    
    // 注意：这里应该创建新的会话，而不是直接设置 Cookie
    // 为了简化，我们暂时返回用户信息
    return res;
    
  } catch (error) {
    console.error('Switch role error:', error);
    return Response.json({ error: '角色切换失败' }, { status: 500 });
  }
}




