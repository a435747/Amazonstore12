"use client";

import { useEffect, useState } from 'react';
import { AdminGuard } from '@/components/AuthGuard';

export default function AdminSecurityPage() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').finally(() => setChecked(true));
  }, []);

  if (!checked) return null;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8 text-white">风控管理</div>
      </div>
    </AdminGuard>
  );
}

