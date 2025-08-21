"use client";

import { useEffect, useState } from 'react';
import { AdminGuard } from '@/components/AuthGuard';
import SendAnnouncementForm from './send-announcement-form';

export default function AdminSettingsPage() {
  const [checked, setChecked] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').finally(() => setChecked(true));
  }, []);

  useEffect(() => {
    // 加载当前设置
    fetch('/api/settings')
      .then(async (r) => {
        const d = await r.json().catch(()=>({}));
        if (r.ok) {
          setWhatsapp(d?.data?.whatsappNumber || '');
          setBankInfo(d?.data?.bankInfo || '');
          setUsdtAddress(d?.data?.usdtAddress || '');
        }
      })
      .catch(()=>{});
  }, [checked]);

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ whatsappNumber: whatsapp, bankInfo, usdtAddress }) });
      const d = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(d?.error || '保存失败');
      setMsg('保存成功');
    } catch (e: any) {
      setMsg(e.message || '保存失败');
    } finally { setSaving(false); }
  };

  if (!checked) return null;

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8 text-white">
          <div className="text-3xl font-bold mb-6">系统设置</div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 max-w-2xl">
            <div className="text-xl font-semibold mb-4">在线客服设置</div>
            <label className="block text-sm text-gray-300 mb-2">WhatsApp 号码</label>
            <input value={whatsapp} onChange={(e)=>setWhatsapp(e.target.value)} placeholder="示例：+60123456789 或 60123456789" className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400" />
            <div className="mt-4 flex items-center gap-3">
              <button disabled={saving} onClick={save} className="px-4 py-2 bg-blue-600 rounded-xl text-white disabled:opacity-50">{saving?'保存中...':'保存'}</button>
              {msg && <span className="text-sm text-gray-300">{msg}</span>}
            </div>
            <div className="text-gray-400 text-sm mt-3">前台首页与其他使用 `WhatsAppCard` 的位置会读取此号码。</div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 max-w-2xl mt-6">
            <div className="text-xl font-semibold mb-4">发送站内通知</div>
            <SendAnnouncementForm />
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 max-w-2xl mt-6">
            <div className="text-xl font-semibold mb-2">收款方式设置</div>
            <div className="text-sm text-gray-400 mb-4">支持在用户端选择银行卡/支付宝/USDT</div>
            <label className="block text-sm text-gray-300 mb-2">银行卡信息（开户行/户名/卡号）</label>
            <textarea value={bankInfo} onChange={(e)=>setBankInfo(e.target.value)} className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white min-h-[90px]" />
            <label className="block text-sm text-gray-300 mt-4 mb-2">USDT 收款地址</label>
            <input value={usdtAddress} onChange={(e)=>setUsdtAddress(e.target.value)} className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white" />
            <div className="mt-3 text-sm text-gray-400">保存后，用户在 个人中心 → 资金操作 选择对应方式时会看到指引。</div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}

