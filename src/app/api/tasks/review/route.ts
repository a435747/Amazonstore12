import { validateUserSession } from '@/lib/auth';
import { getDatabase } from '@/lib/database';

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
    const { claimId, approve, reason } = body as { 
      claimId?: string; 
      approve?: boolean; 
      reason?: string; 
    };
    
    if (!claimId || typeof approve !== 'boolean') {
      return Response.json({ error: '缺少必要参数' }, { status: 400 });
    }
    
    const database = await getDatabase();
    
    // 获取任务认领记录
    const claim = await database.get(`
      SELECT tc.*, t.commission, t.title 
      FROM task_claims tc 
      JOIN tasks t ON tc.task_id = t.id 
      WHERE tc.id = ?
    `, [claimId]);
    
    if (!claim) {
      return Response.json({ error: '任务认领记录不存在' }, { status: 404 });
    }
    
    // 更新审核状态
    const result = await database.run(`
      UPDATE task_claims 
      SET review_status = ?, reviewed_at = datetime('now'), reviewed_by = ?
      WHERE id = ?
    `, [approve ? 'approved' : 'rejected', sessionValidation.user.id, claimId]);
    
    if (result.changes === 0) {
      return Response.json({ error: '更新审核状态失败' }, { status: 500 });
    }
    
    // 如果审核通过，给用户发放佣金
    if (approve) {
      await database.run(`
        UPDATE wallets 
        SET balance = balance + ?, updated_at = datetime('now') 
        WHERE user_id = ?
      `, [claim.commission, claim.user_id]);
      
      // 创建财务记录
      await database.run(`
        INSERT INTO finance_records (id, user_id, type, amount, status, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `, [
        'fin' + Date.now(),
        claim.user_id,
        'commission',
        claim.commission,
        'completed',
        `任务佣金：${claim.title}`
      ]);
    }
    
    return Response.json({ 
      data: { 
        message: approve ? '审核通过，佣金已发放' : '审核拒绝',
        claimId,
        approve,
        reason
      } 
    });
    
  } catch (error) {
    console.error('Review task error:', error);
    return Response.json({ error: '审核失败' }, { status: 500 });
  }
}

