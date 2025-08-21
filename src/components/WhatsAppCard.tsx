"use client";

import { useEffect, useState } from 'react';

export default function WhatsAppCard() {
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        setWhatsapp(d.data?.whatsappNumber || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleClick = () => {
    if (whatsapp) {
      window.open(`https://wa.me/${encodeURIComponent(whatsapp)}`, '_blank');
    } else {
      alert('WhatsApp号码未配置，请联系管理员');
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="group cursor-pointer"
    >
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group-hover:scale-105">
        <div className="text-5xl mb-6">💬</div>
        <h3 className="text-2xl font-bold text-white mb-4">
          {loading ? '加载中...' : whatsapp ? 'WhatsApp 客服' : '在线客服'}
        </h3>
        <p className="text-gray-300 leading-relaxed">
          {whatsapp ? '7×24小时专业客服，点击立即咨询' : 'WhatsApp号码未配置，请联系管理员'}
        </p>
        <div className="mt-6 flex items-center text-green-400 group-hover:text-green-300">
          <span>{whatsapp ? '立即咨询' : '配置中'}</span>
          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
