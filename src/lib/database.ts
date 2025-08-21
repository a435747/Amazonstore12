import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
	if (!db) {
		const dbPath = path.join(process.cwd(), 'data', 'app.db');
		db = await open({
			filename: dbPath,
			driver: sqlite3.Database
		});
		
		// 初始化数据库表
		await initDatabase();
	}
	return db;
}

async function initDatabase() {
	const database = await getDatabase();
	
	// 用户表
	await database.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			username TEXT UNIQUE NOT NULL,
			name TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'user',
			password_hash TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'active',
			level TEXT NOT NULL DEFAULT '普通刷手',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			last_login DATETIME,
			login_attempts INTEGER DEFAULT 0,
			locked_until DATETIME
		)
	`);

	// 钱包表
	await database.exec(`
		CREATE TABLE IF NOT EXISTS wallets (
			user_id TEXT PRIMARY KEY,
			balance REAL DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users (id)
		)
	`);

	// 任务表
	await database.exec(`
		CREATE TABLE IF NOT EXISTS tasks (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			merchant TEXT NOT NULL,
			amount REAL NOT NULL,
			commission REAL NOT NULL,
			stock INTEGER NOT NULL DEFAULT 1,
			status TEXT NOT NULL DEFAULT 'draft',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// 任务认领表
	await database.exec(`
		CREATE TABLE IF NOT EXISTS task_claims (
			id TEXT PRIMARY KEY,
			task_id TEXT NOT NULL,
			user_id TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'claimed',
			claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			completed_at DATETIME,
			evidence_url TEXT,
			note TEXT,
			review_status TEXT DEFAULT 'pending',
			reviewed_at DATETIME,
			reviewed_by TEXT,
			FOREIGN KEY (task_id) REFERENCES tasks (id),
			FOREIGN KEY (user_id) REFERENCES users (id)
		)
	`);

	// 财务记录表
	await database.exec(`
		CREATE TABLE IF NOT EXISTS finance_records (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			type TEXT NOT NULL,
			amount REAL NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			method TEXT,
			description TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			processed_at DATETIME,
			processed_by TEXT,
			FOREIGN KEY (user_id) REFERENCES users (id)
		)
	`);

	// 系统设置表
	await database.exec(`
		CREATE TABLE IF NOT EXISTS settings (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// 站内通知/公告表（面向所有用户或指定用户）
	await database.exec(`
		CREATE TABLE IF NOT EXISTS announcements (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			message TEXT NOT NULL,
			type TEXT NOT NULL DEFAULT 'info',
			target TEXT NOT NULL DEFAULT 'all', -- all | user
			target_user_id TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (target_user_id) REFERENCES users (id)
		)
	`);

	// 安全日志表
	await database.exec(`
		CREATE TABLE IF NOT EXISTS security_logs (
			id TEXT PRIMARY KEY,
			type TEXT NOT NULL,
			level TEXT NOT NULL,
			message TEXT NOT NULL,
			user_id TEXT,
			ip_address TEXT,
			user_agent TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// 订单表（增加 user_id、commission 字段用于佣金归属与金额）
	await database.exec(`
		CREATE TABLE IF NOT EXISTS orders (
			id TEXT PRIMARY KEY,
			code TEXT UNIQUE NOT NULL,
			customer_name TEXT NOT NULL,
			total_amount REAL NOT NULL,
			status TEXT NOT NULL,
			user_id TEXT,
			commission REAL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users (id)
		)
	`);

	// 订单项表
	await database.exec(`
		CREATE TABLE IF NOT EXISTS order_items (
			id TEXT PRIMARY KEY,
			order_code TEXT NOT NULL,
			sku TEXT NOT NULL,
			name TEXT NOT NULL,
			quantity INTEGER NOT NULL,
			price REAL NOT NULL,
			FOREIGN KEY (order_code) REFERENCES orders (code)
		)
	`);

	// 钱包流水表（用于每次余额变动的审计追踪）
	await database.exec(`
		CREATE TABLE IF NOT EXISTS wallet_ledger (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			change REAL NOT NULL,
			balance_before REAL NOT NULL,
			balance_after REAL NOT NULL,
			ref_type TEXT NOT NULL,
			ref_id TEXT,
			description TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users (id)
		)
	`);

	// 插入默认数据（仅保留管理员）
	await insertDefaultData();
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

async function insertDefaultData() {
	const database = await getDatabase();

	// 保留默认管理员，仅在不存在时创建
	const adminUser = await database.get('SELECT * FROM users WHERE username = ?', ['admin']);
	if (!adminUser) {
		const { hashPassword } = await import('./auth');
		const adminPasswordHash = JSON.stringify(hashPassword('admin123'));
		await database.run(`
			INSERT INTO users (id, username, name, role, password_hash, level)
			VALUES (?, ?, ?, ?, ?, ?)
		`, ['adm1', 'admin', '管理员', 'admin', adminPasswordHash, '代理']);
		await database.run(`
			INSERT INTO wallets (user_id, balance)
			VALUES (?, ?)
		`, ['adm1', 0]);
	}

	// 初始化会话表
	await initSessionTable();

	// 轻量迁移：确保 orders 存在 user_id 与 commission 列
	try {
		const cols: any[] = await database.all(`PRAGMA table_info('orders')`);
		const hasUserId = cols.some((c: any) => c.name === 'user_id');
		const hasCommission = cols.some((c: any) => c.name === 'commission');
		if (!hasUserId) {
			await database.exec(`ALTER TABLE orders ADD COLUMN user_id TEXT`);
		}
		if (!hasCommission) {
			await database.exec(`ALTER TABLE orders ADD COLUMN commission REAL`);
		}
	} catch (e) {
		// 忽略列已存在等错误
	}
}

export async function closeDatabase() {
	if (db) {
		await db.close();
		db = null;
	}
}
