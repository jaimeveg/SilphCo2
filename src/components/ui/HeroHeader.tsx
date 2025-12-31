'use client';
import { motion } from 'framer-motion';
import { Factory, Terminal } from 'lucide-react';
import { TextScramble } from './TextScramble';

export default function HeroHeader({ dict }: { dict: any }) {
  const t = dict.hero;

  return (
    <header className="relative h-[60vh] flex flex-col items-center justify-center border-b border-slate-800/50 overflow-hidden bg-slate-950">
      {/* Background Industrial Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.05]" />

      {/* Luz Ambiental */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-brand-cyan/5 via-transparent to-slate-950 pointer-events-none" />

      <div className="relative z-10 text-center space-y-6 px-4">
        {/* Badge Superior */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 px-4 py-1.5 bg-slate-900 border border-slate-700 rounded-sm"
        >
          <Factory size={14} className="text-brand-cyan" />
          <span className="text-[10px] font-mono text-slate-400 tracking-[0.2em] uppercase">
            {t.badge}
          </span>
        </motion.div>

        {/* Título Principal */}
        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter text-white drop-shadow-2xl uppercase">
          {t.title_prefix}{' '}
          <span className="text-brand-cyan block md:inline">{t.title_highlight}</span>
        </h1>

        {/* Descripción Técnica */}
        <div className="max-w-xl mx-auto flex items-start gap-3 text-left bg-slate-900/50 p-4 rounded border-l-2 border-brand-cyan backdrop-blur-sm">
          <Terminal size={20} className="text-slate-500 mt-1 shrink-0" />
          <p className="text-sm md:text-base text-slate-300 font-mono leading-relaxed">
            <TextScramble text={t.description} />
          </p>
        </div>
      </div>
    </header>
  );
}