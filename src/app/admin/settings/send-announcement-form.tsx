"use client";

import { useState } from 'react';

export default function SendAnnouncementForm() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info'|'success'|'warning'|'error'>('info');
  const [sending, setSending] = useState(false);
  const [tip, setTip] = useState('');

  const submit = async () => {
    if (!title || !message) { setTip('请填写标题和内容'); return; }
    setSending(true); setTip('');
    try {
      const res = await fetch('/api/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, message, type, target: 'all' }) });
      const d = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(d?.error || '发送失败');
      setTitle(''); setMessage(''); setType('info');
      setTip('发送成功');
    } catch (e: any) {
      setTip(e.message || '发送失败');
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-gray-300 mb-1">标题</label>
        <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white" placeholder="例如：系统维护通知" />
      </div>
      <div>
        <label className="block text-sm text-gray-300 mb-1">内容</label>
        <textarea value={message} onChange={(e)=>setMessage(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white min-h-[100px]" placeholder="通知内容..." />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-300">类型</label>
        <select value={type} onChange={(e)=>setType(e.target.value as any)} className="px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white">
          <option value="info">info</option>
          <option value="success">success</option>
          <option value="warning">warning</option>
          <option value="error">error</option>
        </select>
        <button disabled={sending} onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-50">{sending? '发送中...':'发送'}</button>
        {tip && <span className="text-sm text-gray-300">{tip}</span>}
      </div>
    </div>
  );
}


