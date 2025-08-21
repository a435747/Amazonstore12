"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  role: 'user' | 'admin';
}

export default function NavBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        setUser(d.data);
      })
      .catch(() => {});
  }, []);

  // 未登录或管理员：不显示底部导航
  if (!user || user.role === 'admin') return null;

  const publicPaths = ['/login', '/register', '/debug', '/force-logout', '/test-middleware', '/test-auth', '/test-middleware-simple'];
  if (publicPaths.includes(pathname)) return null;

  const navItems = [
    { href: '/', label: '首页', icon: '🏠' },
    { href: '/tasks', label: '任务', icon: '🎯' },
    { href: '/grab', label: '抢单', icon: '🚀' },
    { href: '/orders', label: '订单', icon: '📋' },
    { href: '/reports', label: '报表', icon: '📊' },
    { href: '/me', label: '我的', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-sm border-t border-white/20 z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href as string}
              href={item.href as Route}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-blue-400 bg-blue-500/20'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


