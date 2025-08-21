"use client";

import { useEffect } from 'react';

export default function ForceLogoutPage() {
  useEffect(() => {
    // 清除所有cookie
    document.cookie = 'uid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // 重定向到登录页面
    window.location.href = '/login';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-xl mb-4">正在登出...</div>
        <div className="text-gray-400 text-sm">即将跳转到登录页面</div>
      </div>
    </div>
  );
}

