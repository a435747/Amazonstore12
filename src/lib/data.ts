import { getDatabase } from '@/lib/database';
import { validateUserSession } from '@/lib/auth';
import { validateData, TaskCreateSchema, TaskClaimSchema, TaskSubmitSchema, FinanceOperationSchema } from '@/lib/validation';
import { logSecurityEvent } from '@/lib/security';

// 类型定义
export interface User {
	id: string;
	name: string;
	role: 'user' | 'admin';
	username: string;
	level: string;
	status: string;
	createdAt: string;
	lastLogin?: string;
}

export interface Wallet {
	userId: string;
	balance: number;
	createdAt: string;
	updatedAt: string;
}

export interface Task {
	id: string;
	title: string;
	merchant: string;
	amount: number;
	commission: number;
	stock: number;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export interface TaskClaim {
	id: string;
	taskId: string;
	userId: string;
	status: string;
	claimedAt: string;
	completedAt?: string;
	evidenceUrl?: string;
	note?: string;
	reviewStatus: string;
	reviewedAt?: string;
	reviewedBy?: string;
}

export interface FinanceRecord {
	id: string;
	userId: string;
	type: string;
	amount: number;
	status: string;
	method?: string;
	description?: string;
	createdAt: string;
	processedAt?: string;
	processedBy?: string;
}

export interface OrderItem {
	sku: string;
	name: string;
	quantity: number;
	price: number;
}

export interface Order {
	id: string;
	code: string;
	customerName: string;
	totalAmount: number;
	status: string;
	userId?: string;
	commission?: number;
	createdAt: string;
	items?: OrderItem[];
}

// 用户相关函数
export async function getUserById(userId: string): Promise<User | null> {
	try {
		const database = await getDatabase();
		const user = await database.get('SELECT * FROM users WHERE id = ?', [userId]);
		return user ? {
			id: user.id,
			name: user.name,
			role: user.role,
			username: user.username,
			level: user.level,
			status: user.status,
			createdAt: user.created_at,
			lastLogin: user.last_login
		} : null;
	} catch (error) {
		console.error('Get user by ID error:', error);
		return null;
	}
}

export async function getUserByUsername(username: string): Promise<User | null> {
	try {
		const database = await getDatabase();
		const user = await database.get('SELECT * FROM users WHERE username = ?', [username]);
		return user ? {
			id: user.id,
			name: user.name,
			role: user.role,
			username: user.username,
			level: user.level,
			status: user.status,
			createdAt: user.created_at,
			lastLogin: user.last_login
		} : null;
	} catch (error) {
		console.error('Get user by username error:', error);
		return null;
	}
}

export async function getAllUsers(): Promise<User[]> {
	try {
		const database = await getDatabase();
		const users = await database.all('SELECT * FROM users ORDER BY created_at DESC');
		return users.map((user: any) => ({
			id: user.id,
			name: user.name,
			role: user.role,
			username: user.username,
			level: user.level,
			status: user.status,
			createdAt: user.created_at,
			lastLogin: user.last_login
		}));
	} catch (error) {
		console.error('Get all users error:', error);
		return [];
	}
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
	try {
		const database = await getDatabase();
		const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'createdAt' && key !== 'lastLogin');
		const values = fields.map(field => (updates as any)[field]);
		
		if (fields.length === 0) return false;
		
		const query = `UPDATE users SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`;
		const result = await database.run(query, [...values, userId]);
		
		return result.changes > 0;
	} catch (error) {
		console.error('Update user error:', error);
		return false;
	}
}

// 钱包相关函数
export async function getWallet(userId: string): Promise<Wallet | null> {
	try {
		const database = await getDatabase();
		const wallet = await database.get('SELECT * FROM wallets WHERE user_id = ?', [userId]);
		return wallet ? {
			userId: wallet.user_id,
			balance: wallet.balance,
			createdAt: wallet.created_at,
			updatedAt: wallet.updated_at
		} : null;
	} catch (error) {
		console.error('Get wallet error:', error);
		return null;
	}
}

