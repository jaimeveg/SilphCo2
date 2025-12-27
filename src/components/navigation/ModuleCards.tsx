'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Shield, Zap, Dna, Swords, Flame, Egg, Terminal } from 'lucide-react';

const MODULES = [
  {
    id: '01',
    title: 'Fundamentos',
    icon: Shield,
    styles:
      'border-emerald-500/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/40',
  },
  {
    id: '02',
    title: 'Dinámicas',
    icon: Zap,
    styles:
      'border-blue-500/50 bg-blue-950/20 text-blue-400 hover:bg-blue-900/40',
  },
  {
    id: '03',
    title: 'Entrenamiento',
    icon: Dna,
    styles:
      'border-purple-500/50 bg-purple-950/20 text-purple-400 hover:bg-purple-900/40',
  },
  {
    id: '04',
    title: 'Estrategia',
    icon: Swords,
    styles:
      'border-amber-500/50 bg-amber-950/20 text-amber-400 hover:bg-amber-900/40',
  },
  {
    id: '05',
    title: 'Fenómenos',
    icon: Flame,
    styles: 'border-red-500/50 bg-red-950/20 text-red-400 hover:bg-red-900/40',
  },
  {
    id: '06',
    title: 'Crianza',
    icon: Egg,
    styles:
      'border-slate-500/50 bg-slate-800/20 text-slate-300 hover:bg-slate-800/40',
  },
];

export default function ModuleCards() {
  return (
    // FIX: Quitamos sticky y top-0 de aquí. Ahora es un bloque estático dentro del header sticky.
    // FIX: Aumentamos padding superior (pt-6) para espacio del hover y título.
    <div className="w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 pt-6 pb-4">
      {/* Título de Sección */}
      <div className="max-w-7xl mx-auto px-6 mb-3 flex items-center gap-2 opacity-70">
        <Terminal size={12} className="text-brand-cyan" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
          SILPH_OS // KNOWLEDGE_BASE_MODULES
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-6 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <div className="flex items-center gap-3 min-w-max px-1 py-1">
          {/* Padding interno extra px-1 py-1 para evitar clipping del outline/shadow */}
          {MODULES.map((mod) => (
            <motion.div
              key={mod.id}
              whileHover={{ y: -4, scale: 1.02 }} // Ajustado y ligeramente más desplazamiento
              whileTap={{ scale: 0.98 }}
              className={cn(
                'relative group cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 min-w-[180px]',
                mod.styles,
                mod.id === '01'
                  ? 'shadow-[0_0_15px_-3px_rgba(0,0,0,0.3)] ring-1 ring-white/10'
                  : 'opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
              )}
            >
              <div className="p-2 rounded-lg bg-slate-950/50 border border-white/5">
                <mod.icon size={18} />
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] font-mono uppercase tracking-widest opacity-70">
                  MOD_{mod.id}
                </span>
                <span className="text-sm font-display font-bold leading-none mt-1">
                  {mod.title}
                </span>
              </div>

              {mod.id === '01' && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
