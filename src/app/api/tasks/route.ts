import { getAllTasks, createTask } from '@/lib/data';
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
    
    const tasks = await getAllTasks();
    
    return Response.json({ data: tasks });
    
  } catch (error) {
    console.error('Get tasks error:', error);
    return Response.json({ error: '获取任务列表失败' }, { status: 500 });
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
    const taskData = {
      title: body.title,
      merchant: body.merchant,
      amount: body.amount,
      commission: body.commission,
      stock: body.stock
    };
    
    const task = await createTask(taskData);
    
    if (!task) {
      return Response.json({ error: '创建任务失败' }, { status: 500 });
    }
    
    return Response.json({ data: task });
    
  } catch (error) {
    console.error('Create task error:', error);
    return Response.json({ error: '创建任务失败' }, { status: 500 });
  }
}

