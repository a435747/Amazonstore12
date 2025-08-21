import { getWallet, createFinanceRecord } from '@/lib/data';
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
    
    const url = new URL(req.url);
    const qUserId = url.searchParams.get('userId') || '';
    const targetUserId = (sessionValidation.user.role === 'admin' && qUserId) ? qUserId : sessionValidation.user.id;
    const wallet = await getWallet(targetUserId);
    
    if (!wallet) {
      return Response.json({ error: '钱包不存在' }, { status: 404 });
    }
    
    return Response.json({ data: wallet });
    
  } catch (error) {
    console.error('Get wallet error:', error);
    return Response.json({ error: '获取钱包信息失败' }, { status: 500 });
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
    
    if (!sessionValidation.valid) {
      return Response.json({ error: '会话无效' }, { status: 401 });
    }
    
    const body = await req.json().catch(() => ({}));
    const { type, amount, method, description, userId } = body as { 
      type?: 'deposit' | 'withdraw'; 
      amount?: number; 
      method?: string;
      description?: string;
      userId?: string;
    };
    
    if (!type || !amount || amount <= 0) {
      return Response.json({ error: '参数错误' }, { status: 400 });
    }
    
    // 充值/提现改为：申请阶段不更改余额，由后台审核通过后入账
    // 管理员可代用户提交，若 body.userId 存在且当前为 admin 则使用该用户
    const targetUserId = (sessionValidation.user.role === 'admin' && userId) ? userId : sessionValidation.user.id;

    // 对提现：申请阶段校验余额是否充足，若不足直接拒绝
    if (type === 'withdraw') {
      const wallet = await getWallet(targetUserId);
      if (!wallet || wallet.balance < amount) {
        return Response.json({ error: '余额不足' }, { status: 400 });
      }
    }
    
    // 创建财务记录
    const record = await createFinanceRecord({
      userId: targetUserId,
      type,
      amount,
      method,
      description
    });
    
    if (!record) {
      return Response.json({ error: '创建财务记录失败' }, { status: 500 });
    }
    
    const updatedWallet = await getWallet(targetUserId);
    
    return Response.json({ 
      data: { 
        message: type === 'deposit' ? '充值申请已提交，待审核' : '提现申请已提交，待审核',
        wallet: updatedWallet,
        record
      } 
    });
    
  } catch (error) {
    console.error('Wallet operation error:', error);
    return Response.json({ error: '操作失败' }, { status: 500 });
  }
}




