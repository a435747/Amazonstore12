"use client";
import * as React from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/AuthGuard';

export default function AdminPage() {
  const [authorized, setAuthorized] = React.useState<boolean>(false);
  const [checked, setChecked] = React.useState<boolean>(false);
  const [user, setUser] = React.useState<{ id: string; name: string; role: string } | null>(null);
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalRevenue: 0,
    pendingWithdrawals: 0
  });

  React.useEffect(() => {
    // 校验管理员
    fetch('/api/auth/me')
      .then(async (r) => {
        if (!r.ok) { setAuthorized(false); setChecked(true); return; }
        const d = await r.json();
        setUser(d.data);
        const isAdmin = d.data?.role === 'admin';
        setAuthorized(isAdmin);
        setChecked(true);
        if (isAdmin) {
          // 拉取真实统计
          fetch('/api/admin/analytics')
            .then(async (res) => {
              if (!res.ok) return;
              const data = await res.json();
              const totals = data?.data?.totals || {};
              // 计算 pending 提现数量（使用财务接口按状态筛选统计）
              setStats((s) => ({
                ...s,
                totalUsers: Number(totals.users || 0),
                totalTasks: Number(totals.tasks || 0),
                totalRevenue: Number(totals.revenue || 0),
              }));
            })
            .catch(() => {});
          // 并行获取“待审核提现”数量
          const qs = new URLSearchParams({ page: '1', limit: '1', type: 'withdraw', status: 'pending' });
          fetch(`/api/admin/finance?${qs.toString()}`)
            .then(async (res) => {
              const d2 = await res.json().catch(()=>({}));
              if (res.ok) setStats((s)=>({ ...s, pendingWithdrawals: Number(d2.total || 0) }));
            })
            .catch(()=>{});
          // 计算活跃与完成任务数量（根据需要可替换为真实查询端点）
          fetch('/api/orders')
            .then(async (res) => {
              const d3 = await res.json().catch(()=>({ data: [] }));
              if (res.ok && Array.isArray(d3.data)) {
                const completed = d3.data.filter((o:any)=>o.status==='completed').length;
                setStats((s)=>({ ...s, completedTasks: completed }));
              }
            })
            .catch(()=>{});
          // 活跃用户：最近有登录记录的用户数，这里先通过用户列表统计 lastLogin 不为空
          fetch('/api/admin/users?page=1&limit=100')
            .then(async (res) => {
              const d4 = await res.json().catch(()=>({ data: [], total: 0 }));
              if (res.ok) {
                const active = (d4.data || []).filter((u:any)=>!!u.lastLogin).length;
                setStats((s)=>({ ...s, activeUsers: active }));
              }
            })
            .catch(()=>{});
        }
      })
      .catch(() => { setAuthorized(false); setChecked(true); });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  if (!checked) return null;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* 管理员顶部导航栏 */}
        <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">🛡️</span>
                </div>
                <div>
                  <div className="text-white font-semibold">管理中心</div>
                  <div className="text-sm text-gray-300">管理员控制台</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-white font-medium">{user?.name}</div>
                  <div className="text-sm text-gray-300">管理员</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🛡️ 管理中心
            </h1>
            <p className="text-xl text-gray-300">系统配置、任务管理、用户审核、数据监控</p>
          </div>

          {/* 统计概览 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold text-white mb-2">{stats.totalUsers}</div>
              <div className="text-sm text-gray-300">总用户数</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold text-white mb-2">{stats.activeUsers}</div>
              <div className="text-sm text-gray-300">活跃用户</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold text-white mb-2">{stats.totalTasks}</div>
              <div className="text-sm text-gray-300">总任务数</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold text-white mb-2">{stats.completedTasks}</div>
              <div className="text-sm text-gray-300">已完成</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold text-white mb-2">¥{stats.totalRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-300">总收入</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold text-white mb-2">{stats.pendingWithdrawals}</div>
              <div className="text-sm text-gray-300">待审核</div>
            </div>
          </div>

          {/* 功能模块 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link key={0} href={'/admin/users'} className="group">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group-hover:scale-105 h-full">
                <div className="flex items-center mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 text-3xl`}>
                    👥
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">用户管理</h3>
                    <p className="text-gray-300 text-sm">管理用户账户、权限、黑名单</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {['用户注册审核','身份等级管理','黑名单管理','批量操作'].map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-gray-300 text-sm">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center text-blue-400 group-hover:text-blue-300">
                  <span>进入管理</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          {/* 快速操作 */}
          <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">快速操作</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={()=>{ window.location.href = '/admin/tasks'; }} className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                发布任务
              </button>
              <button onClick={()=>{ window.location.href = '/admin/finance?status=pending&type=withdraw'; }} className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
                审核提现
              </button>
              <button onClick={()=>{ window.location.href = '/admin/users?status=blacklisted'; }} className="px-4 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-colors">
                用户封禁
              </button>
              <button onClick={()=>{ window.location.href = '/admin/settings'; }} className="px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
                紧急通知
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}