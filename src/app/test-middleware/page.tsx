"use client";

import { useEffect, useState } from 'react';

export default function TestMiddlewarePage() {
  const [cookies, setCookies] = useState<string>('');
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // 显示当前cookie
    setCookies(document.cookie);
    
    // 尝试获取用户信息
    fetch('/api/auth/me')
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setUserInfo(data);
        }
      })
      .catch(() => {});
  }, []);

  const clearCookies = () => {
    document.cookie = 'uid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">中间件测试页面</h1>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">当前Cookie</h2>
          <pre className="bg-black/20 p-4 rounded-lg text-green-400 text-sm overflow-x-auto">
            {cookies || '无Cookie'}
          </pre>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">用户信息</h2>
          <pre className="bg-black/20 p-4 rounded-lg text-blue-400 text-sm overflow-x-auto">
            {userInfo ? JSON.stringify(userInfo, null, 2) : '未登录'}
          </pre>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">测试操作</h2>
          <div className="space-y-4">
            <button
              onClick={clearCookies}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              清除所有Cookie
            </button>
            <div className="text-gray-300 text-sm">
              点击清除Cookie后，刷新页面应该会重定向到登录页面
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
          <h2 className="text-xl font-bold text-white mb-4">测试说明</h2>
          <div className="text-gray-300 space-y-2">
            <p>1. 如果看到Cookie中有uid和userRole，说明已经登录</p>
            <p>2. 点击"清除所有Cookie"按钮</p>
            <p>3. 刷新页面，应该会自动重定向到登录页面</p>
            <p>4. 如果没有重定向，说明中间件有问题</p>
          </div>
        </div>
      </div>
    </div>
  );
}

