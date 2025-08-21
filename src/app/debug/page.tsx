"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DebugPage() {
  const [cookies, setCookies] = useState<string>('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // 显示当前cookie
    setCookies(document.cookie);
    
    // 检查登录状态
    fetch('/api/auth/me')
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setUserInfo(data);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  const clearCookies = () => {
    document.cookie = 'uid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.reload();
  };

  const testRedirect = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🔧 系统调试页面</h1>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">当前状态</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-300">登录状态:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                isLoggedIn === null ? 'bg-gray-500/20 text-gray-300' :
                isLoggedIn ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {isLoggedIn === null ? '检查中...' : isLoggedIn ? '已登录' : '未登录'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">Cookie:</span>
              <span className="text-white text-sm">{cookies || '无Cookie'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">用户信息</h2>
          <pre className="bg-black/20 p-4 rounded-lg text-blue-400 text-sm overflow-x-auto">
            {userInfo ? JSON.stringify(userInfo, null, 2) : '未登录'}
          </pre>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">测试操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={clearCookies}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              🗑️ 清除所有Cookie
            </button>
            <button
              onClick={testRedirect}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              🏠 测试首页重定向
            </button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">测试步骤</h2>
          <div className="text-gray-300 space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
              <div>
                <div className="font-medium">检查当前状态</div>
                <div className="text-sm text-gray-400">查看是否已登录，以及Cookie状态</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
              <div>
                <div className="font-medium">清除Cookie</div>
                <div className="text-sm text-gray-400">点击"清除所有Cookie"按钮</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
              <div>
                <div className="font-medium">测试重定向</div>
                <div className="text-sm text-gray-400">点击"测试首页重定向"，应该会跳转到登录页面</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</span>
              <div>
                <div className="font-medium">登录测试</div>
                <div className="text-sm text-gray-400">使用测试账户登录：用户名 <code className="bg-gray-700 px-1 rounded">user1</code>，密码 <code className="bg-gray-700 px-1 rounded">123456</code></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
          <h2 className="text-xl font-bold text-white mb-4">快速链接</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/login" className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-center">
              🔐 登录页面
            </Link>
            <Link href="/register" className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-center">
              📝 注册页面
            </Link>
            <Link href="/force-logout" className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-center">
              🚪 强制登出
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

