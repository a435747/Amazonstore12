"use client";

export default function ProtectedTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">🔒 受保护页面</h1>
        <p className="text-gray-300 text-lg">
          如果您看到这个页面，说明中间件没有正常工作！
        </p>
        <p className="text-gray-400 text-sm mt-2">
          未登录用户应该被重定向到登录页面
        </p>
      </div>
    </div>
  );
}
