'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lock } from 'lucide-react';
import { MODULE_1_NAVIGATION } from '@/data/navigation';

export default function StickySubNav() {
  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // LIVE TRACKING: Delegamos en Lenis el cálculo dinámico
      const globalLenis = (window as any).lenis;
      
      if (globalLenis?.lenis) {
        globalLenis.lenis.scrollTo(element, { 
          offset: -140, // Offset negativo para dejar espacio arriba
          duration: 1.5,
          lock: true,
        });
      } else {
        // Fallback
        const offset = 140;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="w-full h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60 z-40">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <ModuleSwitcher />
        <div className="flex items-center gap-1 h-full">
          {MODULE_1_NAVIGATION.map((section) => (
            <NavGroup
              key={section.id}
              section={section}
              onNavigate={handleScrollTo}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

// --- SUBCOMPONENTES AUXILIARES ---

function ModuleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-2 text-xs font-mono text-brand-cyan hover:text-white transition-colors py-2 uppercase tracking-widest font-bold cursor-pointer">
        <span className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse" />
        <span>Módulo 01: Fundamentos</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full left-0 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden py-2 z-50"
          >
            <div className="px-4 py-2 text-[10px] text-slate-500 font-mono uppercase border-b border-slate-800/50 mb-1">
              Seleccionar Módulo
            </div>
            
            <ModuleOption label="01. Fundamentos" active />
            <ModuleOption label="02. Dinámicas de Turno" locked />
            <ModuleOption label="03. Genética y Crianza" locked />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModuleOption({ label, active, locked }: { label: string; active?: boolean; locked?: boolean }) {
  return (
    <div className={`px-4 py-3 flex items-center justify-between text-xs font-mono transition-colors ${
      active ? 'bg-brand-cyan/10 text-brand-cyan border-l-2 border-brand-cyan' : 
      locked ? 'text-slate-600 cursor-not-allowed opacity-60' : 'text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer'
    }`}>
      <span>{label}</span>
      {locked && <Lock size={12} />}
      {active && <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full" />}
    </div>
  );
}

function NavGroup({ section, onNavigate }: { section: any; onNavigate: (id: string) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = section.icon;

  return (
    <div
      className="relative h-full flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition-all duration-200 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer ${
          isHovered ? 'bg-slate-800 text-brand-cyan' : 'text-slate-500 hover:text-slate-200'
        }`}
      >
        <Icon size={14} />
        <span>{section.label}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isHovered ? 'rotate-180 text-brand-cyan' : 'opacity-50'}`} />
      </button>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1 z-50"
          >
            {section.items.map((item: any) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setIsHovered(false); }}
                className="w-full text-left px-4 py-2.5 text-[11px] font-mono text-slate-400 hover:text-brand-cyan hover:bg-slate-800 transition-colors uppercase tracking-wide border-l-2 border-transparent hover:border-brand-cyan"
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}