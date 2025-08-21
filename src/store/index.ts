import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 用户状态
interface User {
  id: string;
  name: string;
  role: 'user' | 'admin';
  level: string;
  status: string;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setUser: (user) => set({ user, isAuthenticated: !!user, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      logout: () => set({ user: null, isAuthenticated: false, error: null }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// 应用状态
interface AppState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
  setTheme: (theme: 'light' | 'dark') => void;
  setSidebarOpen: (open: boolean) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  createdAt: Date;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarOpen: false,
      notifications: [],
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      addNotification: (notification) => {
        const notifications = [...get().notifications, notification];
        set({ notifications });
        
        // 自动移除通知
        if (notification.duration !== 0) {
          setTimeout(() => {
            get().removeNotification(notification.id);
          }, notification.duration || 5000);
        }
      },
      removeNotification: (id) => {
        const notifications = get().notifications.filter(n => n.id !== id);
        set({ notifications });
      },
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// 任务状态
interface Task {
  id: string;
  title: string;
  merchant: string;
  amount: number;
  commission: number;
  stock: number;
  status: string;
  createdAt: string;
}

interface TaskState {
  tasks: Task[];
  myTasks: Task[];
  isLoading: boolean;
  error: string | null;
  setTasks: (tasks: Task[]) => void;
  setMyTasks: (tasks: Task[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  myTasks: [],
  isLoading: false,
  error: null,
  setTasks: (tasks) => set({ tasks, error: null }),
  setMyTasks: (myTasks) => set({ myTasks, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addTask: (task) => {
    const tasks = [...get().tasks, task];
    set({ tasks });
  },
  updateTask: (id, updates) => {
    const tasks = get().tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    );
    const myTasks = get().myTasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    );
    set({ tasks, myTasks });
  },
  removeTask: (id) => {
    const tasks = get().tasks.filter(task => task.id !== id);
    const myTasks = get().myTasks.filter(task => task.id !== id);
    set({ tasks, myTasks });
  },
}));

// 钱包状态
interface Wallet {
  userId: string;
  balance: number;
}

interface WalletState {
  wallet: Wallet | null;
  isLoading: boolean;
  error: string | null;
  setWallet: (wallet: Wallet | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateBalance: (amount: number) => void;
}

export const useWalletStore = create<WalletState>()((set, get) => ({
  wallet: null,
  isLoading: false,
  error: null,
  setWallet: (wallet) => set({ wallet, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  updateBalance: (amount) => {
    const wallet = get().wallet;
    if (wallet) {
      set({ wallet: { ...wallet, balance: amount } });
    }
  },
}));

// 系统设置状态
interface Settings {
  siteName: string;
  customerService: string;
  commissionRate: number;
  minWithdraw: number;
  maxWithdraw: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

interface SettingsState {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
  setSettings: (settings: Settings) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSettings: (updates: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,
  setSettings: (settings) => set({ settings, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  updateSettings: (updates) => {
    const settings = get().settings;
    if (settings) {
      set({ settings: { ...settings, ...updates } });
    }
  },
}));

// 通知工具函数
export const notify = {
  success: (title: string, message: string, duration?: number) => {
    useAppStore.getState().addNotification({
      id: Date.now().toString(),
      type: 'success',
      title,
      message,
      duration,
      createdAt: new Date(),
    });
  },
  error: (title: string, message: string, duration?: number) => {
    useAppStore.getState().addNotification({
      id: Date.now().toString(),
      type: 'error',
      title,
      message,
      duration,
      createdAt: new Date(),
    });
  },
  warning: (title: string, message: string, duration?: number) => {
    useAppStore.getState().addNotification({
      id: Date.now().toString(),
      type: 'warning',
      title,
      message,
      duration,
      createdAt: new Date(),
    });
  },
  info: (title: string, message: string, duration?: number) => {
    useAppStore.getState().addNotification({
      id: Date.now().toString(),
      type: 'info',
      title,
      message,
      duration,
      createdAt: new Date(),
    });
  },
};
