import Link from 'next/link';
import { getOrderByCode } from '@/lib/data';
import { notFound } from 'next/navigation';

type Params = { id: string };

export default async function OrderDetailPage(props: { params: Promise<Params> }) {
	const { id } = await props.params;

	const order = await getOrderByCode(id);
	if (!order) return notFound();

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<div className="bg-white rounded-lg shadow-sm p-6">
					<div className="flex items-center justify-between mb-6">
						<h1 className="text-2xl font-bold text-gray-900">订单详情 {order.code}</h1>
						<Link href="/orders" className="text-blue-600 hover:underline text-sm">返回订单列表</Link>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="md:col-span-2 space-y-4">
							<div className="border border-gray-200 rounded-lg p-4">
								<div className="font-medium text-gray-900 mb-2">客户：{order.customerName}</div>
								<div className="text-sm text-gray-600">创建时间：{new Date(order.createdAt).toLocaleString()}</div>
								<div className="text-sm text-gray-600">状态：{order.status}</div>
							</div>
							<div className="border border-gray-200 rounded-lg p-4">
								<div className="font-medium text-gray-900 mb-3">商品清单</div>
								<div className="divide-y divide-gray-100">
									{order.items?.map((item) => (
										<div key={item.sku} className="py-3 flex justify-between text-sm">
											<div className="text-gray-700">{item.name} × {item.quantity}</div>
											<div className="text-gray-900">¥{(item.price * item.quantity).toFixed(2)}</div>
										</div>
									))}
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<div className="border border-gray-200 rounded-lg p-4">
								<div className="font-medium text-gray-900 mb-2">支付信息</div>
								<div className="text-2xl font-bold text-green-600">¥{order.totalAmount.toFixed(2)}</div>
								<div className="text-sm text-gray-600">含税价，在线支付</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}


