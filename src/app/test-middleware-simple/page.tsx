"use client";

import { useEffect, useState } from 'react';

export default function TestMiddlewareSimplePage() {
  const [status, setStatus] = useState<string>('测试中...');

  useEffect(() => {
    // 直接访问一个受保护的页面
    fetch('/api/auth/me')
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setStatus(`✅ 已登录: ${data.data.name}`);
        } else {
          setStatus('❌ 未登录 - API返回401');
        }
      })
      .catch((err) => {
        setStatus(`❌ 请求失败: ${err.message}`);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">🔧 中间件测试</h1>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
          <div className="text-white text-lg mb-4">当前状态:</div>
          <div className="text-gray-300 text-sm">{status}</div>
          <div className="mt-4 text-gray-400 text-xs">
            如果您看到这个页面，说明中间件没有重定向到登录页面
          </div>
        </div>
      </div>
    </div>
  );
}
