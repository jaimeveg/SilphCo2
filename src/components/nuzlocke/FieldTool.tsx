'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Swords, Crosshair, LucideIcon, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolData {
  id: string;
  title: string;
  desc: string;
  status: string;
  href: string;
  icon: string;
}

interface FieldToolProps {
  tool: ToolData;
}

const ICONS: Record<string, LucideIcon> = {
  'Sword': Swords,
  'Radar': Crosshair,
};

export default function FieldTool({ tool }: FieldToolProps) {
  const Icon = ICONS[tool.icon] || Crosshair;
  const isOnline = tool.status === 'online';

  const Content = (
    <motion.div
      whileHover={isOnline ? { scale: 1.01 } : {}} // Hover más sutil
      className={cn(
        "relative flex items-center p-6 border-l-4 rounded-r-lg overflow-hidden group transition-all duration-300",
        isOnline
          // CAMBIO: Usamos red-700/600 en lugar de red-500 para un tono más oscuro/militar
          ? "bg-slate-900 border-l-red-700 border-y border-r border-slate-800 hover:bg-slate-800 hover:border-red-600/50"
          : "bg-slate-950/50 border-l-amber-900/30 border-y border-r border-slate-900 opacity-60 cursor-not-allowed"
      )}
    >
      {/* Background Warning Stripes (Oscurecidas) */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none" 
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent 100%)',
          backgroundSize: '10px 10px'
        }}
      />

      {/* Icon Area */}
      <div className={cn(
        "flex-shrink-0 w-12 h-12 flex items-center justify-center rounded border mr-5 relative z-10",
        isOnline
          // CAMBIO: Tono rojo sangre seca
          ? "bg-red-950/40 border-red-700/40 text-red-600 group-hover:text-red-500 group-hover:border-red-500"
          : "bg-slate-900 border-slate-800 text-slate-600"
      )}>
        {isOnline ? <Icon size={24} /> : <Lock size={20} />}
      </div>

      {/* Text Content */}
      <div className="flex-1 relative z-10">
        <div className="flex justify-between items-center mb-1">
          <h3 className={cn(
            "font-display font-bold text-lg tracking-wide uppercase",
            isOnline ? "text-slate-200 group-hover:text-white" : "text-slate-500"
          )}>
            {tool.title}
          </h3>
          {!isOnline && (
            <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-900/20">
              DEV_BUILD
            </span>
          )}
        </div>
        <p className="text-sm text-slate-400 font-mono leading-tight">
          {tool.desc}
        </p>
      </div>

      {/* Corner Accent (Apagado) */}
      {isOnline && (
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-800 opacity-50 group-hover:opacity-100 transition-opacity" />
      )}
    </motion.div>
  );

  if (isOnline) {
    return <Link href={tool.href} className="block w-full">{Content}</Link>;
  }

  return <div className="block w-full">{Content}</div>;
}