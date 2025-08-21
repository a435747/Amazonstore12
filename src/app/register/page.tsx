
"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';

type ApiResp<T> = { data: T; error?: string };

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const usernameError = useMemo(() => {
    if (!username) return '请输入用户名';
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) return '用户名需为 3-20 位字母、数字或下划线';
    return '';
  }, [username]);

  const passwordError = useMemo(() => {
    if (!password) return '请输入密码';
    if (password.length < 6) return '密码长度至少 6 位';
    return '';
  }, [password]);

  const confirmError = useMemo(() => {
    if (!confirmPassword) return '请再次输入密码';
    if (confirmPassword !== password) return '两次输入的密码不一致';
    return '';
  }, [confirmPassword, password]);

  const canSubmit = useMemo(() => {
    return !loading && agree && !usernameError && !passwordError && !confirmError;
  }, [loading, agree, usernameError, passwordError, confirmError]);

  const doRegister = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password, 
          name: displayName || username,
          role: 'user' // 明确设置为普通用户角色
        }),
      });
      const data = (await res.json()) as ApiResp<{ id: string; name: string; role: 'user' }>;
      if (!res.ok) throw new Error(data.error || '注册失败');
      setMsg('注册成功，正在跳转登录页');
      setTimeout(() => {
        window.location.href = '/login';
      }, 800);
    } catch (e: any) {
      setMsg(e.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSubmit) {
      doRegister();
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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl mb-6 shadow-lg">
            <span className="text-3xl">📝</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            创建新账户
          </h1>
          <p className="text-gray-300 text-lg">加入我们的智能刷单平台</p>
        </div>

        {/* 注册表单 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 shadow-2xl">
          <div className="space-y-6">
            {/* 显示名称输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <span className="text-lg">👤</span>
                  显示名称（可选）
                </span>
              </label>
              <input 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                onKeyPress={handleKeyPress}
                placeholder="例如：张三" 
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200" 
              />
            </div>

            {/* 用户名输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <span className="text-lg">🔑</span>
                  用户名
                </span>
              </label>
              <input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                onKeyPress={handleKeyPress}
                placeholder="3-20 位字母/数字/下划线" 
                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 ${
                  usernameError ? 'border-red-500/50' : 'border-white/20'
                }`} 
              />
              {usernameError && (
                <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <span>⚠️</span>
                  {usernameError}
                </div>
              )}
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
                  type={showPwd ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  onKeyPress={handleKeyPress}
                  placeholder="至少 6 位" 
                  className={`w-full px-4 py-3 pr-12 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 ${
                    passwordError ? 'border-red-500/50' : 'border-white/20'
                  }`} 
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              {passwordError && (
                <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <span>⚠️</span>
                  {passwordError}
                </div>
              )}
            </div>

            {/* 确认密码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  <span className="text-lg">🔐</span>
                  确认密码
                </span>
              </label>
              <div className="relative">
                <input 
                  type={showConfirmPwd ? 'text' : 'password'} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  onKeyPress={handleKeyPress}
                  placeholder="再次输入密码" 
                  className={`w-full px-4 py-3 pr-12 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 ${
                    confirmError ? 'border-red-500/50' : 'border-white/20'
                  }`} 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPwd ? '🙈' : '👁️'}
                </button>
              </div>
              {confirmError && (
                <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <span>⚠️</span>
                  {confirmError}
                </div>
              )}
            </div>

            {/* 协议同意 */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500"
              />
              <label className="text-gray-300 text-sm leading-relaxed">
                我已阅读并同意
                <Link href="#" className="text-blue-400 hover:text-blue-300 mx-1">
                  《用户协议》
                </Link>
                和
                <Link href="#" className="text-blue-400 hover:text-blue-300 mx-1">
                  《隐私政策》
                </Link>
              </label>
            </div>

            {/* 注册按钮 */}
            <button 
              onClick={doRegister} 
              disabled={!canSubmit} 
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  注册中...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🚀</span>
                  立即注册
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

            {/* 登录链接 */}
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-gray-400 text-sm mb-2">已有账户？</p>
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                <span>🔐</span>
                立即登录
              </Link>
            </div>
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


