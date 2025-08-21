// Reset admin password to admin123 with proper JSON hash structure
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { pbkdf2Sync, randomBytes } = require('crypto');

(async () => {
  const db = await open({ filename: path.join(process.cwd(), 'data', 'app.db'), driver: sqlite3.Database });
  try {
    const admin = await db.get("SELECT id, username FROM users WHERE username='admin'");
    if (!admin) {
      console.error('admin 用户不存在');
      process.exit(2);
    }
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
    await db.run('UPDATE users SET password_hash = ?, status = ? WHERE username = ?', [passwordJson, 'active', 'admin']);
    console.log('已重置 admin 密码为 admin123');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await db.close();
  }
})();


