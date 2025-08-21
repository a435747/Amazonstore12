"use client";

import { useEffect, useState } from 'react';
import { UserGuard } from '@/components/AuthGuard';

type ApiResp<T> = { data: T; error?: string };

interface UserDto { id: string; name: string; role: 'user' | 'admin' }
interface WalletDto { userId: string; balance: number }

export default function MePage() {
  const [user, setUser] = useState<UserDto | null>(null);
  const [wallet, setWallet] = useState<WalletDto | null>(null);
  const [amount, setAmount] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  const fetchUserAndWallet = async () => {
    const [u, w] = await Promise.all([
      fetch('/api/auth/me').then((r) => r.json() as Promise<ApiResp<UserDto>>),
      fetch('/api/wallet').then(async (r) => {
        if (r.status === 401) return { data: null } as any;
        return (r.json() as Promise<any>);
      })
    ]);
    setUser(u.data);
    setWallet(w?.data?.wallet ?? w?.data ?? null);
  };

  useEffect(() => {
    fetchUserAndWallet();
  }, []);

  const doWallet = async (type: 'deposit' | 'withdraw') => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, amount })
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data.error || '操作失败');
      setWallet(data?.data?.wallet ?? data?.data ?? null);
      setMsg(type === 'deposit' ? '充值申请已提交，待审核' : '提现申请已提交，待审核');
    } catch (e: any) {
      setMsg(e.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 移除角色切换功能

  return (
    <UserGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              👤 个人中心
            </h1>
            <p className="text-xl text-gray-300">管理您的账户信息，查看收益统计</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                    <span className="text-5xl">👤</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">{user?.name ?? '...'}</h2>
                  <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm text-gray-300 mb-6">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    认证用户
                  </div>
                  <div className="text-center">
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full text-sm text-blue-300 border border-blue-500/30">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                      平台用户
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="space-y-6">
                  {/* 钱包卡片 */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mr-4">
                        <span className="text-green-300 text-xl">💰</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white">我的钱包</h3>
                    </div>
                    
                                       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <div className="text-sm text-gray-400 mb-2">当前余额</div>
                        <div className="text-3xl font-bold text-green-400">¥{wallet ? wallet.balance.toFixed(2) : '0.00'}</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <div className="text-sm text-gray-400 mb-2">今日收益</div>
                        <div className="text-3xl font-bold text-blue-400">¥{wallet ? (wallet.balance * 0.1).toFixed(2) : '0.00'}</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <div className="text-sm text-gray-400 mb-2">完成任务</div>
                        <div className="text-3xl font-bold text-purple-400">12</div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <div className="text-sm text-gray-400 mb-2">用户等级</div>
                        <div className="text-3xl font-bold text-yellow-400">Lv.3</div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <h4 className="text-lg font-semibold text-white mb-4">资金操作</h4>
                      <div className="flex items-end gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-300 mb-2">操作金额</label>
                          <input 
                            type="number" 
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50" 
                            value={amount} 
                            onChange={(e) => { const v = parseFloat(e.target.value); setAmount(Number.isFinite(v) ? v : 0); }} 
                            placeholder="请输入金额"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button 
                            onClick={() => doWallet('deposit')} 
                            disabled={loading} 
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            充值
                          </button>
                          <button 
                            onClick={() => doWallet('withdraw')} 
                            disabled={loading} 
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-medium hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            提现
                          </button>
                        </div>
                      </div>
                      {msg && (
                        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                          <div className="text-blue-300 text-sm">{msg}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 帮助卡片 */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mr-4">
                        <span className="text-blue-300 text-xl">?</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white">帮助中心</h3>
                    </div>
                    <div className="text-gray-300 leading-relaxed">
                      <p className="mb-4">如需客服帮助，请使用顶部导航的 WhatsApp 外链联系我们的专业客服团队。</p>
                      <p>我们提供7x24小时在线服务，确保您的问题得到及时解决。</p>
                    </div>
                  </div>

                  {/* 账户管理卡片 */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
                        <span className="text-red-300 text-xl">⚙</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white">账户管理</h3>
                    </div>
                    <button 
                      onClick={async () => {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.href = '/login';
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl font-medium hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserGuard>
  );
}
