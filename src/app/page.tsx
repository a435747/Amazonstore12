"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import WhatsAppCard from '@/components/WhatsAppCard';
import Carousel from '@/components/Carousel';
import BroadcastTicker from '@/components/BroadcastTicker';

interface User {
  id: string;
  name: string;
  role: 'user' | 'admin';
}

export default function HomePage() {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalEarnings: 0,
    activeUsers: 0
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取用户信息
    fetch('/api/auth/me')
      .then(async (r) => {
        if (r.ok) {
          const d = await r.json();
          setUser(d.data);
        } else {
          // 如果获取用户信息失败，重定向到登录页面
          window.location.href = '/login';
          return;
        }
      })
      .catch(() => {
        // 如果请求失败，重定向到登录页面
        window.location.href = '/login';
        return;
      })
      .finally(() => setLoading(false));

    // 模拟获取统计数据
    setStats({
      totalTasks: 156,
      completedTasks: 89,
      totalEarnings: 12580,
      activeUsers: 234
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="mb-8">
            <Carousel />
          </div>
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              平台运行正常 · 24/7 在线服务
            </div>
            <h1 className="text-6xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Amazon 智能刷单平台
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              专业的电商任务分发平台，连接商家与刷手，提供高效、安全、透明的刷单服务
            </p>
          </div>

          {/* 广播条 */}
          <div className="mb-6">
            <BroadcastTicker />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">{stats.totalTasks}</div>
              <div className="text-gray-300 text-sm">总任务数</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">{stats.completedTasks}</div>
              <div className="text-gray-300 text-sm">已完成</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">¥{stats.totalEarnings.toLocaleString()}</div>
              <div className="text-gray-300 text-sm">总佣金</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-3xl font-bold text-white mb-2">{stats.activeUsers}</div>
              <div className="text-gray-300 text-sm">活跃用户</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">平台功能</h2>
          <p className="text-gray-300 text-lg">一站式刷单解决方案</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <Link href="/tasks" className="group">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group-hover:scale-105">
              <div className="text-5xl mb-6">🎯</div>
              <h3 className="text-2xl font-bold text-white mb-4">任务大厅</h3>
              <p className="text-gray-300 leading-relaxed">海量优质任务，实时更新，智能匹配，让您轻松接单赚钱</p>
              <div className="mt-6 flex items-center text-blue-400 group-hover:text-blue-300">
                <span>立即抢单</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/me" className="group">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group-hover:scale-105">
              <div className="text-5xl mb-6">👤</div>
              <h3 className="text-2xl font-bold text-white mb-4">个人中心</h3>
              <p className="text-gray-300 leading-relaxed">实时查看收益统计，管理个人信息，监控任务进度</p>
              <div className="mt-6 flex items-center text-blue-400 group-hover:text-blue-300">
                <span>查看详情</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <WhatsAppCard />

          {/* 只有管理员才能看到管理中心 */}
          {user?.role === 'admin' && (
            <Link href="/admin" className="group">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group-hover:scale-105">
                <div className="text-5xl mb-6">🛡️</div>
                <h3 className="text-2xl font-bold text-white mb-4">管理中心</h3>
                <p className="text-gray-300 leading-relaxed">发布任务，审核提交，管理用户，系统配置</p>
                <div className="mt-6 flex items-center text-blue-400 group-hover:text-blue-300">
                  <span>进入管理</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          )}

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="text-5xl mb-6">📊</div>
            <h3 className="text-2xl font-bold text-white mb-4">数据统计</h3>
            <p className="text-gray-300 leading-relaxed">实时数据监控，收益分析，任务完成率统计</p>
            <div className="mt-6 text-blue-400">
              <span>实时更新</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="text-5xl mb-6">🔒</div>
            <h3 className="text-2xl font-bold text-white mb-4">安全保障</h3>
            <p className="text-gray-300 leading-relaxed">资金安全，隐私保护，任务审核，多重保障</p>
            <div className="mt-6 text-green-400">
              <span>安全可靠</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2025 Amazon 智能刷单平台. 专业的电商任务分发服务
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 