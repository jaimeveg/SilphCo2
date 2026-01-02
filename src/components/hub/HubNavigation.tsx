'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Wrench, Skull, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HubNavigationProps {
  lang: string;
  dict: any;
  layout?: 'horizontal' | 'vertical';
}

export default function HubNavigation({ lang, dict, layout = 'horizontal' }: HubNavigationProps) {
  const t = dict.landing.nav;

  const CARDS = [
    {
      id: 'academy',
      title: t.academy.title,
      desc: t.academy.desc,
      icon: BookOpen,
      href: `/${lang}/academy`,
      color: 'text-cyan-400',
      border: 'group-hover:border-cyan-500/50',
      glow: 'group-hover:shadow-[0_0_20px_rgba(34,211,238,0.1)]',
      bg: 'group-hover:bg-cyan-950/30'
    },
    {
      id: 'tools',
      title: t.tools.title,
      desc: t.tools.desc,
      icon: Wrench,
      href: `/${lang}/tools/type-calculator`,
      color: 'text-amber-400',
      border: 'group-hover:border-amber-500/50',
      glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]',
      bg: 'group-hover:bg-amber-950/30'
    },
    {
      id: 'nuzlocke',
      title: t.nuzlocke.title,
      desc: t.nuzlocke.desc,
      icon: Skull,
      href: `/${lang}/nuzlocke`,
      color: 'text-red-400',
      border: 'group-hover:border-red-500/50',
      glow: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]',
      bg: 'group-hover:bg-red-950/30',
      locked: true
    }
  ];

  return (
    <div className={cn(
      "w-full h-full grid gap-4",
      layout === 'horizontal' ? "grid-cols-1 md:grid-cols-3" : "grid-rows-3"
    )}>
      {CARDS.map((card, i) => (
        <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="h-full"
        >
            <Link 
            href={card.locked ? '#' : card.href}
            className={cn(
                "group relative flex flex-col justify-center px-6 py-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md transition-all duration-300 h-full",
                card.border, card.glow, card.bg,
                card.locked && "opacity-60 grayscale cursor-not-allowed hover:border-slate-800 hover:shadow-none hover:bg-slate-900/60"
            )}
            >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded bg-slate-950 border border-slate-800", card.color)}>
                        <card.icon size={20} />
                    </div>
                    <h3 className="font-display font-bold text-base text-white tracking-wide">
                        {card.title}
                    </h3>
                </div>
                {!card.locked && (
                    <ArrowRight size={16} className={cn("transition-transform group-hover:translate-x-1", card.color)} />
                )}
            </div>

            <p className="text-xs text-slate-400 font-mono leading-relaxed pl-[3.25rem]">
                {card.desc}
            </p>
            </Link>
        </motion.div>
      ))}
    </div>
  );
}