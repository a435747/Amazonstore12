"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/AuthGuard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Chart } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

interface TrendPoint { date: string; revenue: number; withdrawals?: number; netRevenue?: number; tasks: number }
interface TopUser { id: string; name: string; earnings: number; tasks: number }

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totals, setTotals] = useState<{ users: number; tasks: number; revenue: number; todayRevenue: number }>({ users: 0, tasks: 0, revenue: 0, todayRevenue: 0 });
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [trendDays, setTrendDays] = useState(7);
  const [topDays, setTopDays] = useState(30);
  const [metric, setMetric] = useState<'revenue'|'netRevenue'|'withdrawals'>('revenue');
  const [dimension, setDimension] = useState<'commission'|'deposit'|'withdraw'>('commission');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams({ trendDays: String(trendDays), topDays: String(topDays), dimension });
      const r = await fetch(`/api/admin/analytics?${qs.toString()}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || '加载失败');
      setTotals(d.data.totals);
      setTrend(d.data.trend);
      setTopUsers((d.data.topUsers || []).slice(0, 10));
    } catch (e: any) {
      setError(e.message || '加载失败');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [trendDays, topDays, dimension]);

  const trendChart = useMemo(() => {
    const labels = trend.map(t => t.date);
    const revenueData = trend.map(t => t.revenue);
    const tasksData = trend.map(t => t.tasks);
    const netData = trend.map(t => t.netRevenue || 0);
    const wdData = trend.map(t => t.withdrawals || 0);
    const lineMap: Record<string, number[]> = {
      revenue: revenueData,
      netRevenue: netData,
      withdrawals: wdData,
    };
    return {
      data: {
        labels,
        datasets: [
          {
            type: 'line' as const,
            label: metric === 'revenue' ? '收入' : metric === 'netRevenue' ? '净收入' : '提现',
            data: lineMap[metric],
            yAxisID: 'y',
            borderColor: metric === 'withdrawals' ? 'rgba(248, 113, 113, 1)' : 'rgba(99, 102, 241, 1)',
            backgroundColor: metric === 'withdrawals' ? 'rgba(248, 113, 113, 0.25)' : 'rgba(99, 102, 241, 0.25)',
            tension: 0.35,
            fill: true,
            pointRadius: 3,
          },
          {
            type: 'bar' as const,
            label: '新增任务',
            data: tasksData,
            yAxisID: 'y1',
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderRadius: 6,
            barPercentage: 0.5,
            categoryPercentage: 0.6,
          },
        ],
      },
      options: {
        responsive: true,
        animation: { duration: 500, easing: 'easeOutQuart' },
        plugins: { legend: { position: 'top' as const } },
        scales: {
          y: { type: 'linear' as const, position: 'left' as const, grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#e5e7eb' } },
          y1: { type: 'linear' as const, position: 'right' as const, grid: { drawOnChartArea: false }, ticks: { color: '#e5e7eb' } },
          x: { grid: { color: 'transparent' }, ticks: { color: '#e5e7eb' } },
        },
      },
    };
  }, [trend, metric]);

  const topUsersChart = useMemo(() => {
    const labels = topUsers.map(u => u.name);
    const data = topUsers.map(u => u.earnings);
    return {
      data: {
        labels,
        datasets: [
          {
            label: '佣金',
            data,
            backgroundColor: 'rgba(234, 179, 8, 0.7)',
            borderRadius: 6,
          },
        ],
      },
      options: {
        indexAxis: 'y' as const,
        responsive: true,
        animation: { duration: 500, easing: 'easeOutQuart' },
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.08)' }, ticks: { color: '#e5e7eb' } },
          y: { grid: { color: 'transparent' }, ticks: { color: '#e5e7eb' } },
        },
      },
    };
  }, [topUsers]);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-blue-400 hover:text-blue-300">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">←</span>
                </div>
              </Link>
              <div>
                <div className="text-white font-semibold">数据统计</div>
                <div className="text-sm text-gray-300">实时数据监控、报表分析</div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded">{error}</div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-sm text-gray-300">用户总数</div>
              <div className="text-2xl font-bold text-white">{totals.users}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-sm text-gray-300">任务总数</div>
              <div className="text-2xl font-bold text-white">{totals.tasks}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-sm text-gray-300">累计收入</div>
              <div className="text-2xl font-bold text-white">¥{Number(totals.revenue).toLocaleString()}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-sm text-gray-300">今日收入</div>
              <div className="text-2xl font-bold text-white">¥{Number(totals.todayRevenue).toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white">趋势</h3>
                <select value={metric} onChange={(e)=>setMetric(e.target.value as any)} className="px-3 py-1 rounded bg-white/10 text-white">
                  <option value="revenue">收入</option>
                  <option value="netRevenue">净收入</option>
                  <option value="withdrawals">提现</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select value={trendDays} onChange={(e)=>setTrendDays(parseInt(e.target.value,10))} className="px-3 py-1 rounded bg-white/10 text-white">
                  {[7,14,30,60,90].map(n => <option key={n} value={n}>近{n}天</option>)}
                </select>
                <select value={dimension} onChange={(e)=>setDimension(e.target.value as any)} className="px-3 py-1 rounded bg-white/10 text-white">
                  <option value="commission">仅佣金</option>
                  <option value="deposit">仅充值</option>
                  <option value="withdraw">仅提现</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div className="text-gray-300">加载中...</div>
            ) : (
              <div>
                <div className="flex justify-end mb-2 gap-2">
                  <button onClick={() => {
                    try {
                      const canvas = document.querySelector('#chart-trend') as HTMLCanvasElement | null;
                      if (!canvas) return;
                      const url = canvas.toDataURL('image/png');
                      const a = document.createElement('a');
                      a.href = url; a.download = `trend_${Date.now()}.png`; a.click();
                    } catch {}
                  }} className="px-3 py-1 rounded bg-white/10 text-white hover:bg-white/20 text-sm">导出图片</button>
                  <button onClick={() => {
                    const header = ['date','metric','tasks'];
                    const metricLabel = metric === 'revenue' ? 'revenue' : metric === 'netRevenue' ? 'netRevenue' : 'withdrawals';
                    const lines = [header.join(',')].concat(trend.map(t => [t.date, (t as any)[metricLabel] ?? '', t.tasks].map(v => String(v).replace(/"/g,'""')).map(v => /,|\n|\"/.test(v)?`"${v}"`:v).join(',')));
                    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `trend_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
                  }} className="px-3 py-1 rounded bg-white/10 text-white hover:bg-white/20 text-sm">导出CSV</button>
                </div>
                <Chart id='chart-trend' type='bar' data={trendChart.data as any} options={trendChart.options as any} />
              </div>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">佣金排行榜</h3>
              <div className="flex items-center gap-2">
                <select value={topDays} onChange={(e)=>setTopDays(parseInt(e.target.value,10))} className="px-3 py-1 rounded bg-white/10 text-white">
                  {[7,14,30,60,90].map(n => <option key={n} value={n}>近{n}天</option>)}
                </select>
              </div>
            </div>
            {loading ? (
              <div className="text-gray-300">加载中...</div>
            ) : (
              <div>
                <div className="flex justify-end mb-2 gap-2">
                  <button onClick={() => {
                    try {
                      const canvas = document.querySelector('#chart-top') as HTMLCanvasElement | null;
                      if (!canvas) return;
                      const url = canvas.toDataURL('image/png');
                      const a = document.createElement('a');
                      a.href = url; a.download = `top_${Date.now()}.png`; a.click();
                    } catch {}
                  }} className="px-3 py-1 rounded bg-white/10 text-white hover:bg-white/20 text-sm">导出图片</button>
                  <button onClick={() => {
                    const header = ['rank','name','earnings','tasks'];
                    const lines = [header.join(',')].concat(topUsers.map((u, i) => [i+1, u.name, u.earnings, u.tasks].map(v => String(v).replace(/"/g,'""')).map(v => /,|\n|\"/.test(v)?`"${v}"`:v).join(',')));
                    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `top_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
                  }} className="px-3 py-1 rounded bg-white/10 text-white hover:bg-white/20 text-sm">导出CSV</button>
                </div>
                <Bar id='chart-top' data={topUsersChart.data} options={topUsersChart.options as any} />
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}

