import Link from 'next/link';
import { getOrders } from '@/lib/data';
import AuthGuard from '@/components/AuthGuard';

export default async function OrdersPage() {
	const data = await getOrders();
	const completed = data.filter((o) => o.status === 'completed').length;
	const processing = data.filter((o) => o.status === 'processing').length;
	const pending = data.filter((o) => o.status === 'pending').length;

	return (
		<AuthGuard>
			<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
				<div className="container mx-auto px-4 py-8">
					{/* Header */}
					<div className="text-center mb-12">
						<h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
							订单管理
						</h1>
						<p className="text-xl text-gray-300">查看和管理您的所有订单</p>
					</div>

					{/* 统计卡片 */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
						<div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
							<div className="text-3xl font-bold text-white mb-2">{data.length}</div>
							<div className="text-gray-300 text-sm">今日订单</div>
						</div>
						<div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
							<div className="text-3xl font-bold text-white mb-2">{completed}</div>
							<div className="text-gray-300 text-sm">已完成</div>
						</div>
						<div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
							<div className="text-3xl font-bold text-white mb-2">{processing}</div>
							<div className="text-gray-300 text-sm">处理中</div>
						</div>
						<div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
							<div className="text-3xl font-bold text-white mb-2">{pending}</div>
							<div className="text-gray-300 text-sm">待处理</div>
						</div>
					</div>

					{/* 订单列表 */}
					<div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-bold text-white">订单列表</h2>
							<div className="text-sm text-gray-300">共 {data.length} 个订单</div>
						</div>
						
						<div className="space-y-4">
							{data.map((order) => (
								<Link
									key={order.code}
									href={`/orders/${order.code}`}
									className="block"
								>
									<div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]">
										<div className="flex justify-between items-center">
											<div className="flex-1">
												<div className="flex items-center gap-4">
													<div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
														<span className="text-white font-bold text-lg">#{order.code.slice(-4)}</span>
													</div>
													<div>
														<div className="font-semibold text-white text-lg">订单 #{order.code}</div>
														<div className="text-sm text-gray-300 mt-1">
															客户：{order.customerName} | 金额：¥{order.totalAmount.toFixed(2)}
														</div>
													</div>
												</div>
											</div>
											<div className="flex items-center gap-4">
												<div className="text-right">
													<div className="text-white font-medium">¥{order.totalAmount.toFixed(2)}</div>
													<div className="text-xs text-gray-400">订单金额</div>
												</div>
												<span className={
													order.status === 'completed'
														? 'px-4 py-2 bg-green-500/20 text-green-300 rounded-full text-sm border border-green-500/30'
														: order.status === 'processing'
														? 'px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-full text-sm border border-yellow-500/30'
														: 'px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-sm border border-red-500/30'
												}>
												{order.status === 'completed' ? '已完成' : order.status === 'processing' ? '处理中' : '待处理'}
												</span>
											</div>
										</div>
									</div>
								</Link>
							))}
						</div>

						{data.length === 0 && (
							<div className="text-center py-12">
								<div className="text-6xl mb-4">:)</div>
								<div className="text-gray-400 text-lg">暂无订单数据</div>
								<div className="text-gray-500 text-sm mt-2">您还没有任何订单记录</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</AuthGuard>
	);
}