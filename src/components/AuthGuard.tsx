"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser } = useUserStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.data);
        } else {
          setUser(null);
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        router.push('/login');
      } finally {
        setIsChecking(false);
      }
    };

    if (!isAuthenticated && !isLoading) {
      checkAuth();
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, isLoading, setUser, router]);

  // 显示加载状态
  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-lg">验证中...</div>
        </div>
      </div>
    );
  }

  // 未登录
  if (!isAuthenticated || !user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg mb-4">请先登录</div>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  // 检查角色权限（管理员可访问用户权限页面）
  if (requiredRole) {
    const hasRole = user.role === requiredRole || (requiredRole === 'user' && user.role === 'admin');
    if (!hasRole) {
      if (fallback) {
        return <>{fallback}</>;
      }
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-lg mb-4">权限不足</div>
            <div className="text-gray-400 text-sm mb-4">您没有访问此页面的权限</div>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      );
    }
  }

  // 检查用户状态
  if (user.status !== 'active') {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg mb-4">账户状态异常</div>
          <div className="text-gray-400 text-sm mb-4">
            {user.status === 'suspended' && '您的账户已被暂停'}
            {user.status === 'blacklisted' && '您的账户已被封禁'}
          </div>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            重新登录
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// 管理员专用守卫
export function AdminGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="admin" fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

// 用户专用守卫
export function UserGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="user" fallback={fallback}>
      {children}
    </AuthGuard>
  );
}