export async function updateWalletBalance(userId: string, amount: number): Promise<boolean> {
	try {
		return updateWalletBalanceWithMeta(userId, amount, 'manual', '', '余额变更');
	} catch (error) {
		console.error('Update wallet balance error:', error);
		return false;
	}
}

export async function updateWalletBalanceWithMeta(
	userId: string,
	amount: number,
	refType: string,
	refId: string,
	description?: string
): Promise<boolean> {
	try {
		const database = await getDatabase();
		const current = await database.get('SELECT balance FROM wallets WHERE user_id = ?', [userId]);
		if (!current) return false;
		const before = Number(current.balance || 0);
		const after = before + amount;
		const ok = await database.run(
			'UPDATE wallets SET balance = ?, updated_at = datetime("now") WHERE user_id = ?',
			[after, userId]
		);
		if (ok.changes > 0) {
			await database.run(
				'INSERT INTO wallet_ledger (id, user_id, change, balance_before, balance_after, ref_type, ref_id, description) VALUES (?,?,?,?,?,?,?,?)',
				['wlt' + Date.now(), userId, amount, before, after, refType, refId, description || '']
			);
			return true;
		}
		return false;
	} catch (error) {
		console.error('Update wallet with meta error:', error);
		return false;
	}
}

// 任务相关函数
export async function getAllTasks(): Promise<Task[]> {
	try {
		const database = await getDatabase();
		const tasks = await database.all('SELECT * FROM tasks ORDER BY created_at DESC');
		return tasks.map((task: any) => ({
			id: task.id,
			title: task.title,
			merchant: task.merchant,
			amount: task.amount,
			commission: task.commission,
			stock: task.stock,
			status: task.status,
			createdAt: task.created_at,
			updatedAt: task.updated_at
		}));
	} catch (error) {
		console.error('Get all tasks error:', error);
		return [];
	}
}

export async function getTaskById(taskId: string): Promise<Task | null> {
	try {
		const database = await getDatabase();
		const task = await database.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
		return task ? {
			id: task.id,
			title: task.title,
			merchant: task.merchant,
			amount: task.amount,
			commission: task.commission,
			stock: task.stock,
			status: task.status,
			createdAt: task.created_at,
			updatedAt: task.updated_at
		} : null;
	} catch (error) {
		console.error('Get task by ID error:', error);
		return null;
	}
}

export async function createTask(taskData: any): Promise<Task | null> {
	try {
		const validatedData = await validateData(TaskCreateSchema, taskData);
		const database = await getDatabase();
		
		const taskId = 'task' + Date.now();
		const result = await database.run(`
			INSERT INTO tasks (id, title, merchant, amount, commission, stock, status)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`, [taskId, validatedData.title, validatedData.merchant, validatedData.amount, validatedData.commission, validatedData.stock, 'open']);
		
		if (result.changes > 0) {
			return getTaskById(taskId);
		}
		return null;
	} catch (error) {
		console.error('Create task error:', error);
		return null;
	}
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
	try {
		const database = await getDatabase();
		const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt');
		const values = fields.map(field => (updates as any)[field]);
		
		if (fields.length === 0) return false;
		
		const query = `UPDATE tasks SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = datetime("now") WHERE id = ?`;
		const result = await database.run(query, [...values, taskId]);
		
		return result.changes > 0;
	} catch (error) {
		console.error('Update task error:', error);
		return false;
	}
}

