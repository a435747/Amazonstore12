import { z } from 'zod';

// 用户相关验证
export const UserLoginSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(20, '用户名最多20个字符'),
  password: z.string().min(6, '密码至少6个字符')
});

export const UserRegisterSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(20, '用户名最多20个字符')
    .regex(/^[A-Za-z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  password: z.string().min(6, '密码至少6个字符').max(50, '密码最多50个字符'),
  name: z.string().min(1, '姓名不能为空').max(50, '姓名最多50个字符').optional(),
  role: z.enum(['user', 'admin']).default('user')
});

export const UserUpdateSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名最多50个字符').optional(),
  level: z.enum(['普通刷手', 'VIP', '代理']).optional(),
  status: z.enum(['active', 'suspended', 'blacklisted']).optional()
});

// 任务相关验证
export const TaskCreateSchema = z.object({
  title: z.string().min(1, '任务标题不能为空').max(200, '任务标题最多200个字符'),
  merchant: z.string().min(1, '商家名称不能为空').max(100, '商家名称最多100个字符'),
  amount: z.number().positive('订单金额必须大于0').max(100000, '订单金额不能超过10万'),
  commission: z.number().positive('佣金金额必须大于0').max(10000, '佣金金额不能超过1万'),
  stock: z.number().int().positive('库存必须为正整数').max(1000, '库存不能超过1000')
});

export const TaskUpdateSchema = TaskCreateSchema.partial();

export const TaskClaimSchema = z.object({
  taskId: z.string().min(1, '任务ID不能为空')
});

export const TaskSubmitSchema = z.object({
  taskId: z.string().min(1, '任务ID不能为空'),
  note: z.string().min(1, '备注不能为空').max(500, '备注最多500个字符'),
  evidenceUrl: z.string().url('凭证链接格式不正确').optional()
});

// 财务相关验证
export const FinanceOperationSchema = z.object({
  type: z.enum(['deposit', 'withdraw']),
  amount: z.number().positive('金额必须大于0').max(100000, '金额不能超过10万'),
  method: z.enum(['bank', 'alipay', 'usdt']).optional(),
  description: z.string().max(200, '描述最多200个字符').optional()
});

export const FinanceReviewSchema = z.object({
  recordId: z.string().min(1, '记录ID不能为空'),
  approve: z.boolean(),
  reason: z.string().max(200, '原因最多200个字符').optional()
});

// 系统设置验证
export const SettingsUpdateSchema = z.object({
  siteName: z.string().min(1, '网站名称不能为空').max(100, '网站名称最多100个字符').optional(),
  customerService: z.string().max(50, '客服电话最多50个字符').optional(),
  commissionRate: z.number().min(0, '佣金比例不能为负数').max(100, '佣金比例不能超过100%').optional(),
  minWithdraw: z.number().min(0, '最小提现金额不能为负数').optional(),
  maxWithdraw: z.number().min(0, '最大提现金额不能为负数').optional(),
  sessionTimeout: z.number().min(1, '会话超时时间至少1小时').max(168, '会话超时时间不能超过7天').optional(),
  maxLoginAttempts: z.number().min(1, '最大登录尝试次数至少1次').max(20, '最大登录尝试次数不能超过20次').optional()
});

// 通用验证
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  search: z.string().max(100).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const IdParamSchema = z.object({
  id: z.string().min(1, 'ID不能为空')
});

// 验证函数
export async function validateData<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`数据验证失败: ${messages}`);
    }
    throw error;
  }
}

// 类型安全的验证函数
export function validateDataSync<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`数据验证失败: ${messages}`);
    }
    throw error;
  }
}

// 安全验证
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // 移除潜在的HTML标签
    .substring(0, 1000); // 限制长度
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

export function validateIPAddress(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

// 密码强度验证
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('密码长度至少6个字符');
  }
  
  if (password.length > 50) {
    errors.push('密码长度不能超过50个字符');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母');
  }
  
  if (!/\d/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// 金额验证
export function validateAmount(amount: number, min: number = 0, max: number = 100000): { isValid: boolean; error?: string } {
  if (amount < min) {
    return { isValid: false, error: `金额不能小于${min}` };
  }
  
  if (amount > max) {
    return { isValid: false, error: `金额不能大于${max}` };
  }
  
  if (!Number.isFinite(amount)) {
    return { isValid: false, error: '金额必须是有效数字' };
  }
  
  return { isValid: true };
}
