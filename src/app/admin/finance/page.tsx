"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Drawer from '@/components/ui/Drawer';

interface FinanceRecord {
  id: string;
  type: 'deposit' | 'withdraw' | 'commission' | 'refund';
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  method?: 'bank' | 'alipay' | 'usdt';
  description?: string;
  user_name?: string;
}

export default function AdminFinancePage() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'deposit' | 'withdraw' | 'commission' | 'ledger'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [userFilter, setUserFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<'created_at'|'amount'>('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC'|'DESC'>('DESC');
  const [total, setTotal] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [current, setCurrent] = useState<FinanceRecord | null>(null);
  const [actingUserId, setActingUserId] = useState('');
  const [actingType, setActingType] = useState<'deposit'|'withdraw'>('deposit');
  const [actingAmount, setActingAmount] = useState<number>(100);
  const [actingMethod, setActingMethod] = useState<'bank'|'alipay'|'usdt'>('bank');

  const load = async () => {
    setLoading(true);
    try {
      if (activeTab === 'ledger') {
        const qs = new URLSearchParams();
        qs.set('page', String(page));
        qs.set('limit', String(limit));
        if (userFilter) qs.set('user', userFilter);
        const r = await fetch(`/api/admin/wallet/ledger?${qs.toString()}`);
        const d = await r.json();
        if (r.ok) { setRecords(d.data || []); setTotal(d.total || 0); }
      } else {
        const qs = new URLSearchParams();
        qs.set('page', String(page));
        qs.set('limit', String(limit));
        if (activeTab !== 'all') qs.set('type', activeTab);
        if (statusFilter !== 'all') qs.set('status', statusFilter);
        if (methodFilter) qs.set('method', methodFilter);
        if (userFilter) qs.set('user', userFilter);
        if (from) qs.set('from', from);
        if (to) qs.set('to', to);
        qs.set('sortBy', sortBy);
        qs.set('sortOrder', sortOrder);
        const r = await fetch(`/api/admin/finance?${qs.toString()}`);
        const d = await r.json();
        if (r.ok) { setRecords(d.data || []); setTotal(d.total || 0); }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 读取URL初始参数
    try {
      const url = new URL(window.location.href);
      const view = url.searchParams.get('view');
      const uf = url.searchParams.get('user');
      const type = url.searchParams.get('type');
      const status = url.searchParams.get('status');
      const method = url.searchParams.get('method');
      const fromUrl = url.searchParams.get('from');
      const toUrl = url.searchParams.get('to');
      const sb = url.searchParams.get('sortBy') as any;
      const so = url.searchParams.get('sortOrder') as any;
      const p = parseInt(url.searchParams.get('page') || '1', 10);
      const lim = parseInt(url.searchParams.get('limit') || '10', 10);

      if (view === 'ledger') setActiveTab('ledger');
      if (type && ['deposit','withdraw','commission'].includes(type)) setActiveTab(type as any);
      if (status && ['pending','approved','rejected','completed'].includes(status)) setStatusFilter(status as any);
      if (uf) setUserFilter(uf);
      if (method) setMethodFilter(method);
      if (fromUrl) setFrom(fromUrl);
      if (toUrl) setTo(toUrl);
      if (sb && ['created_at','amount'].includes(sb)) setSortBy(sb);
      if (so && ['ASC','DESC'].includes(so)) setSortOrder(so);
      if (!Number.isNaN(p) && p>0) setPage(p);
      if (!Number.isNaN(lim) && [10,20,50].includes(lim)) setLimit(lim);
    } catch {}
    // 等待状态同步后再加载一次
    setTimeout(() => load(), 0);
  }, [page, limit]);

  const review = async (recordId: string, approve: boolean) => {
    const prev = records;
    setRecords(prev.map(r => r.id === recordId ? { ...r, status: approve ? 'completed' : 'rejected' } : r));
    try {
      const res = await fetch('/api/admin/finance/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recordId, approve }) });
      if (!res.ok) setRecords(prev);
    } catch { setRecords(prev); }
  };

  const exportCSV = async () => {
    const qs = new URLSearchParams();
    if (activeTab !== 'all') qs.set('type', activeTab);
    if (statusFilter !== 'all') qs.set('status', statusFilter);
    if (methodFilter) qs.set('method', methodFilter);
    if (userFilter) qs.set('user', userFilter);
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const url = `/api/admin/finance/export?${qs.toString()}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const stats = {
    totalDeposit: records.filter(r => r.type === 'deposit' && r.status === 'completed').reduce((sum, r) => sum + r.amount, 0),
    totalWithdraw: records.filter(r => r.type === 'withdraw' && r.status === 'completed').reduce((sum, r) => sum + r.amount, 0),
    pendingWithdraw: records.filter(r => r.type === 'withdraw' && r.status === 'pending').length,
    totalCommission: records.filter(r => r.type === 'commission').reduce((sum, r) => sum + r.amount, 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Drawer
        open={drawerOpen}
        title={current ? `财务详情：${current.id}` : '详情'}
        onClose={() => setDrawerOpen(false)}
      >
        {current ? (
          <div className="space-y-3 text-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">类型</div>
                <div>{current.type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">用户</div>
                <div>{current.user_name || current.userId}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">方式</div>
                <div>{current.method || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">金额</div>
                <div>¥{current.amount.toFixed(2)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">状态</div>
                <div>{current.status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">时间</div>
                <div>{current.createdAt}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">备注</div>
              <div className="whitespace-pre-wrap break-all">{current.description || '-'}</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-600">未选择记录</div>
        )}
      </Drawer>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-9 gap-4">
            <input value={userFilter} onChange={(e)=>setUserFilter(e.target.value)} placeholder="按用户搜索" className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400" />
            <select value={methodFilter} onChange={(e)=>setMethodFilter(e.target.value)} className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white">
              <option value="">全部方式</option>
              <option value="bank">银行卡</option>
              <option value="alipay">支付宝</option>
              <option value="usdt">USDT</option>
            </select>
            <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white" />
            <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white">
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已批准</option>
              <option value="completed">已完成</option>
              <option value="rejected">已拒绝</option>
            </select>
            <select value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)} className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white">
              <option value="created_at">按时间</option>
              <option value="amount">按金额</option>
            </select>
            <select value={sortOrder} onChange={(e)=>setSortOrder(e.target.value as any)} className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white">
              <option value="DESC">降序</option>
              <option value="ASC">升序</option>
            </select>
            <button onClick={() => { setPage(1); load(); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl">筛选</button>
            <button onClick={exportCSV} className="px-4 py-2 bg-green-600 text-white rounded-xl">导出CSV</button>
          </div>
        </div>

        {/* 管理员代用户发起申请 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-8">
          <div className="text-white font-semibold mb-4">以指定用户发起充值/提现申请</div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input value={actingUserId} onChange={(e)=>setActingUserId(e.target.value)} placeholder="用户ID" className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400" />
            <select value={actingType} onChange={(e)=>setActingType(e.target.value as any)} className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white">
              <option value="deposit">充值</option>
              <option value="withdraw">提现</option>
            </select>
            <input type="number" value={actingAmount} onChange={(e)=>setActingAmount(parseFloat(e.target.value)||0)} placeholder="金额" className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white" />
            <select value={actingMethod} onChange={(e)=>setActingMethod(e.target.value as any)} className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white">
              <option value="bank">银行卡</option>
              <option value="alipay">支付宝</option>
              <option value="usdt">USDT</option>
            </select>
            <button onClick={async ()=>{
              if (!actingUserId) return alert('请输入用户ID');
              const res = await fetch('/api/wallet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: actingUserId, type: actingType, amount: actingAmount, method: actingMethod }) });
              if (res.ok) { alert('已提交申请'); load(); } else { const d = await res.json().catch(()=>({})); alert(d?.error || '提交失败'); }
            }} className="px-4 py-2 bg-blue-600 text-white rounded-xl">提交</button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">类型</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">用户</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">金额/变动</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">状态</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">方式/来源</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">时间</th>
                  <th className="px-6 py-4 text-left text-gray-300 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td className="px-6 py-8 text-center text-gray-400" colSpan={7}>加载中...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td className="px-6 py-8 text-center text-gray-400" colSpan={7}>暂无数据</td></tr>
                ) : (
                  records.map((record: any) => (
                    <tr key={record.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">{activeTab==='ledger' ? record.refType : record.type}</td>
                      <td className="px-6 py-4 text-white">{record.user_name || record.userId}</td>
                      <td className="px-6 py-4">
                        {activeTab==='ledger' ? (
                          <span className={`font-bold ${record.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>{record.change>=0?'+':'-'}¥{Math.abs(record.change).toFixed(2)}</span>
                        ) : (
                          <span className={`font-bold ${(record.type === 'deposit' || record.type === 'commission') ? 'text-green-400' : 'text-red-400'}`}>{(record.type === 'deposit' || record.type === 'commission') ? '+' : '-'}¥{record.amount.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-300">{activeTab==='ledger' ? `${record.balanceBefore}→${record.balanceAfter}` : record.status}</td>
                      <td className="px-6 py-4 text-gray-300">{activeTab==='ledger' ? record.refId || '-' : (record.method || '-')}</td>
                      <td className="px-6 py-4 text-gray-300 text-sm">{record.createdAt}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setCurrent(record); setDrawerOpen(true); }} className="px-3 py-1 bg-white/10 text-white rounded text-xs hover:bg-white/20">详情</button>
                          {activeTab!=='ledger' && record.status === 'pending' && (<>
                            <button onClick={() => review(record.id, true)} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">批准</button>
                            <button onClick={() => review(record.id, false)} className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">拒绝</button>
                          </>)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 text-gray-300">
          <div>共 {total} 条</div>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1 bg-white/10 rounded disabled:opacity-50">上一页</button>
            <span>{page}/{Math.max(1, Math.ceil(total / limit))}</span>
            <button disabled={page>=totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))} className="px-3 py-1 bg-white/10 rounded disabled:opacity-50">下一页</button>
            <select value={limit} onChange={(e)=>{ setLimit(parseInt(e.target.value,10)); setPage(1); }} className="ml-2 px-2 py-1 bg-white/10 rounded">
              {[10,20,50].map(n => <option key={n} value={n}>{n}/页</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-sm text-gray-300">总充值金额</div>
            <div className="text-2xl font-bold text-white">¥{stats.totalDeposit.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-sm text-gray-300">总提现金额</div>
            <div className="text-2xl font-bold text-white">¥{stats.totalWithdraw.toLocaleString()}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-sm text-gray-300">待审核提现</div>
            <div className="text-2xl font-bold text-white">{stats.pendingWithdraw}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-sm text-gray-300">总佣金支出</div>
            <div className="text-2xl font-bold text-white">¥{stats.totalCommission.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

