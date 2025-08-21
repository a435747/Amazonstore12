"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/AuthGuard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Drawer from '@/components/ui/Drawer';
import { notify } from '@/store';

interface User {
  id: string;
  name: string;
  username: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'blacklisted';
  level: '普通刷手' | 'VIP' | '代理';
  createdAt: string;
  lastLogin?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [level, setLevel] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<{ open: boolean; action?: () => void; title?: string; desc?: string }>({ open: false });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [current, setCurrent] = useState<User | null>(null);
  const [edit, setEdit] = useState<Partial<User>>({});
  // 快捷入口：钱包相关
  const [quickAmount, setQuickAmount] = useState<number>(100);
  const [quickType, setQuickType] = useState<'deposit'|'withdraw'>('deposit');
  const [quickMethod, setQuickMethod] = useState<'bank'|'alipay'|'usdt'>('bank');
  const [quickWallet, setQuickWallet] = useState<{ balance?: number } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ q: search, status, level, role, page: String(page), limit: String(limit) });
      const r = await fetch(`/api/admin/users?${qs.toString()}`);
      const d = await r.json();
      if (r.ok) {
        setUsers(d.data || []);
        setTotal(d.total || 0);
        setSelectedIds([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // URL 初始化筛选
    try {
      const url = new URL(window.location.href);
      const q0 = url.searchParams.get('q');
      const st = url.searchParams.get('status');
      const lv = url.searchParams.get('level');
      const rl = url.searchParams.get('role');
      const p = parseInt(url.searchParams.get('page') || '1', 10);
      const lim = parseInt(url.searchParams.get('limit') || '10', 10);
      if (q0) setSearch(q0);
      if (st) setStatus(st);
      if (lv) setLevel(lv);
      if (rl) setRole(rl);
      if (!Number.isNaN(p) && p>0) setPage(p);
      if (!Number.isNaN(lim) && [10,20,50].includes(lim)) setLimit(lim);
    } catch {}
    // 稍后加载一次，确保初始状态已同步
    setTimeout(() => load(), 0);
  }, [page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const patchUser = async (id: string, updates: Partial<User>) => {
    const prev = users;
    setUsers(prev.map(u => u.id === id ? { ...u, ...updates } : u));
    try {
      const r = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      if (!r.ok) {
        setUsers(prev);
        const d = await r.json().catch(()=>({}));
        notify.error('更新失败', d?.error || '请稍后重试');
      } else {
        notify.success('更新成功', '用户信息已更新');
      }
    } catch {
      setUsers(prev);
      notify.error('网络错误', '请检查网络后重试');
    }
  };

  const openDrawer = async (id: string) => {
    setDrawerLoading(true); setDrawerOpen(true); setCurrent(null); setEdit({});
    try {
      const r = await fetch(`/api/admin/users/${id}`);
      const d = await r.json();
      if (r.ok) {
        setCurrent(d.data);
        setEdit({ name: d.data.name, role: d.data.role, status: d.data.status, level: d.data.level });
      }
    } finally { setDrawerLoading(false); }
  };

  const saveDrawer = async () => {
    if (!current) return;
    const updates: Partial<User> = {};
    ['name','role','status','level'].forEach((k) => {
      const key = k as keyof User;
      if ((edit as any)[key] !== (current as any)[key]) {
        (updates as any)[key] = (edit as any)[key];
      }
    });
    if (Object.keys(updates).length === 0) { notify.info('无改动', '没有需要保存的修改'); return; }
    const ok = await fetch(`/api/admin/users/${current.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (!ok.ok) {
      const d = await ok.json().catch(()=>({}));
      notify.error('保存失败', d?.error || '请稍后重试');
      return;
    }
    notify.success('保存成功', '用户信息已更新');
    setDrawerOpen(false);
    load();
  };

  const confirmAction = (title: string, desc: string, action: () => void) => setConfirm({ open: true, action, title, desc });

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  const selectAll = (checked: boolean) => {
    setSelectedIds(checked ? users.map(u => u.id) : []);
  };

  const bulkUpdate = async (updates: Partial<User>, title: string) => {
    const ids = selectedIds.slice();
    if (ids.length === 0) return;
    const prev = users;
    setUsers(prev.map(u => ids.includes(u.id) ? { ...u, ...updates } : u));
    setSelectedIds([]);
    try {
      const results = await Promise.all(ids.map(id => fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })));
      const fail = results.find(r => !r.ok);
      if (fail) {
        setUsers(prev);
        notify.error('批量更新失败', '部分用户更新未成功');
      } else {
        notify.success('批量更新成功', title);
      }
    } catch {
      setUsers(prev);
      notify.error('网络错误', '请检查网络后重试');
    }
  };

  return (
    <AdminGuard>
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.desc}
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => { setConfirm({ open: false }); confirm.action?.(); }}
      />

      <Drawer
        open={drawerOpen}
        title={current ? `用户详情：${current.name}` : '加载中...'}
        centered
        onClose={() => setDrawerOpen(false)}
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button onClick={()=>setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100">取消</button>
            <button onClick={saveDrawer} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">保存</button>
          </div>
        )}
      >
        {drawerLoading ? (
          <div className="text-gray-600">加载中...</div>
        ) : current ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">姓名</label>
              <input value={edit.name || ''} onChange={(e)=>setEdit(s=>({ ...s, name: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">角色</label>
              <select value={edit.role as any} onChange={(e)=>setEdit(s=>({ ...s, role: e.target.value as any }))} className="w-full px-3 py-2 border rounded-lg">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">状态</label>
              <select value={edit.status as any} onChange={(e)=>setEdit(s=>({ ...s, status: e.target.value as any }))} className="w-full px-3 py-2 border rounded-lg">
                <option value="active">active</option>
                <option value="suspended">suspended</option>
                <option value="blacklisted">blacklisted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">等级</label>
              <select value={edit.level as any} onChange={(e)=>setEdit(s=>({ ...s, level: e.target.value as any }))} className="w-full px-3 py-2 border rounded-lg">
                <option value="普通刷手">普通刷手</option>
                <option value="VIP">VIP</option>
                <option value="代理">代理</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">注册时间</div>
                <div className="text-gray-800">{current.createdAt}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">最后登录</div>
                <div className="text-gray-800">{current.lastLogin || '-'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">钱包余额</div>
                <div className="text-green-600 font-semibold">¥{(current as any).walletBalance?.toLocaleString?.() || (current as any).walletBalance || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">近30天佣金</div>
                <div className="text-blue-600 font-semibold">¥{(current as any).last30?.commission || 0}</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">近30天任务完成</div>
              <div className="text-gray-800">{(current as any).last30?.tasks || 0} 个</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-2">活跃会话（近10条）</div>
              <div className="space-y-2">
                {((current as any).sessions || []).length === 0 ? (
                  <div className="text-gray-500">无</div>
                ) : (
                  (current as any).sessions.map((s: any) => (
                    <div key={s.id} className="p-2 border rounded-lg text-sm bg-white">
                      <div className="text-gray-700">IP：{s.ip_address || '-'}</div>
                      <div className="text-gray-500 truncate">UA：{s.user_agent || '-'}</div>
                      <div className="text-gray-500">登录：{s.created_at} 过期：{s.expires_at}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-2">近7天登录 IP</div>
              <div className="flex flex-wrap gap-2">
                {((current as any).loginIps || []).length === 0 ? (
                  <div className="text-gray-500">无</div>
                ) : (
                  (current as any).loginIps.map((ip: string) => (
                    <button key={ip} onClick={()=>navigator.clipboard?.writeText(ip)} className="px-2 py-1 rounded border bg-white text-gray-700 hover:bg-gray-50" title="点击复制">{ip}</button>
                  ))
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">风险提示</div>
              <div className="text-sm text-gray-700">
                {((current as any).risk?.isBlacklisted) ? '黑名单用户；' : ''}
                24小时失败登录：{(current as any).risk?.failedLogin24h || 0} 次；
                近7天多 IP 登录：{(current as any).risk?.multiIp7d ? '是' : '否'}
              </div>
            </div>
            <div className="pt-2 border-t">
              <button onClick={async ()=>{
                if (!current) return;
                const r = await fetch(`/api/admin/users/${current.id}/sessions`, { method: 'DELETE' });
                if (r.ok) { notify.success('操作成功', '已注销该用户全部会话'); openDrawer(current.id); } else { notify.error('操作失败', '请稍后重试'); }
              }} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">注销该用户全部会话</button>
            </div>

            {/* 快捷入口：钱包操作 */}
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-500 mb-2">快捷入口（钱包）</div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                <button onClick={async ()=>{
                  if (!current) return;
                  const r = await fetch(`/api/wallet?userId=${encodeURIComponent(current.id)}`);
                  const d = await r.json().catch(()=>({}));
                  if (r.ok) { setQuickWallet(d.data || null); notify.success('已获取钱包',''); } else { notify.error('获取失败', d?.error || ''); }
                }} className="px-3 py-2 rounded bg-white/10 text-gray-800 md:col-span-1 bg-white hover:bg-gray-50">查看钱包</button>
                <button onClick={()=>{ window.open(`/admin/finance?view=ledger&user=${encodeURIComponent(current?.username || current!.id)}`,'_blank'); }} className="px-3 py-2 rounded bg-white/10 text-gray-800 bg-white hover:bg-gray-50">查看钱包流水</button>
                <button onClick={()=>{ window.open(`/admin/finance?user=${encodeURIComponent(current?.username || current!.id)}`,'_blank'); }} className="px-3 py-2 rounded bg-white/10 text-gray-800 bg-white hover:bg-gray-50">查看财务记录</button>
                <select value={quickType} onChange={(e)=>setQuickType(e.target.value as any)} className="px-3 py-2 border rounded">
                  <option value="deposit">充值</option>
                  <option value="withdraw">提现</option>
                </select>
                <input type="number" value={quickAmount} onChange={(e)=>setQuickAmount(parseFloat(e.target.value)||0)} className="px-3 py-2 border rounded" placeholder="金额" />
                <select value={quickMethod} onChange={(e)=>setQuickMethod(e.target.value as any)} className="px-3 py-2 border rounded">
                  <option value="bank">银行卡</option>
                  <option value="alipay">支付宝</option>
                  <option value="usdt">USDT</option>
                </select>
                <button onClick={async ()=>{
                  if (!current) return;
                  const r = await fetch('/api/wallet', { method:'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: current.id, type: quickType, amount: quickAmount, method: quickMethod }) });
                  const d = await r.json().catch(()=>({}));
                  if (r.ok) { notify.success('提交成功','已创建申请，待审核'); } else { notify.error('提交失败', d?.error || ''); }
                }} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">代用户提交</button>
              </div>
              {quickWallet && (
                <div className="mt-2 text-sm text-gray-700">当前余额：<span className="text-green-600 font-semibold">¥{Number(quickWallet.balance || 0).toFixed(2)}</span></div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-600">未找到用户</div>
        )}
      </Drawer>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin" className="text-blue-400 hover:text-blue-300">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">←</span>
                  </div>
                </Link>
                <div>
                  <div className="text-white font-semibold">用户管理</div>
                  <div className="text-sm text-gray-300">管理用户账户、权限、黑名单</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索姓名或用户名..." className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400" />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white">
                <option value="">全部状态</option>
                <option value="active">正常</option>
                <option value="suspended">已暂停</option>
                <option value="blacklisted">黑名单</option>
              </select>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white">
                <option value="">全部等级</option>
                <option value="普通刷手">普通刷手</option>
                <option value="VIP">VIP</option>
                <option value="代理">代打</option>
              </select>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white">
                <option value="">全部角色</option>
                <option value="user">用户</option>
                <option value="admin">管理员</option>
              </select>
              <button onClick={() => { setPage(1); load(); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl">查询</button>
              <div className="flex items-center gap-2 justify-end">
                <button disabled={selectedIds.length===0} onClick={() => setDrawerOpen(false)} className="px-3 py-2 bg-white/10 text-white rounded disabled:opacity-50">查看</button>
                <button disabled={selectedIds.length===0} onClick={() => confirmAction('批量激活', `确认激活选中 ${selectedIds.length} 个用户？`, () => bulkUpdate({ status: 'active' }, '批量激活成功'))} className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50">批量激活</button>
                <button disabled={selectedIds.length===0} onClick={() => confirmAction('批量暂停', `确认暂停选中 ${selectedIds.length} 个用户？`, () => bulkUpdate({ status: 'suspended' }, '批量暂停成功'))} className="px-3 py-2 bg-yellow-600 text-white rounded disabled:opacity-50">批量暂停</button>
                <button disabled={selectedIds.length===0} onClick={() => confirmAction('批量封禁', `确认封禁选中 ${selectedIds.length} 个用户？`, () => bulkUpdate({ status: 'blacklisted' }, '批量封禁成功'))} className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-50">批量封禁</button>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input type="checkbox" checked={selectedIds.length===users.length && users.length>0} onChange={(e)=>selectAll(e.target.checked)} className="rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500" />
                    </th>
                    <th className="px-6 py-4 text-left text-gray-300 font-medium">用户信息</th>
                    <th className="px-6 py-4 text-left text-gray-300 font-medium">角色</th>
                    <th className="px-6 py-4 text-left text-gray-300 font-medium">状态</th>
                    <th className="px-6 py-4 text-left text-gray-300 font-medium">等级</th>
                    <th className="px-6 py-4 text-left text-gray-300 font-medium">注册时间</th>
                    <th className="px-6 py-4 text-left text-gray-300 font-medium">最后登录</th>
                    <th className="px-6 py-4 text-left text-gray-300 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td className="px-6 py-8 text-center text-gray-400" colSpan={8}>加载中...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td className="px-6 py-8 text-center text-gray-400" colSpan={8}>暂无数据</td></tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={(e)=>toggleSelect(u.id, e.target.checked)} className="rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{u.name}</div>
                          <div className="text-sm text-gray-400">@{u.username}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          <select value={u.role} onChange={(e)=>patchUser(u.id, { role: e.target.value as any })} className="bg-white/5 border border-white/20 rounded px-2 py-1">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{u.status}</td>
                        <td className="px-6 py-4 text-gray-300">
                          <select value={u.level} onChange={(e)=>patchUser(u.id, { level: e.target.value as any })} className="bg-white/5 border border-white/20 rounded px-2 py-1">
                            <option value="普通刷手">普通刷手</option>
                            <option value="VIP">VIP</option>
                            <option value="代理">代理</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">{u.createdAt}</td>
                        <td className="px-6 py-4 text-gray-300 text-sm">{u.lastLogin || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => openDrawer(u.id)} className="px-3 py-1 bg-white/10 text-white rounded text-xs hover:bg-white/20">详情</button>
                            <button onClick={() => confirmAction('激活用户', `确认激活 ${u.name}？`, () => patchUser(u.id, { status: 'active' }))} className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">激活</button>
                            <button onClick={() => confirmAction('暂停用户', `确认暂停 ${u.name}？`, () => patchUser(u.id, { status: 'suspended' }))} className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700">暂停</button>
                            <button onClick={() => confirmAction('封禁用户', `确认封禁 ${u.name}？`, () => patchUser(u.id, { status: 'blacklisted' }))} className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">封禁</button>
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
            <div>共 {total} 条 已选 {selectedIds.length} 条</div>
            <div className="flex items-center gap-2">
              <button disabled={page<=1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1 bg-white/10 rounded disabled:opacity-50">上一页</button>
              <span>{page}/{Math.max(1, Math.ceil(total / limit))}</span>
              <button disabled={page>=totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))} className="px-3 py-1 bg-white/10 rounded disabled:opacity-50">下一页</button>
              <select value={limit} onChange={(e)=>{ setLimit(parseInt(e.target.value,10)); setPage(1); }} className="ml-2 px-2 py-1 bg-white/10 rounded">
                {[10,20,50].map(n => <option key={n} value={n}>{n}/页</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
