export type OrderStatus = 'completed' | 'processing' | 'pending';

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  price: number; // 单价，单位：元
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string; // ISO 字符串
  items?: OrderItem[];
}

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username?: string;
  passwordHash?: {
    salt: string;
    hash: string;
    iterations: number;
    keylen: number;
    digest: string;
  };
}

export interface Wallet {
  userId: string;
  balance: number;
}

export interface GrabOrder {
  code: string;
  address: string;
  amount: number;
  distanceKm: number;
  claimedBy?: string; // userId
}

export type TaskStatus = 'open' | 'in_progress' | 'pending_review' | 'approved' | 'rejected';

export interface Task {
  id: string;
  title: string;
  merchant: string;
  amount: number; // 任务订单金额
  commission: number; // 佣金
  status: TaskStatus;
  stock: number; // 可抢数量
  createdAt: string;
  claimedByUserIds: string[]; // 抢到该任务的用户 ID 列表
}

export interface Submission {
  id: string;
  taskId: string;
  userId: string;
  note?: string;
  evidenceUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
}


