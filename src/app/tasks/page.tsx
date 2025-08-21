"use client";

import { useEffect, useState } from 'react';
import { UserGuard } from '@/components/AuthGuard';

type ApiResp<T> = { data: T; error?: string };

type Task = { id: string; title: string; merchant: string; amount: number; commission: number; status: string; stock: number; createdAt: string };

export default function TasksPage() {
  const [list, setList] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'my'>('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'commission' | 'amount' | 'createdAt'>('commission');

  const load = async () => {
    const r = await fetch('/api/tasks');
    const d = (await r.json()) as ApiResp<Task[]>;
    const allTasks = d.data || [];
    setList(allTasks.filter(t => t.status === 'open' && t.stock > 0));
    setMyTasks(allTasks.filter(t => t.status !== 'open'));
  };

  const claim = async (taskId: string) => {
    setMsg('');
    const r = await fetch('/api/tasks/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId }) });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error || '抢单失败'); return; }
    setMsg('已抢到任务');
    await load();
  };

  useEffect(() => { load(); }, []);

  return (
    <UserGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🎯 任务大厅
            </h1>
            <p className="text-xl text-gray-300">海量优质任务，实时更新，智能匹配</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
            
            <div className="flex space-x-4 mb-8">
              <button
                onClick={() => setActiveTab('available')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === 'available' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <span className="flex items-center">
                  <span className="mr-2">📋</span>
                  可抢任务 ({list.length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('my')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === 'my' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <span className="flex items-center">
                  <span className="mr-2">👤</span>
                  我的任务 ({myTasks.length})
                </span>
              </button>
            </div>

            {/* 搜索和筛选 */}
            {activeTab === 'available' && (
              <div className="mb-8 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="搜索任务标题或商家..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div className="flex gap-3">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="all">全部分类</option>
                      <option value="electronics">电子产品</option>
                      <option value="clothing">服装服饰</option>
                      <option value="home">家居用品</option>
                      <option value="food">食品饮料</option>
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="commission">按佣金排序</option>
                      <option value="amount">按金额排序</option>
                      <option value="createdAt">按时间排序</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'available' && (
              <div className="space-y-4">
                {list.map((t) => (
                  <div key={t.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                          <h3 className="text-xl font-bold text-white">{t.title}</h3>
                          <span className="ml-3 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">热门</span>
                        </div>
                        <div className="text-gray-300 mb-4">
                          <div className="flex items-center space-x-6 text-sm">
                            <span>🏪 {t.merchant}</span>
                            <span>💰 订单金额: ¥{t.amount.toFixed(2)}</span>
                            <span>💎 佣金: ¥{t.commission.toFixed(2)}</span>
                            <span>📦 库存: {t.stock}</span>
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-400">
                          <span>⏰ 发布时间: {new Date(t.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="ml-6">
                        <button 
                          onClick={() => claim(t.id)} 
                          disabled={t.stock <= 0} 
                          className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                            t.stock <= 0 
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                          }`}
                        >
                          {t.stock <= 0 ? '已抢完' : '立即抢单'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {!list.length && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">😴</div>
                    <div className="text-gray-400 text-lg">暂无可抢任务</div>
                    <div className="text-gray-500 text-sm mt-2">请稍后再来查看</div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'my' && (
              <div className="space-y-4">
                {myTasks.map((t) => (
                  <div key={t.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <h3 className="text-xl font-bold text-white">{t.title}</h3>
                          <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${
                            t.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300' :
                            t.status === 'pending_review' ? 'bg-blue-500/20 text-blue-300' :
                            t.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {t.status === 'in_progress' ? '进行中' :
                             t.status === 'pending_review' ? '待审核' :
                             t.status === 'approved' ? '已完成' :
                             '已拒绝'}
                          </span>
                        </div>
                        <div className="text-gray-300 mb-3">
                          <div className="flex items-center space-x-6 text-sm">
                            <span>🏪 {t.merchant}</span>
                            <span>💰 订单金额: ¥{t.amount.toFixed(2)}</span>
                            <span>💎 佣金: ¥{t.commission.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          <span>⏰ 抢单时间: {new Date(t.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {t.status === 'in_progress' && <TaskSubmissionForm taskId={t.id} onSuccess={load} />}
                  </div>
                ))}
                {!myTasks.length && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <div className="text-gray-400 text-lg">暂无我的任务</div>
                    <div className="text-gray-500 text-sm mt-2">快去抢单赚钱吧！</div>
                  </div>
                )}
              </div>
            )}

            {msg && (
              <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                <div className="text-blue-300 text-center">{msg}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </UserGuard>
  );
}

function TaskSubmissionForm({ taskId, onSuccess }: { taskId: string; onSuccess: () => void }) {
  const [note, setNote] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async () => {
    if (!note.trim()) {
      setMsg('请填写备注信息');
      return;
    }
    
    setLoading(true);
    setMsg('');
    try {
      const r = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, note, evidenceUrl })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '提交失败');
      setMsg('提交成功，等待审核');
      setNote('');
      setEvidenceUrl('');
      onSuccess();
    } catch (e: any) {
      setMsg(e.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
          <span className="text-blue-300 text-lg">📝</span>
        </div>
        <h4 className="text-lg font-bold text-white">提交任务凭证</h4>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">备注信息 *</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="请详细描述任务完成情况..."
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">凭证链接</label>
          <input
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="https://example.com/evidence.jpg"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <button
          onClick={submit}
          disabled={loading || !note.trim()}
          className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
            loading || !note.trim()
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V4a4 4 0 00-4 4H4z"></path>
              </svg>
              提交中...
            </span>
          ) : (
            '提交凭证'
          )}
        </button>
      </div>
      {msg && (
        <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
          <div className="text-green-300 text-sm">{msg}</div>
        </div>
      )}
    </div>
  );
}


