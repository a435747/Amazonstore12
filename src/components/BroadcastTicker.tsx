"use client";

import { useEffect, useMemo, useState } from 'react';

interface TickerItem {
  id: string;
  text: string;
}

function randomName(): string {
  const names = ['张伟','王芳','李娜','刘洋','陈强','赵磊','杨静','黄鹏','周敏','吴涛','林俊','郑爽','何杰','郭丽','冯超','马丽','朱健','胡敏','罗杰','高楠','程华','谢辉','邹倩','曹阳','许燕'];
  const n = names[Math.floor(Math.random() * names.length)] || '用户';
  return n[0] + '**';
}

function randomAmount(): string {
  const amt = Math.random() * 800 + 50; // 50~850
  return amt.toFixed(2);
}

function makeItem(): TickerItem {
  const text = `${randomName()} 刚刚获得幸运订单，金额 ¥${randomAmount()}`;
  return { id: 'tk' + Math.random().toString(36).slice(2), text };
}

export default function BroadcastTicker() {
  const seed = useMemo(() => Array.from({ length: 12 }, () => makeItem()), []);
  const [items, setItems] = useState<TickerItem[]>(seed);

  // 周期性注入新条目，保证循环且不断变化
  useEffect(() => {
    const timer = setInterval(() => {
      setItems((prev) => {
        const next = prev.slice();
        next.push(makeItem());
        while (next.length > 24) next.shift();
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

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


