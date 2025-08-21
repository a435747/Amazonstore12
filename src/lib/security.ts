import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto';
import { getDatabase } from './database';

// 密码安全
export interface PasswordHash {
  salt: string;
  hash: string;
  iterations: number;
  keylen: number;
  digest: string;
}

export function hashPassword(password: string): PasswordHash {
  const salt = randomBytes(32);
  const iterations = 100_000;
  const keylen = 64;
  const digest = 'sha512';
  const hash = pbkdf2Sync(password, salt, iterations, keylen, digest);
  
  return {
    salt: salt.toString('hex'),
    hash: hash.toString('hex'),
    iterations,
    keylen,
    digest,
  };
}

export function verifyPassword(password: string, stored: PasswordHash): boolean {
  try {
    const { salt, iterations, keylen, digest, hash } = stored;
    const computed = pbkdf2Sync(password, Buffer.from(salt, 'hex'), iterations, keylen, digest);
    return timingSafeEqual(computed, Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

// 会话安全
export function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

export function generateCSRFToken(): string {
  return randomBytes(16).toString('hex');
}

// 输入清理
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .substring(0, 1000);
}

export function sanitizeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// 速率限制
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (entry.count >= limit) {
    return false;
  }
  
  entry.count++;
  return true;
}

// 登录尝试限制
export async function checkLoginAttempts(username: string, ipAddress: string): Promise<{ allowed: boolean; remainingAttempts: number; lockedUntil?: Date }> {
  const database = await getDatabase();
  
  // 检查用户是否被锁定
  const user = await database.get('SELECT login_attempts, locked_until FROM users WHERE username = ?', [username]);
  if (user && user.locked_until) {
    const lockedUntil = new Date(user.locked_until);
    if (lockedUntil > new Date()) {
      return { allowed: false, remainingAttempts: 0, lockedUntil };
    }
  }
  
  // 检查IP地址的登录尝试
  const ipKey = `login_attempts:${ipAddress}`;
  const ipAttempts = rateLimitStore.get(ipKey);
  const maxAttempts = 10;
  const windowMs = 15 * 60 * 1000; // 15分钟
  
  if (ipAttempts && Date.now() < ipAttempts.resetTime && ipAttempts.count >= maxAttempts) {
    return { allowed: false, remainingAttempts: 0 };
  }
  
  const remainingAttempts = ipAttempts ? Math.max(0, maxAttempts - ipAttempts.count) : maxAttempts;
  return { allowed: true, remainingAttempts };
}

export async function recordLoginAttempt(username: string, ipAddress: string, success: boolean): Promise<void> {
  const database = await getDatabase();
  
  if (success) {
    // 登录成功，重置尝试次数
    await database.run('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE username = ?', [username]);
    rateLimitStore.delete(`login_attempts:${ipAddress}`);
  } else {
    // 登录失败，增加尝试次数
    await database.run('UPDATE users SET login_attempts = login_attempts + 1 WHERE username = ?', [username]);
    
    // 检查是否需要锁定账户
    const user = await database.get('SELECT login_attempts FROM users WHERE username = ?', [username]);
    if (user && user.login_attempts >= 5) {
      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 锁定30分钟
      await database.run('UPDATE users SET locked_until = ? WHERE username = ?', [lockedUntil.toISOString(), username]);
    }
    
    // 记录IP地址的尝试次数
    const ipKey = `login_attempts:${ipAddress}`;
    const entry = rateLimitStore.get(ipKey) || { count: 0, resetTime: Date.now() + 15 * 60 * 1000 };
    entry.count++;
    rateLimitStore.set(ipKey, entry);
  }
}

// 安全日志
export async function logSecurityEvent(type: string, level: 'low' | 'medium' | 'high' | 'critical', message: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
  const database = await getDatabase();
  const id = randomBytes(16).toString('hex');
  
  await database.run(`
    INSERT INTO security_logs (id, type, level, message, user_id, ip_address, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `, [id, type, level, message, userId, ipAddress, userAgent]);
}

// 权限检查
export async function checkPermission(userId: string, requiredRole: string): Promise<boolean> {
  const database = await getDatabase();
  const user = await database.get('SELECT role, status FROM users WHERE id = ?', [userId]);
  
  if (!user || user.status !== 'active') {
    return false;
  }
  
  if (requiredRole === 'admin' && user.role !== 'admin') {
    return false;
  }
  
  return true;
}

// 数据验证
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validateInteger(value: string): boolean {
  return /^\d+$/.test(value) && parseInt(value) >= 0;
}

export function validateFloat(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value) && parseFloat(value) >= 0;
}

// 文件上传安全
export function validateFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}

export function validateFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize;
}

// 清理过期数据
export async function cleanupExpiredData(): Promise<void> {
  const database = await getDatabase();
  
  // 清理过期的安全日志（保留30天）
  await database.run(`
    DELETE FROM security_logs 
    WHERE created_at < datetime('now', '-30 days')
  `);
  
  // 清理过期的会话
  await database.run(`
    DELETE FROM sessions 
    WHERE expires_at <= datetime('now')
  `);
  
  // 清理速率限制缓存
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// 定期清理任务
setInterval(cleanupExpiredData, 60 * 60 * 1000); // 每小时清理一次
