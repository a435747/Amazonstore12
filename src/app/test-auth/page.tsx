"use client";

import { useEffect, useState } from 'react';

export default function TestAuthPage() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 尝试获取用户信息
    fetch('/api/auth/me')
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setUserInfo(data);
        } else {
          setError('未登录或认证失败');
        }
      })
      .catch((err) => {
        setError('请求失败: ' + err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">检查认证状态中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🔐 认证测试页面</h1>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">当前状态</h2>
          
          {error ? (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <div className="text-red-300 font-medium mb-2">❌ 认证失败</div>
              <div className="text-red-400 text-sm">{error}</div>
              <div className="text-red-300 text-sm mt-2">
                如果您看到这个页面，说明中间件没有正确重定向到登录页面！
              </div>
            </div>
          ) : userInfo ? (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <div className="text-green-300 font-medium mb-2">✅ 已登录</div>
              <pre className="text-green-400 text-sm overflow-x-auto">
                {JSON.stringify(userInfo, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
              <div className="text-yellow-300 font-medium mb-2">⚠️ 未知状态</div>
              <div className="text-yellow-400 text-sm">无法确定登录状态</div>
            </div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
          <h2 className="text-xl font-bold text-white mb-4">测试说明</h2>
          <div className="text-gray-300 space-y-3">
            <div>
              <div className="font-medium text-white">预期行为：</div>
              <div className="text-sm text-gray-400 ml-4">
                1. 未登录用户访问此页面应该被重定向到登录页面
              </div>
              <div className="text-sm text-gray-400 ml-4">
                2. 如果看到此页面，说明中间件有问题
              </div>
            </div>
            <div>
              <div className="font-medium text-white">可能的问题：</div>
              <div className="text-sm text-gray-400 ml-4">
                1. 中间件没有正确加载
              </div>
              <div className="text-sm text-gray-400 ml-4">
                2. 中间件配置有误
              </div>
              <div className="text-sm text-gray-400 ml-4">
                3. 开发服务器缓存问题
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
          <h2 className="text-xl font-bold text-white mb-4">解决方案</h2>
          <div className="text-gray-300 space-y-2">
            <div>1. 重启开发服务器：<code className="bg-gray-700 px-1 rounded">npm run dev</code></div>
            <div>2. 清除浏览器缓存</div>
            <div>3. 检查中间件文件是否正确</div>
            <div>4. 确保middleware.ts在项目根目录</div>
          </div>
        </div>
      </div>
    </div>
  );
}
