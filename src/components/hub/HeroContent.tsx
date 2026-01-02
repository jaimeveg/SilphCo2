'use client';

import { Terminal, ShieldCheck, ArrowRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HeroContentProps {
  dict: any;
  onExploreClick: () => void;
  onBackClick: () => void;
  showNavigation: boolean;
}

export default function HeroContent({ dict, onExploreClick, onBackClick, showNavigation }: HeroContentProps) {
  const t = dict.landing.hero;

  return (
    <div className="flex flex-col space-y-8 relative">
              
      {/* HEADER & BRANDING */}
      <div className="space-y-6">
          <div className="flex items-center gap-2 text-brand-cyan/70 font-mono text-[10px] md:text-xs tracking-widest uppercase">
            <Terminal size={12} />
            <span>{t.sim_id}</span>
          </div>

          <h1 className="flex flex-col font-display font-bold tracking-tighter leading-none select-none">
            <span className="text-5xl md:text-5xl lg:text-6xl text-brand-cyan drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] mb-2 block">
                {t.company_name}
            </span>
            <span className="text-4xl md:text-6xl lg:text-7xl text-white opacity-90 block">
                {t.app_name}
            </span>
          </h1>
          
          <div className="pt-1">
            <span className="inline-block px-3 py-1 bg-brand-cyan/10 border-l-4 border-brand-cyan text-brand-cyan font-bold font-mono text-sm md:text-base tracking-widest uppercase">
                {t.tagline}
            </span>
          </div>
      </div>

      <p className="text-lg text-slate-400 font-light max-w-lg leading-relaxed">
        {t.description}
      </p>

      {/* CTA PRINCIPAL (Desaparece al explorar) */}
      <div className="h-16 flex items-center"> {/* Contenedor de altura fija para evitar saltos */}
        <AnimatePresence mode="wait">
            {!showNavigation && (
                <motion.div
                    key="cta-btn"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, pointerEvents: 'none' }}
                >
                    <button
                        onClick={onExploreClick}
                        className="group relative inline-flex items-center gap-3 px-8 py-3 bg-brand-cyan text-slate-950 font-bold font-display text-lg tracking-wider uppercase rounded overflow-hidden transition-all hover:bg-white hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
                    >
                        <span className="relative z-10">{t.cta}</span>
                        <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* FOOTER STATS */}
      <div className="hidden md:flex gap-6 pt-4 border-t border-slate-800/50 mt-4">
         <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            SYSTEM_ONLINE
         </div>
         <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <ShieldCheck size={12} />
            SECURE_CONNECTION
         </div>
      </div>

    </div>
  );
}