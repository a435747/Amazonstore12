export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto mb-6 text-6xl">🙈</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">页面未找到</h1>
        <p className="text-gray-600 mb-6">您访问的页面不存在或已被移动</p>
        <a href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">返回首页</a>
      </div>
    </div>
  );
}