// 任务认领相关函数
export async function claimTask(taskId: string, userId: string): Promise<TaskClaim | null> {
	try {
		const validatedData = await validateData(TaskClaimSchema, { taskId });
		const database = await getDatabase();
		
		// 检查任务是否存在且可抢
		const task = await getTaskById(validatedData.taskId);
		if (!task || task.status !== 'open' || task.stock <= 0) {
			throw new Error('任务不可抢');
		}
		
		// 检查用户是否已经抢过这个任务
		const existingClaim = await database.get(
			'SELECT * FROM task_claims WHERE task_id = ? AND user_id = ?',
			[validatedData.taskId, userId]
		);
		
		if (existingClaim) {
			throw new Error('您已经抢过这个任务');
		}
		
		const claimId = 'claim' + Date.now();
		const result = await database.run(`
			INSERT INTO task_claims (id, task_id, user_id, status, review_status)
			VALUES (?, ?, ?, ?, ?)
		`, [claimId, validatedData.taskId, userId, 'claimed', 'pending']);
		
		if (result.changes > 0) {
			// 更新任务库存
			await updateTask(validatedData.taskId, { stock: task.stock - 1 });
			
			return {
				id: claimId,
				taskId: validatedData.taskId,
				userId,
				status: 'claimed',
				claimedAt: new Date().toISOString(),
				reviewStatus: 'pending'
			};
		}
		return null;
	} catch (error) {
		console.error('Claim task error:', error);
		throw error;
	}
}

export async function submitTask(taskId: string, userId: string, note: string, evidenceUrl?: string): Promise<TaskClaim | null> {
	try {
		const validatedData = await validateData(TaskSubmitSchema, { taskId, note, evidenceUrl });
		const database = await getDatabase();
		
		const result = await database.run(`
			UPDATE task_claims 
			SET status = ?, note = ?, evidence_url = ?, review_status = ?
			WHERE task_id = ? AND user_id = ?
		`, ['submitted', validatedData.note, validatedData.evidenceUrl, 'pending', validatedData.taskId, userId]);
		
		if (result.changes > 0) {
			// 更新任务状态
			await updateTask(validatedData.taskId, { status: 'pending_review' });
			
			return {
				id: 'temp',
				taskId: validatedData.taskId,
				userId,
				status: 'submitted',
				claimedAt: new Date().toISOString(),
				note: validatedData.note,
				evidenceUrl: validatedData.evidenceUrl,
				reviewStatus: 'pending'
			};
		}
		return null;
	} catch (error) {
		console.error('Submit task error:', error);
		throw error;
	}
}

// 财务相关函数
export async function createFinanceRecord(recordData: any): Promise<FinanceRecord | null> {
	try {
		const validatedData = await validateData(FinanceOperationSchema, recordData);
		const database = await getDatabase();
		
		const recordId = 'fin' + Date.now();
		const result = await database.run(`
			INSERT INTO finance_records (id, user_id, type, amount, status, method, description)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`, [recordId, recordData.userId, validatedData.type, validatedData.amount, 'pending', validatedData.method, validatedData.description]);
		
		if (result.changes > 0) {
			return {
				id: recordId,
				userId: recordData.userId,
				type: validatedData.type,
				amount: validatedData.amount,
				status: 'pending',
				method: validatedData.method,
				description: validatedData.description,
				createdAt: new Date().toISOString()
			};
		}
		return null;
	} catch (error) {
		console.error('Create finance record error:', error);
		return null;
	}
}

export async function getAllFinanceRecords(): Promise<FinanceRecord[]> {
	try {
		const database = await getDatabase();
		const records = await database.all(`
			SELECT fr.*, u.name as user_name 
			FROM finance_records fr 
			JOIN users u ON fr.user_id = u.id 
			ORDER BY fr.created_at DESC
		`);
		
		return records.map((record: any) => ({
			id: record.id,
			userId: record.user_id,
			type: record.type,
			amount: record.amount,
			status: record.status,
			method: record.method,
			description: record.description,
			createdAt: record.created_at,
			processedAt: record.processed_at,
			processedBy: record.processed_by
		}));
	} catch (error) {
		console.error('Get all finance records error:', error);
		return [];
	}
}

