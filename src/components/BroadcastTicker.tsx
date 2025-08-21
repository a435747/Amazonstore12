"use client";

import { useEffect, useState } from 'react';

interface TickerItem {
  id: string;
  text: string;
}

export default function BroadcastTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then(async (r) => r.json())
      .then((d) => {
        const data = Array.isArray(d?.data) ? d.data : [];
        const arr: TickerItem[] = data.slice(0, 10).map((o: any) => ({
          id: o.id,
          text: `${o.customerName || '用户'} 刚刚获得幸运订单，金额 ¥${Number(o.totalAmount || 0).toFixed(2)}`,
        }));
        setItems(arr);
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden whitespace-nowrap bg-white/5 border border-white/10 rounded-xl">
      <div className="animate-[marquee_15s_linear_infinite] py-2 text-sm text-white/90">
        {items.concat(items).map((it, idx) => (
          <span key={`${it.id}-${idx}`} className="mx-6">📢 {it.text}</span>
        ))}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}


