"use client";

import { useState } from 'react';
import Link from 'next/link';

type ApiResp<T> = { data: T; error?: string };

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const doLogin = async () => {
    if (!username || !password) {
      setMsg('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/auth/login', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ username, password }) 
      });
      const data = (await res.json()) as ApiResp<{ id: string; name: string; role: 'user' | 'admin' }>;
      if (!res.ok) throw new Error(data.error || '登录失败');
      setMsg('登录成功');
      
      // 根据用户角色进行不同的重定向
      if (data.data.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    } catch (e: any) {
      setMsg(e.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      doLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-full blur-2xl"></div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <span className="text-3xl">🚀</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Amazon 智能刷单平台
          </h1>
          <p className="text-gray-300 text-lg">欢迎回来，请登录您的账户</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 shadow-2xl">
          <div className="space-y-6">
            {/* 用户名输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <span className="text-lg">👤</span>
                  用户名
                </span>
              </label>
              <input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                onKeyPress={handleKeyPress}
                placeholder="请输入您的用户名" 
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200" 
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <span className="text-lg">🔒</span>
                  密码
                </span>
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  onKeyPress={handleKeyPress}
                  placeholder="请输入您的密码" 
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* 登录按钮 */}
            <button 
              onClick={doLogin} 
              disabled={loading} 
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  登录中...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🚀</span>
                  立即登录
                </span>
              )}
            </button>

            {/* 消息提示 */}
            {msg && (
              <div className={`text-sm text-center p-3 rounded-lg ${
                msg.includes('成功') 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {msg}
              </div>
            )}

            {/* 注册链接 */}
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-gray-400 text-sm mb-2">还没有账户？</p>
              <Link 
                href="/register" 
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                <span>📝</span>
                立即注册新账户
              </Link>
            </div>
          </div>
        </div>

        {/* 测试账户提示 */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
          <h3 className="text-white font-medium mb-2 flex items-center gap-2">
            <span>🧪</span>
            测试账户
          </h3>
          <div className="text-gray-300 text-sm space-y-1">
            <div>普通用户：<code className="bg-gray-700 px-1 rounded">user1</code> / <code className="bg-gray-700 px-1 rounded">123456</code></div>
            <div>管理员：<code className="bg-gray-700 px-1 rounded">admin</code> / <code className="bg-gray-700 px-1 rounded">admin123</code></div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="text-center mt-8">
          <p className="text-gray-400 text-xs">
            © 2024 Amazon 智能刷单平台. 安全可靠的电商任务分发平台
          </p>
        </div>
      </div>
    </div>
  );
}





