const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: path.join(process.cwd(), 'data', 'app.db'), driver: sqlite3.Database });
  try {
    const row = await db.get('SELECT id, username, role, status, password_hash FROM users WHERE username = ?', ['admin']);
    console.log(JSON.stringify(row, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await db.close();
  }
})();


