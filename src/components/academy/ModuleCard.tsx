'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, List, Info, Shield, Zap, Dna, Swords, Flame, Egg, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleData {
  id: string;
  title: string;
  description: string;
  syllabus: string[];
  href: string;
}

interface ModuleCardProps {
  module: ModuleData;
  lang: string;
  labels: {
    access_btn: string;
    view_syllabus: string;
    view_desc: string;
  };
}

// Configuración de Activos por Módulo
const MODULE_ASSETS: Record<string, { icon: LucideIcon, pokeId: number, color: string }> = {
  'm1': { icon: Shield, pokeId: 143,   color: "text-emerald-400" }, // Snorlax
  'm2': { icon: Zap,    pokeId: 59,    color: "text-blue-400" },    // Arcanine
  'm3': { icon: Dna,    pokeId: 150,   color: "text-purple-400" },  // Mewtwo
  'm4': { icon: Swords, pokeId: 727,   color: "text-amber-400" },   // Incineroar
  'm5': { icon: Flame,  pokeId: 10050, color: "text-red-400" },     // Mega Blaziken
  'm6': { icon: Egg,    pokeId: 132,   color: "text-pink-300" },    // Ditto
};

export default function ModuleCard({ module, lang, labels }: ModuleCardProps) {
  const [showSyllabus, setShowSyllabus] = useState(false);

  // Activos del módulo
  const asset = MODULE_ASSETS[module.id] || { icon: Shield, pokeId: 0, color: "text-slate-400" };
  const IconComponent = asset.icon;
  
  // URL Arte Oficial
  const pokemonImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${asset.pokeId}.png`;

  return (
    <motion.div 
      layout 
      className="group relative flex flex-col bg-slate-900/80 border border-slate-800 hover:border-brand-cyan/40 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(34,211,238,0.3)] min-h-[280px]"
    >
      {/* VISUAL POKEMON COMPONENT 
         Posicionado en la esquina inferior derecha como detalle gráfico de alta fidelidad.
      */}
      <div className="absolute -bottom-8 -right-8 w-56 h-56 z-0 pointer-events-none transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:-translate-x-2">
        <Image
          src={pokemonImageUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain opacity-30 group-hover:opacity-50 saturate-[0.7] group-hover:saturate-100 transition-all duration-500"
          style={{
             // Máscara para que se funda suavemente con el fondo de la tarjeta
             maskImage: 'linear-gradient(to top left, black 40%, transparent 100%)',
             WebkitMaskImage: 'linear-gradient(to top left, black 40%, transparent 100%)'
          }}
        />
      </div>

      {/* CONTENIDO DE LA TARJETA */}
      <div className="relative z-10 flex flex-col h-full bg-gradient-to-br from-transparent via-slate-950/20 to-slate-950/80">
        
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-start">
          <div className="space-y-2 max-w-[80%]">
            {/* ID Badge */}
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-md bg-slate-950 border border-slate-800", asset.color)}>
                 <IconComponent size={14} />
              </div>
              <span className={cn("text-[10px] font-mono uppercase tracking-widest opacity-80", asset.color)}>
                DATA_ID: {module.id.toUpperCase()}
              </span>
            </div>
            
            {/* Título */}
            <h3 className="text-xl font-display font-bold text-white group-hover:text-brand-cyan transition-colors line-clamp-1">
              {module.title}
            </h3>
          </div>
          
          {/* Toggle Info/Syllabus */}
          <button
            onClick={() => setShowSyllabus(!showSyllabus)}
            className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all backdrop-blur-md shadow-lg"
            title={showSyllabus ? labels.view_desc : labels.view_syllabus}
          >
            {showSyllabus ? <Info size={18} /> : <List size={18} />}
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 px-6 py-4 relative">
          <AnimatePresence mode="wait">
            {!showSyllabus ? (
              <motion.div
                key="description"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="relative z-10"
              >
                <p className="text-sm text-slate-300 leading-relaxed font-medium pr-8">
                  {module.description}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="syllabus"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-2 relative z-10"
              >
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-2 border-b border-slate-800 pb-1 w-fit">
                  {labels.view_syllabus}
                </span>
                <ul className="space-y-1.5">
                  {module.syllabus.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-200 bg-slate-950/40 rounded px-2 py-1 w-fit max-w-full backdrop-blur-[2px]">
                      <span className={cn("mt-0.5", asset.color)}>◆</span>
                      <span className="truncate">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Action */}
        <div className="p-4 mt-auto">
          <Link
            href={`/${lang}${module.href}`}
            className={cn(
              "flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-bold font-mono uppercase tracking-wide transition-all shadow-lg",
              "bg-slate-950/80 border border-slate-800 text-slate-300",
              "hover:bg-brand-cyan hover:text-slate-950 hover:border-brand-cyan group/btn"
            )}
          >
            <span>{labels.access_btn}</span>
            <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}