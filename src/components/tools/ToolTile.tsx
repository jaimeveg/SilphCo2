'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Swords, Dna, Flame, Sparkles, Wrench, Skull, LucideIcon, Lock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolData {
  id: string;
  name: string;
  desc: string;
  category: string;
  status: string; // 'online' | 'dev'
  href: string;
}

interface ToolTileProps {
  tool: ToolData;
  lang: string;
}

// Mapeo de Iconos por ID
const TOOL_ICONS: Record<string, LucideIcon> = {
  'type-calc': Zap,
  'damage-calc': Swords,
  'pokedex': Dna,
  'moves': Flame,
  'abilities': Sparkles,
  'teambuilder': Wrench,
  'nuzlocke': Skull
};

// USAMOS forwardRef PARA QUE FRAMER MOTION PUEDA MEDIR EL COMPONENTE
const ToolTile = forwardRef<HTMLDivElement, ToolTileProps>(({ tool, lang }, ref) => {
  const Icon = TOOL_ICONS[tool.id] || Zap;
  const isOnline = tool.status === 'online';

  // Contenido interno animado
  const InnerContent = (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative flex flex-col h-full p-6 rounded-xl border transition-all duration-300 overflow-hidden",
        isOnline 
          ? "bg-slate-900/60 border-slate-800 hover:border-brand-cyan/50 hover:bg-slate-900/80 hover:shadow-[0_0_20px_-5px_rgba(34,211,238,0.2)]" 
          : "bg-slate-950/40 border-slate-900 opacity-60 grayscale-[0.5]"
      )}
    >
      {/* Hover Effect: Scanline (Solo Online) */}
      {isOnline && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-cyan/5 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 pointer-events-none" />
      )}

      {/* Header: Icon & Status */}
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "p-2 rounded-lg border",
          isOnline 
            ? "bg-slate-950 border-brand-cyan/20 text-brand-cyan" 
            : "bg-slate-950 border-slate-800 text-slate-500"
        )}>
          <Icon size={20} />
        </div>
        
        <div className="flex items-center gap-2">
          <span className={cn(
            "flex w-2 h-2 rounded-full",
            isOnline ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-amber-500/50"
          )} />
          <span className={cn(
            "text-[10px] font-mono font-bold tracking-widest uppercase",
            isOnline ? "text-emerald-400" : "text-amber-500/70"
          )}>
            {isOnline ? 'ONLINE' : 'DEV_MODE'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <h3 className={cn(
          "font-display font-bold text-lg tracking-wide transition-colors",
          isOnline ? "text-white group-hover:text-brand-cyan" : "text-slate-400"
        )}>
          {tool.name}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed font-mono">
          {tool.desc}
        </p>
      </div>

      {/* Footer Action */}
      <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center">
        <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
          ID: {tool.id.toUpperCase()}
        </span>
        {isOnline ? (
          <ArrowRight size={16} className="text-slate-500 group-hover:text-brand-cyan group-hover:translate-x-1 transition-all" />
        ) : (
          <Lock size={14} className="text-slate-700" />
        )}
      </div>

    </motion.div>
  );

  // Renderizado Condicional con REF
  if (isOnline) {
    return (
      <Link href={`/${lang}${tool.href}`} className="block h-full" ref={ref as any}>
        {InnerContent}
      </Link>
    );
  }

  return (
    <div className="h-full cursor-not-allowed" ref={ref}>
      {InnerContent}
    </div>
  );
});

ToolTile.displayName = 'ToolTile';

export default ToolTile;