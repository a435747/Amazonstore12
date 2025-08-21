"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/AuthGuard';

interface Task {
  id: string;
  title: string;
  merchant: string;
  amount: number;
  commission: number;
  stock: number;
  status: 'draft' | 'published' | 'claimed' | 'in_progress' | 'completed' | 'cancelled';
  claimedBy?: string;
  claimedAt?: string;
  completedAt?: string;
  createdAt: string;
  evidence?: string;
  review?: 'pending' | 'approved' | 'rejected';
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'claimed' | 'in_progress' | 'completed' | 'cancelled'>('all');
  // 管理员代操作：输入用户ID
  const [actingUserId, setActingUserId] = useState('');
  const [submitNote, setSubmitNote] = useState('');
  const [submitEvidence, setSubmitEvidence] = useState('');

  // 新建任务表单
  const [newTask, setNewTask] = useState({
    title: '',
    merchant: '',
    amount: 0,
    commission: 0,
    stock: 1
  });

  useEffect(() => {
    // 模拟加载任务数据
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Amazon电子产品刷单任务',
        merchant: 'XX自营店',
        amount: 299.99,
        commission: 25.00,
        stock: 10,
        status: 'published',
        createdAt: '2024-01-20 10:30:00'
      },
      {
        id: '2',
        title: '服装类目评价任务',
        merchant: '时尚服饰店',
        amount: 89.99,
        commission: 15.00,
        stock: 5,
        status: 'claimed',
        claimedBy: 'user1',
        claimedAt: '2024-01-20 11:15:00',
        createdAt: '2024-01-20 09:00:00'
      },
      {
        id: '3',
        title: '家居用品刷单',
        merchant: '家居生活馆',
        amount: 159.99,
        commission: 20.00,
        stock: 3,
        status: 'in_progress',
        claimedBy: 'user2',
        claimedAt: '2024-01-20 08:30:00',
        createdAt: '2024-01-19 16:00:00'
      },
      {
        id: '4',
        title: '数码配件评价',
        merchant: '数码配件专营',
        amount: 45.99,
        commission: 8.00,
        stock: 8,
        status: 'completed',
        claimedBy: 'user3',
        claimedAt: '2024-01-19 14:20:00',
        completedAt: '2024-01-20 12:00:00',
        evidence: 'screenshot.jpg',
        review: 'approved',
        createdAt: '2024-01-19 10:00:00'
      }
    ];
    setTasks(mockTasks);
    setLoading(false);
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.merchant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.merchant || newTask.amount <= 0 || newTask.commission <= 0) {
      alert('请填写完整的任务信息');
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      ...newTask,
      status: 'draft',
      createdAt: new Date().toLocaleString()
    };

    setTasks([task, ...tasks]);
    setNewTask({ title: '', merchant: '', amount: 0, commission: 0, stock: 1 });
    setShowCreateForm(false);
  };

  const handlePublishTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: 'published' as const } : task
    ));
  };

  const handleCancelTask = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status: 'cancelled' as const } : task
    ));
  };

  const handleReviewTask = (taskId: string, approved: boolean) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { 
        ...task, 
        review: approved ? 'approved' as const : 'rejected' as const 
      } : task
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs">草稿</span>;
      case 'published':
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">已发布</span>;
      case 'claimed':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">已接单</span>;
      case 'in_progress':
        return <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">进行中</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">已完成</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">已取消</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs">未知</span>;
    }
  };

  const getReviewBadge = (review?: string) => {
    switch (review) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs">待审核</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">已通过</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">已拒绝</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs">未提交</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link href="/admin" className="text-blue-400 hover:text-blue-300 mb-2 inline-block">
                ← 返回管理中心
              </Link>
              <h1 className="text-4xl font-bold text-white">🎯 任务管理</h1>
              <p className="text-gray-300 mt-2">发布任务、审核提交、状态管理</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{filteredTasks.length}</div>
              <div className="text-sm text-gray-300">总任务数</div>
            </div>
          </div>

          {/* 搜索和筛选 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">搜索任务</label>
                <input
                  type="text"
                  placeholder="搜索任务标题或商家..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">状态筛选</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="all">全部状态</option>
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="claimed">已接单</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </div>
              <div className="flex items-end">
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  发布任务
                </button>
              </div>
            </div>
          </div>

          {/* 创建任务表单 */}
          {showCreateForm && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-4">发布新任务</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">任务标题 *</label>
                  <input
                    type="text"
                    placeholder="例如：Amazon电子产品刷单任务"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">商家名称 *</label>
                  <input
                    type="text"
                    placeholder="例如：XX自营店"
                    value={newTask.merchant}
                    onChange={(e) => setNewTask({...newTask, merchant: e.target.value})}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">订单金额 *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newTask.amount}
                    onChange={(e) => setNewTask({...newTask, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">佣金金额 *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newTask.commission}
                    onChange={(e) => setNewTask({...newTask, commission: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">任务库存 *</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={newTask.stock}
                    onChange={(e) => setNewTask({...newTask, stock: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleCreateTask}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                  >
                    创建任务
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 任务列表 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-300 font-medium">任务信息</th>
                    <th className="px-6 py-4 text-left text-gray-300 font-medium">金额</th>
                    <th className="px-6 py-4 text-left text-gray-300 font-medium">状态</th>
                    <th className="px-6 py-4 text-left text-gray-300 font-medium">接单人</th>
                    <th className="px-6 py-4 text-left text-gray-300 font-medium">审核状态</th>
                    <th className="px-6 py-4 text-left text-gray-300 font-medium">创建时间</th>
                    <th className="px-6 py-4 text-left text-gray-300 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white font-medium">{task.title}</div>
                          <div className="text-sm text-gray-400">{task.merchant}</div>
                          <div className="text-xs text-gray-500">库存: {task.stock}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-white">¥{task.amount.toFixed(2)}</div>
                          <div className="text-sm text-green-400">佣金: ¥{task.commission.toFixed(2)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(task.status)}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {task.claimedBy || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {getReviewBadge(task.review)}
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {task.createdAt}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {task.status === 'draft' && (
                            <button 
                              onClick={() => handlePublishTask(task.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              发布
                            </button>
                          )}
                          {task.status === 'published' && (
                            <button 
                              onClick={() => handleCancelTask(task.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                            >
                              取消
                            </button>
                          )}
                          {/* 管理员代操作：认领与提交 */}
                          {task.status === 'published' && (
                            <button
                              onClick={async () => {
                                if (!actingUserId) { alert('请输入下方“代操作用户ID”'); return; }
                                const res = await fetch('/api/tasks/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId: task.id, userId: actingUserId }) });
                                if (res.ok) alert('代认领成功'); else alert('代认领失败');
                              }}
                              className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                            >代用户认领</button>
                          )}
                          {(task.status === 'claimed' || task.status === 'in_progress') && (
                            <button
                              onClick={async () => {
                                if (!actingUserId) { alert('请输入下方“代操作用户ID”'); return; }
                                if (!submitNote) { alert('请输入“代提交备注”'); return; }
                                const res = await fetch('/api/tasks/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId: task.id, userId: actingUserId, note: submitNote, evidenceUrl: submitEvidence || undefined }) });
                                if (res.ok) alert('代提交成功'); else alert('代提交失败');
                              }}
                              className="px-3 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700"
                            >代用户提交</button>
                          )}
                          {task.review === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleReviewTask(task.id, true)}
                                className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              >
                                通过
                              </button>
                              <button 
                                onClick={() => handleReviewTask(task.id, false)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              >
                                拒绝
                              </button>
                            </>
                          )}
                          <button className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700">
                            查看
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 管理员代操作输入区 */}
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
            <div className="text-white font-semibold mb-3">管理员代操作</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input value={actingUserId} onChange={(e)=>setActingUserId(e.target.value)} placeholder="代操作用户ID" className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400" />
              <input value={submitNote} onChange={(e)=>setSubmitNote(e.target.value)} placeholder="代提交备注（提交任务时必填）" className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400" />
              <input value={submitEvidence} onChange={(e)=>setSubmitEvidence(e.target.value)} placeholder="凭证URL（可选）" className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400" />
              <div className="text-gray-400 text-sm flex items-center">先在下方填写，再在列表行点击“代用户认领/提交”</div>
            </div>
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <div className="text-gray-400 text-lg">暂无任务数据</div>
              <div className="text-gray-500 text-sm mt-2">请尝试调整搜索条件或发布新任务</div>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}