// 系统设置相关函数
export async function getSettings(): Promise<Record<string, string>> {
	try {
		const database = await getDatabase();
		const settings = await database.all('SELECT key, value FROM settings');
		const result: Record<string, string> = {};
		
		settings.forEach((setting: any) => {
			result[setting.key] = setting.value;
		});
		
		return result;
	} catch (error) {
		console.error('Get settings error:', error);
		return {};
	}
}

export async function updateSettings(updates: Record<string, string>): Promise<boolean> {
	try {
		const database = await getDatabase();
		
		for (const [key, value] of Object.entries(updates)) {
			await database.run(
				'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))',
				[key, value]
			);
		}
		
		return true;
	} catch (error) {
		console.error('Update settings error:', error);
		return false;
	}
}

// 订单（数据库）
export async function getOrders(): Promise<Order[]> {
	const database = await getDatabase();
	const rows = await database.all('SELECT * FROM orders ORDER BY created_at DESC');
	return rows.map((r: any) => ({
		id: r.id,
		code: r.code,
		customerName: r.customer_name,
		totalAmount: r.total_amount,
		status: r.status,
		userId: r.user_id,
		commission: r.commission,
		createdAt: r.created_at
	}));
}

export async function getOrderByCode(code: string): Promise<Order | undefined> {
	const database = await getDatabase();
	const order = await database.get('SELECT * FROM orders WHERE code = ?', [code]);
	if (!order) return undefined;
	const items = await database.all('SELECT sku, name, quantity, price FROM order_items WHERE order_code = ?', [code]);
	return {
		id: order.id,
		code: order.code,
		customerName: order.customer_name,
		totalAmount: order.total_amount,
		status: order.status,
		userId: order.user_id,
		commission: order.commission,
		createdAt: order.created_at,
		items
	};
}

// 抢单相关（无初始数据，返回空实现）
export function listGrabOrders() {
	return [] as { code: string; address: string; amount: number; distanceKm: number }[];
}

export function claimGrabOrder(code: string, userId: string) {
	throw new Error('当前暂无可抢订单');
}


// 站内公告/通知
export interface Announcement {
	id: string;
	title: string;
	message: string;
	type: 'info' | 'success' | 'warning' | 'error';
	target: 'all' | 'user';
	targetUserId?: string;
	createdAt: string;
}

export async function createAnnouncement(input: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement | null> {
	try {
		const database = await getDatabase();
		const id = 'ann' + Date.now();
		const { title, message, type, target, targetUserId } = input as any;
		const res = await database.run(
			'INSERT INTO announcements (id, title, message, type, target, target_user_id) VALUES (?,?,?,?,?,?)',
			[id, title, message, (type || 'info'), (target || 'all'), (target === 'user' ? (targetUserId || null) : null)]
		);
		if (res.changes > 0) {
			return {
				id,
				title,
				message,
				type: (type || 'info') as any,
				target: (target || 'all') as any,
				targetUserId: target === 'user' ? (targetUserId || undefined) : undefined,
				createdAt: new Date().toISOString(),
			};
		}
		return null;
	} catch (e) {
		console.error('createAnnouncement error', e);
		return null;
	}
}

export async function listAnnouncements(forUserId?: string, limit = 20): Promise<Announcement[]> {
	try {
		const database = await getDatabase();
		let rows: any[] = [];
		if (forUserId) {
			rows = await database.all(
				`SELECT * FROM announcements WHERE target='all' OR (target='user' AND target_user_id=?) ORDER BY created_at DESC LIMIT ?`,
				[forUserId, limit]
			);
		} else {
			rows = await database.all(`SELECT * FROM announcements ORDER BY created_at DESC LIMIT ?`, [limit]);
		}
		return rows.map((r: any) => ({
			id: r.id,
			title: r.title,
			message: r.message,
			type: r.type,
			target: r.target,
			targetUserId: r.target_user_id || undefined,
			createdAt: r.created_at,
		}));
	} catch (e) {
		console.error('listAnnouncements error', e);
		return [];
	}
}
