"use client";

import { useEffect, useState } from 'react';

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
}

export default function Carousel() {
  const [index, setIndex] = useState(0);
  const slides: Slide[] = [
    { id: 's1', title: '高佣任务，实时更新', subtitle: '智能匹配更省心' },
    { id: 's2', title: '安全合规，多重风控', subtitle: '账户与资金更安心' },
    { id: 's3', title: '极速到账，提现便捷', subtitle: '稳定可靠有保障' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 3500);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/20">
      <div className="relative h-56 md:h-72">
        {slides.map((s, i) => (
          <div key={s.id} className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i===index? 'opacity-100':'opacity-0'}`}>
            <div className="h-full w-full bg-gradient-to-r from-indigo-600/40 to-purple-600/40 flex flex-col items-center justify-center text-center px-6">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">{s.title}</div>
              {s.subtitle && <div className="text-white/80 md:text-lg">{s.subtitle}</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {slides.map((s, i) => (
          <button key={s.id} aria-label={`slide-${i}`} onClick={()=>setIndex(i)} className={`w-2.5 h-2.5 rounded-full ${i===index?'bg-white':'bg-white/40'}`}></button>
        ))}
      </div>
    </div>
  );
}


