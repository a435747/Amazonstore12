import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto';
import { getDatabase } from './database';
import { createSession, validateSession, destroySession } from './session';
import { logSecurityEvent } from './security';
import { validateData, UserLoginSchema, UserRegisterSchema } from './validation';

export interface PasswordHash {
  salt: string; // hex
  hash: string; // hex
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

// 用户认证相关函数
export async function authenticateUser(username: string, password: string, ipAddress: string, userAgent: string) {
  try {
    // 验证输入
    const loginData = await validateData(UserLoginSchema, { username, password });
    
    const database = await getDatabase();
    const user = await database.get('SELECT * FROM users WHERE username = ?', [loginData.username]);
    
    if (!user) {
      await logSecurityEvent('login_failed', 'medium', `登录失败：用户不存在 - ${username}`, undefined, ipAddress, userAgent);
      return { success: false, error: '用户名或密码错误' };
    }
    
    if (user.status !== 'active') {
      await logSecurityEvent('login_failed', 'medium', `登录失败：账户状态异常 - ${username}`, user.id, ipAddress, userAgent);
      return { success: false, error: '账户已被禁用' };
    }
    
    // 验证密码
    const passwordHash = JSON.parse(user.password_hash);
    if (!verifyPassword(loginData.password, passwordHash)) {
      await logSecurityEvent('login_failed', 'medium', `登录失败：密码错误 - ${username}`, user.id, ipAddress, userAgent);
      return { success: false, error: '用户名或密码错误' };
    }
    
    // 创建会话
    const sessionId = await createSession(user.id, user.role, ipAddress, userAgent);
    
    // 更新最后登录时间
    await database.run('UPDATE users SET last_login = datetime("now") WHERE id = ?', [user.id]);
    
    await logSecurityEvent('login_success', 'low', `登录成功 - ${username}`, user.id, ipAddress, userAgent);
    
    return {
      success: true,
      sessionId,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        level: user.level,
        status: user.status
      }
    };
  } catch (error) {
    await logSecurityEvent('login_error', 'high', `登录异常：${error}`, undefined, ipAddress, userAgent);
    return { success: false, error: '登录失败，请重试' };
  }
}

export async function registerUser(userData: { username: string; password: string; name?: string; role?: string }) {
  try {
    // 验证输入
    const validatedData = await validateData(UserRegisterSchema, userData);
    
    const database = await getDatabase();
    
    // 检查用户名是否已存在
    const existingUser = await database.get('SELECT id FROM users WHERE username = ?', [validatedData.username]);
    if (existingUser) {
      return { success: false, error: '用户名已存在' };
    }
    
    // 创建用户
    const userId = 'u' + Date.now();
    const passwordHash = hashPassword(validatedData.password);
    
    await database.run(`
      INSERT INTO users (id, username, name, role, password_hash, level)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, validatedData.username, validatedData.name || validatedData.username, validatedData.role, JSON.stringify(passwordHash), '普通刷手']);
    
    // 创建钱包
    await database.run('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [userId, 0]);
    
    return { success: true, userId };
  } catch (error) {
    return { success: false, error: '注册失败，请重试' };
  }
}

export async function validateUserSession(sessionId: string, ipAddress?: string) {
  try {
    const session = await validateSession(sessionId, ipAddress);
    if (!session) {
      return { valid: false, error: '会话无效' };
    }
    
    const database = await getDatabase();
    const user = await database.get('SELECT * FROM users WHERE id = ?', [session.userId]);
    
    if (!user || user.status !== 'active') {
      await destroySession(sessionId);
      return { valid: false, error: '用户状态异常' };
    }
    
    return {
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        level: user.level,
        status: user.status
      }
    };
  } catch (error) {
    return { valid: false, error: '会话验证失败' };
  }
}






