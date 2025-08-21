"use client";

import { useEffect, useState } from 'react';
import { UserGuard } from '@/components/AuthGuard';

type ApiResp<T> = { data: T; error?: string };

interface GrabDto { code: string; address: string; amount: number; distanceKm: number }

export default function GrabPage() {
  const [list, setList] = useState<GrabDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  const load = async () => {
    const res = await fetch('/api/grab');
    const data = (await res.json()) as ApiResp<GrabDto[]>;
    setList(data.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const claim = async (code: string) => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch('/api/grab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = (await res.json()) as ApiResp<GrabDto>;
      if (!res.ok) throw new Error(data.error || '抢单失败');
      setList((prev) => prev.filter((i) => i.code !== code));
      setMsg(`已抢到订单 ${code}`);
    } catch (e: any) {
      setMsg(e.message || '抢单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              抢单系统
            </h1>
            <p className="text-xl text-gray-300">快速抢单，高效配送</p>
          </div>
          
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">{list.length}</div>
              <div className="text-gray-300 text-sm">可抢订单</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">--</div>
              <div className="text-gray-300 text-sm">已抢订单</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">--</div>
              <div className="text-gray-300 text-sm">配送中</div>
            </div>
          </div>

          {/* 订单列表 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">可抢订单</h2>
              <div className="text-sm text-gray-300">共 {list.length} 个订单</div>
            </div>
            
            <div className="space-y-4">
              {list.map((g) => (
                <div key={g.code} className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">#{g.code.slice(-4)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-white text-lg">订单 #{g.code}</div>
                          <div className="text-sm text-gray-300 mt-1">地址：{g.address}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">💰</span>
                          <span>金额：¥{g.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">📍</span>
                          <span>距离：{g.distanceKm}km</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => claim(g.code)} 
                      disabled={loading} 
                      className="ml-4 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '抢单中...' : '🚀 抢单'}
                    </button>
                  </div>
                </div>
              ))}
              
              {msg && (
                <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                  <div className="text-blue-300 text-sm">{msg}</div>
                </div>
              )}
              
              {!list.length && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <div className="text-gray-400 text-lg">暂无可抢订单</div>
                  <div className="text-gray-500 text-sm mt-2">请稍后再来查看</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </UserGuard>
  );
}