'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { TYPES, getEffectiveness } from '@/lib/typeLogic';
import { cn } from '@/lib/utils';

interface TypeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mapa de colores de fondo por tipo (Tailwind classes)
const TYPE_BG_COLORS: Record<string, string> = {
  normal: 'bg-neutral-500',
  fire: 'bg-orange-500',
  water: 'bg-blue-500',
  grass: 'bg-green-500',
  electric: 'bg-yellow-500',
  ice: 'bg-cyan-400',
  fighting: 'bg-red-600',
  poison: 'bg-purple-500',
  ground: 'bg-amber-600',
  flying: 'bg-indigo-400',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-stone-500',
  ghost: 'bg-violet-600',
  dragon: 'bg-indigo-600',
  steel: 'bg-slate-500',
  dark: 'bg-neutral-600',
  fairy: 'bg-rose-400',
};

export default function TypeChartModal({ isOpen, onClose }: TypeChartModalProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      
      const globalLenis = (window as any).lenis;
      if (globalLenis?.lenis) {
         globalLenis.lenis.stop();
      } else if (globalLenis && typeof globalLenis.stop === 'function') {
         globalLenis.stop();
      }

      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      
      return () => {
        window.removeEventListener('keydown', handleEsc);
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        
        if (globalLenis?.lenis) {
           globalLenis.lenis.start();
        } else if (globalLenis && typeof globalLenis.start === 'function') {
           globalLenis.start();
        }
      };
    }
  }, [isOpen, onClose]);

  // Helpers
  const activeAttacker = hoveredRow !== null ? TYPES[hoveredRow] : null;
  const activeDefender = hoveredCol !== null ? TYPES[hoveredCol] : null;

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
          />

          {/* MODAL CONTAINER */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-fit max-w-[95vw] max-h-[90vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-950 shrink-0 z-50">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-pulse" />
                <h2 className="text-sm font-display font-bold text-white tracking-widest uppercase">
                  Tabla de Tipos
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* SCROLLABLE AREA */}
            <div 
              data-lenis-prevent="true"
              className="flex-1 min-h-0 overflow-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain bg-slate-950"
            >
              {/* WRAPPER INTERNO */}
              <div className="inline-block min-w-max relative p-6">
                
                {/* ETIQUETAS FLOTANTES */}
                <div className="absolute top-2 left-12 right-0 h-6 flex items-center justify-center pointer-events-none z-50">
                  <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-brand-cyan uppercase tracking-widest bg-slate-950/90 px-2 rounded backdrop-blur-sm border border-brand-cyan/20 shadow-lg">
                    <span>Defensor (Recibe)</span>
                    <ArrowRight size={10} />
                  </div>
                </div>
                <div className="absolute top-14 bottom-0 left-2 w-6 flex items-center justify-center pointer-events-none z-50">
                   <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-brand-cyan uppercase tracking-widest bg-slate-950/90 px-2 rounded backdrop-blur-sm border border-brand-cyan/20 -rotate-90 whitespace-nowrap shadow-lg">
                    <span>Atacante (Movimiento)</span>
                    <ArrowRight size={10} />
                  </div>
                </div>

                {/* GRID TABLE */}
                <div 
                  className="grid ml-8 mt-8 border-t border-l border-slate-800"
                  style={{ 
                    gridTemplateColumns: `auto repeat(${TYPES.length}, minmax(32px, 1fr))` 
                  }}
                  onMouseLeave={() => {
                    setHoveredRow(null);
                    setHoveredCol(null);
                  }}
                >
                  {/* CORNER (La referencia de lógica perfecta) */}
                  <div className="sticky top-0 left-0 z-50 bg-slate-950 p-1 border-b border-r border-slate-800 pointer-events-none" />

                  {/* CABECERA DEFENSORES (Refactorizada con lógica Corner) */}
                  {TYPES.map((type, i) => (
                    <div 
                      key={`header-col-${type}`}
                      // SHELL: Posicionamiento Sticky + Estructura Sólida
                      className={cn(
                        "sticky top-0 z-40 bg-slate-950 p-1 border-b border-r border-slate-800",
                        hoveredCol === i ? "shadow-[0_4px_12px_rgba(0,0,0,0.5)] z-45" : ""
                      )}
                    >
                      {/* CONTENT: Estética y Efectos */}
                      <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-sm group cursor-help transition-all">
                          
                          {/* Tintado */}
                          <div className={cn(
                            "absolute inset-0 opacity-20 transition-opacity pointer-events-none", 
                            TYPE_BG_COLORS[type] || "bg-slate-800",
                            hoveredCol === i ? "opacity-40" : "opacity-20"
                          )} />
                          
                          {/* Icono */}
                          <div 
                            className="relative z-10 w-full h-full flex items-center justify-center"
                            onMouseEnter={() => { setHoveredCol(i); setHoveredRow(null); }}
                          >
                            <ModalTypeIcon type={type} active={hoveredCol === i} />
                          </div>

                          {/* Indicador */}
                          {hoveredCol === i && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan z-20" />
                          )}
                      </div>
                    </div>
                  ))}

                  {/* CUERPO MATRIZ */}
                  {TYPES.map((attacker, rIndex) => (
                    <>
                      {/* CABECERA ATACANTES (Refactorizada con lógica Corner) */}
                      <div 
                        key={`header-row-${attacker}`}
                        // SHELL
                        className={cn(
                          "sticky left-0 z-40 bg-slate-950 p-1 border-b border-r border-slate-800",
                          hoveredRow === rIndex ? "shadow-[4px_0_12px_rgba(0,0,0,0.5)] z-45" : ""
                        )}
                      >
                         {/* CONTENT */}
                         <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-sm group cursor-help transition-all">
                            
                            <div className={cn(
                              "absolute inset-0 opacity-20 transition-opacity pointer-events-none", 
                              TYPE_BG_COLORS[attacker] || "bg-slate-800",
                              hoveredRow === rIndex ? "opacity-40" : "opacity-20"
                            )} />

                            <div 
                              className="relative z-10 w-full h-full flex items-center justify-center"
                              onMouseEnter={() => { setHoveredRow(rIndex); setHoveredCol(null); }}
                            >
                              <ModalTypeIcon type={attacker} active={hoveredRow === rIndex} />
                            </div>
                            
                            {hoveredRow === rIndex && (
                              <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-brand-cyan z-20" />
                            )}
                         </div>
                      </div>

                      {/* CELDAS DE DATOS */}
                      {TYPES.map((defender, cIndex) => {
                        const effectiveness = getEffectiveness(attacker, defender);
                        
                        const isRowActive = hoveredRow === rIndex;
                        const isColActive = hoveredCol === cIndex;
                        const isCrosshair = isRowActive && isColActive;
                        const isDimmed = (hoveredRow !== null || hoveredCol !== null) && !isRowActive && !isColActive;

                        let content = "";
                        let cellClass = "";

                        if (effectiveness === 2) {
                          content = "2";
                          cellClass = "text-green-400 font-bold bg-green-500/10";
                        } else if (effectiveness === 0.5) {
                          content = "½";
                          cellClass = "text-red-400 bg-red-500/10";
                        } else if (effectiveness === 0) {
                          content = "0";
                          cellClass = "text-slate-600 font-bold bg-slate-800/30";
                        }

                        return (
                          <div
                            key={`${attacker}-${defender}`}
                            onMouseEnter={() => {
                              setHoveredRow(rIndex);
                              setHoveredCol(cIndex);
                            }}
                            className={cn(
                              "h-8 flex items-center justify-center text-[10px] font-mono cursor-default relative border-b border-r border-slate-800/50 transition-all duration-75",
                              cellClass,
                              !cellClass && "text-slate-800",
                              (isRowActive || isColActive) && !isCrosshair && "bg-white/5",
                              isCrosshair && "bg-brand-cyan/20 text-brand-cyan font-bold scale-110 z-10 shadow-lg rounded-sm ring-1 ring-brand-cyan",
                              isDimmed && "opacity-30 blur-[0.5px]"
                            )}
                          >
                            {content}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

function ModalTypeIcon({ type, active }: { type: string; active: boolean }) {
  const normalizedType = type.toLowerCase();
  const iconUrl = `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${normalizedType}.svg`;
  
  return (
    <div 
      className={cn(
        "w-5 h-5 flex items-center justify-center transition-all duration-150",
        active ? "scale-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
      )}
      title={type}
    >
       <img 
         src={iconUrl}
         alt={type}
         className="w-4 h-4 object-contain"
         onError={(e) => {
             e.currentTarget.style.display = 'none';
             e.currentTarget.parentElement!.innerText = type.charAt(0).toUpperCase();
         }}
       />
    </div>
  );
}