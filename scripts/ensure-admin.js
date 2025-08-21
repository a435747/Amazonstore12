// Ensure default admin exists in SQLite and is active
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { pbkdf2Sync, randomBytes } = require('crypto');

(async () => {
  const dbPath = path.join(process.cwd(), 'data', 'app.db');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  try {
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
    const hasUsers = tables.some(t => t.name === 'users');
    if (!hasUsers) {
      console.error('[ensure-admin] users 表不存在，请先运行应用以初始化数据库');
      process.exit(2);
    }

    const admin = await db.get("SELECT id, username, role, status FROM users WHERE username = ?", ['admin']);
    if (!admin) {
      const id = 'adm' + Date.now();
      const salt = randomBytes(32);
      const iterations = 100000;
      const keylen = 64;
      const digest = 'sha512';
      const hash = pbkdf2Sync('admin123', salt, iterations, keylen, digest);
      const passwordJson = JSON.stringify({
        salt: salt.toString('hex'),
        hash: hash.toString('hex'),
        iterations,
        keylen,
        digest,
      });
      await db.run(
        `INSERT INTO users (id, username, name, role, password_hash, level, status) VALUES (?,?,?,?,?,?,?)`,
        [id, 'admin', '管理员', 'admin', passwordJson, '代理', 'active']
      );
      await db.run(`INSERT OR IGNORE INTO wallets (user_id, balance) VALUES (?, ?)`, [id, 0]);
      console.log('[ensure-admin] 已创建默认管理员：admin / admin123');
    } else {
      // 确保其为 admin 且 active
      await db.run(`UPDATE users SET role='admin', status='active' WHERE username='admin'`);
      console.log('[ensure-admin] 已确认管理员存在：', admin);
    }

    // 输出会话表存在与否
    const hasSessions = tables.some(t => t.name === 'sessions');
    if (hasSessions) {
      const sc = await db.get('SELECT COUNT(1) as cnt FROM sessions');
      console.log('[ensure-admin] 当前会话数量：', sc?.cnt || 0);
    } else {
      console.warn('[ensure-admin] sessions 表不存在，会在应用首次运行时自动初始化');
    }
  } catch (e) {
    console.error('[ensure-admin] 失败：', e);
    process.exit(1);
  } finally {
    await db.close();
  }
})();


