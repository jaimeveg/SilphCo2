'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PawPrint, Disc, Apple, SendToBack, ArrowRight, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DexLandingProps {
  lang: string;
  dict: any;
}

const DEX_CARDS = (lang: string, t: any) => [
  {
    id: 'pokedex',
    title: t.pokedex.title,
    desc: t.pokedex.desc,
    icon: PawPrint,
    href: `/${lang}/pokedex`,
    image: '/images/pokemon/high-res/479.png', // Rotom
    imageSize: 160,
    color: 'cyan',
    accent: 'text-cyan-400',
    borderHover: 'hover:border-cyan-500/50',
    glowHover: 'hover:shadow-[0_0_25px_rgba(34,211,238,0.15)]',
    bgHover: 'hover:bg-cyan-950/20',
    iconBg: 'bg-cyan-500/10 border-cyan-500/30',
    stat: t.pokedex.stat,
  },
  {
    id: 'movedex',
    title: t.movedex.title,
    desc: t.movedex.desc,
    icon: Disc,
    href: `/${lang}/moves`,
    image: '/images/pokemon/high-res/151.png', // Mew
    imageSize: 130,
    color: 'orange',
    accent: 'text-orange-400',
    borderHover: 'hover:border-orange-500/50',
    glowHover: 'hover:shadow-[0_0_25px_rgba(251,146,60,0.15)]',
    bgHover: 'hover:bg-orange-950/20',
    iconBg: 'bg-orange-500/10 border-orange-500/30',
    stat: t.movedex.stat,
  },
  {
    id: 'itemdex',
    title: t.itemdex.title,
    desc: t.itemdex.desc,
    icon: Apple,
    href: `/${lang}/items`,
    image: '/images/items/high-res/assault-vest.png',
    imageSize: 110,
    color: 'amber',
    accent: 'text-amber-400',
    borderHover: 'hover:border-amber-500/50',
    glowHover: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
    bgHover: 'hover:bg-amber-950/20',
    iconBg: 'bg-amber-500/10 border-amber-500/30',
    stat: t.itemdex.stat,
  },
  {
    id: 'abilitydex',
    title: t.abilitydex.title,
    desc: t.abilitydex.desc,
    icon: SendToBack,
    href: `/${lang}/abilities`,
    image: '/images/pokemon/high-res/727.png', // Incineroar
    imageSize: 170,
    color: 'purple',
    accent: 'text-purple-400',
    borderHover: 'hover:border-purple-500/50',
    glowHover: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]',
    bgHover: 'hover:bg-purple-950/20',
    iconBg: 'bg-purple-500/10 border-purple-500/30',
    stat: t.abilitydex.stat,
  },
];

export default function DexLanding({ lang, dict }: DexLandingProps) {
  const t = dict.dex_landing;
  const cards = DEX_CARDS(lang, t);

  return (
    <div className="relative w-full min-h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Background noise */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Prof Oak background — pinned bottom right, ultra subtle */}
      <div className="fixed bottom-0 right-0 w-[500px] h-[700px] pointer-events-none z-0 opacity-[0.04] mix-blend-luminosity">
        <Image
          src="/images/misc/prof_oak.webp"
          alt=""
          fill
          className="object-contain object-bottom"
          priority={false}
        />
      </div>

      {/* Content */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          {/* Badge */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Database size={18} className="text-emerald-400" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-400/70">
              {t.badge}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display font-bold text-4xl md:text-5xl text-white mb-3 tracking-tight">
            {t.title_prefix} <span className="text-emerald-400">{t.title_highlight}</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm md:text-base font-mono text-slate-400 max-w-xl leading-relaxed">
            {t.subtitle}
          </p>

          {/* Decorative line */}
          <div className="mt-6 h-px w-32 bg-gradient-to-r from-emerald-500/60 to-transparent" />
        </motion.div>

        {/* 2×2 Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.5 }}
              >
                <Link
                  href={card.href}
                  className={cn(
                    "group relative flex flex-col justify-between p-6 md:p-8 rounded-xl border border-slate-800 backdrop-blur-md bg-slate-900/50 transition-all duration-300 overflow-hidden h-full min-h-[220px]",
                    card.borderHover, card.glowHover, card.bgHover,
                  )}
                >
                  {/* Card header */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-lg border", card.iconBg)}>
                          <Icon size={20} className={card.accent} />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-lg text-white tracking-wide">{card.title}</h3>
                          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-600">{card.stat}</span>
                        </div>
                      </div>
                      <ArrowRight size={16} className={cn("transition-transform duration-300 group-hover:translate-x-1", card.accent)} />
                    </div>

                    <p className="text-xs font-mono text-slate-400 leading-relaxed max-w-[80%]">
                      {card.desc}
                    </p>
                  </div>

                  {/* Floating image */}
                  <div className="absolute -bottom-2 -right-4 opacity-20 group-hover:opacity-40 transition-all duration-500 group-hover:scale-105 pointer-events-none">
                    <Image
                      src={card.image}
                      alt={card.title}
                      width={card.imageSize}
                      height={card.imageSize}
                      className="object-contain drop-shadow-2xl"
                    />
                  </div>

                  {/* Bottom glow line */}
                  <div className={cn(
                    "absolute bottom-0 left-0 right-0 h-[2px] transition-opacity duration-300 opacity-0 group-hover:opacity-100",
                    `bg-gradient-to-r from-transparent via-${card.color}-500/60 to-transparent`
                  )} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
