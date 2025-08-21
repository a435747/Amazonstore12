"use client";

import { UserGuard } from '@/components/AuthGuard';

export default function ReportsPage() {
  return (
    <UserGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">数据报表</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">¥45,678</div>
                <div className="text-sm text-blue-600">今日销售额</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">234</div>
                <div className="text-sm text-green-600">今日订单数</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">¥195.20</div>
                <div className="text-sm text-purple-600">平均订单金额</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">89%</div>
                <div className="text-sm text-orange-600">客户满意度</div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">销售趋势</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">周一</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '75%'}}></div>
                      </div>
                      <span className="text-sm text-gray-600">¥38,450</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">周二</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                      <span className="text-sm text-gray-600">¥42,100</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">周三</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '90%'}}></div>
                      </div>
                      <span className="text-sm text-gray-600">¥45,678</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">热门商品</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">智能手机</span>
                    <span className="font-medium text-gray-900">156台</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">笔记本电脑</span>
                    <span className="font-medium text-gray-900">89台</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">无线耳机</span>
                    <span className="font-medium text-gray-900">234副</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">智能手表</span>
                    <span className="font-medium text-gray-900">67块</span>
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