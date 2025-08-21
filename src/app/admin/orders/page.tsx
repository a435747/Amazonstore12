"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface OrderDto {
  id: string;
  code: string;
  customerName: string;
  totalAmount: number;
  status: string;
  userId?: string;
  commission?: number;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selected, setSelected] = useState<OrderDto | null>(null);
  const [userId, setUserId] = useState('');
  const [commission, setCommission] = useState<number>(0);
  const [filterUserId, setFilterUserId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/orders');
      const d = await r.json();
      if (r.ok) {
        let arr: OrderDto[] = d.data || [];
        // 读取URL参数
        try {
          const url = new URL(window.location.href);
          const uf = url.searchParams.get('user');
          if (uf && !filterUserId) setFilterUserId(uf);
        } catch {}
        if (filterUserId) arr = arr.filter(o => (o.userId||'') === filterUserId);
        setOrders(arr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const doAssign = async () => {
    if (!selected) return;
    setAssigning(true);
    try {
      const res = await fetch('/api/admin/orders/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: selected.code, userId, commission }) });
      if (!res.ok) throw new Error(await res.text());
      await load();
      setSelected(null); setUserId(''); setCommission(0);
    } finally { setAssigning(false); }
  };

  const complete = async (code: string) => {
    const res = await fetch('/api/admin/orders/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    if (res.ok) load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">订单管理（管理员）</h1>
          <Link href="/admin" className="text-blue-300">返回管理中心</Link>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-4 mb-4">
          <div className="flex gap-2 items-end">
            <div className="text-white">按用户过滤</div>
            <input value={filterUserId} onChange={(e)=>setFilterUserId(e.target.value)} placeholder="用户ID" className="px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white" />
            <button onClick={load} className="px-3 py-2 bg-blue-600 text-white rounded-xl">应用</button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-gray-300">订单号</th>
                <th className="px-6 py-4 text-left text-gray-300">用户ID</th>
                <th className="px-6 py-4 text-left text-gray-300">佣金</th>
                <th className="px-6 py-4 text-left text-gray-300">金额</th>
                <th className="px-6 py-4 text-left text-gray-300">状态</th>
                <th className="px-6 py-4 text-left text-gray-300">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td className="px-6 py-8 text-center text-gray-400" colSpan={6}>加载中...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td className="px-6 py-8 text-center text-gray-400" colSpan={6}>暂无订单</td></tr>
              ) : (
                orders.map(o => (
                  <tr key={o.code} className="hover:bg-white/5">
                    <td className="px-6 py-4 text-white">{o.code}</td>
                    <td className="px-6 py-4 text-gray-300">{o.userId || '-'}</td>
                    <td className="px-6 py-4 text-gray-300">{typeof o.commission === 'number' ? `¥${o.commission}` : '-'}</td>
                    <td className="px-6 py-4 text-gray-300">¥{o.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-300">{o.status}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => { setSelected(o); setUserId(o.userId || ''); setCommission(o.commission || 0); }} className="px-3 py-1 bg-white/10 text-white rounded text-xs hover:bg-white/20">指派佣金</button>
                        <button onClick={() => complete(o.code)} disabled={!o.userId || !o.commission || o.status==='completed'} className="px-3 py-1 bg-green-600 text-white rounded text-xs disabled:opacity-50 hover:bg-green-700">完成并发放</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="mt-6 bg-white/10 border border-white/20 rounded-xl p-4">
            <div className="text-white mb-4">为订单 {selected.code} 指派佣金</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={userId} onChange={e=>setUserId(e.target.value)} placeholder="用户ID" className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white" />
              <input type="number" value={commission} onChange={e=>setCommission(parseFloat(e.target.value)||0)} placeholder="佣金金额" className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white" />
              <div className="flex gap-2">
                <button onClick={doAssign} disabled={assigning} className="px-4 py-2 bg-blue-600 text-white rounded-xl">保存</button>
                <button onClick={()=>setSelected(null)} className="px-4 py-2 bg-white/10 text-white rounded-xl">取消</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


