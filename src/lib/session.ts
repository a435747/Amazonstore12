import { randomBytes, createHash } from 'crypto';
import { getDatabase } from './database';

export interface Session {
  id: string;
  userId: string;
  userRole: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
}

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24小时

export async function createSession(userId: string, userRole: string, ipAddress: string, userAgent: string): Promise<string> {
  const sessionId = randomBytes(32).toString('hex');
  const database = await getDatabase();
  await database.run(`
    INSERT INTO sessions (id, user_id, user_role, created_at, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, datetime('now'), datetime('now', '+24 hours'), ?, ?)
  `, [sessionId, userId, userRole, ipAddress, userAgent]);
  
  return sessionId;
}

export async function validateSession(sessionId: string, ipAddress?: string): Promise<Session | null> {
  const database = await getDatabase();
  const session = await database.get(`
    SELECT * FROM sessions 
    WHERE id = ? AND expires_at > datetime('now')
  `, [sessionId]);
  
  if (!session) {
    return null;
  }
  
  // 可选：验证IP地址（安全增强）
  // 忽略 unknown 或空值，避免本地/代理环境导致的误判；仅当两侧均为有效且不为 'unknown' 时才严格比较
  const providedIp = (ipAddress || '').trim();
  const storedIp = (session.ip_address || '').trim();
  const isValidProvided = providedIp && providedIp.toLowerCase() !== 'unknown';
  const isValidStored = storedIp && storedIp.toLowerCase() !== 'unknown';
  if (isValidProvided && isValidStored && providedIp !== storedIp) {
    await logSecurityEvent('session_ip_mismatch', 'medium', `Session IP mismatch: ${storedIp} vs ${providedIp}`, session.user_id);
    // 放宽处理：记录告警但不使会话失效
  }
  
  return {
    id: session.id,
    userId: session.user_id,
    userRole: session.user_role,
    createdAt: new Date(session.created_at),
    expiresAt: new Date(session.expires_at),
    ipAddress: session.ip_address,
    userAgent: session.user_agent
  };
}

export async function refreshSession(sessionId: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.run(`
    UPDATE sessions 
    SET expires_at = datetime('now', '+24 hours') 
    WHERE id = ? AND expires_at > datetime('now')
  `, [sessionId]);
  
  return result.changes > 0;
}

export async function destroySession(sessionId: string): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.run('DELETE FROM sessions WHERE id = ?', [sessionId]);
  return result.changes > 0;
}

export async function destroyUserSessions(userId: string): Promise<number> {
  const database = await getDatabase();
  const result = await database.run('DELETE FROM sessions WHERE user_id = ?', [userId]);
  return result.changes || 0;
}

export async function cleanupExpiredSessions(): Promise<number> {
  const database = await getDatabase();
  const result = await database.run('DELETE FROM sessions WHERE expires_at <= datetime("now")');
  return result.changes || 0;
}

export async function getActiveSessions(userId: string): Promise<Session[]> {
  const database = await getDatabase();
  const sessions = await database.all(`
    SELECT * FROM sessions 
    WHERE user_id = ? AND expires_at > datetime('now')
    ORDER BY created_at DESC
  `, [userId]);
  
  return sessions.map(session => ({
    id: session.id,
    userId: session.user_id,
    userRole: session.user_role,
    createdAt: new Date(session.created_at),
    expiresAt: new Date(session.expires_at),
    ipAddress: session.ip_address,
    userAgent: session.user_agent
  }));
}

async function logSecurityEvent(type: string, level: string, message: string, userId?: string) {
  const database = await getDatabase();
  await database.run(`
    INSERT INTO security_logs (id, type, level, message, user_id, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `, [randomBytes(16).toString('hex'), type, level, message, userId]);
}

// 初始化会话表
export async function initSessionTable() {
  const database = await getDatabase();
  await database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      created_at DATETIME NOT NULL,
      expires_at DATETIME NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
  
  // 创建索引
  await database.exec('CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)');
  await database.exec('CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at)');
}
