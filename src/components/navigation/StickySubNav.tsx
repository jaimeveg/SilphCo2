'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lock } from 'lucide-react';
import { NavSection } from '@/data/navigation'; // Importamos solo el TIPO

interface StickySubNavProps {
  sections: NavSection[]; // Recibimos la estructura ya traducida
  dict: any; // Recibimos el diccionario para textos fijos (opcional si ya viene todo en sections)
}

export default function StickySubNav({ sections, dict }: StickySubNavProps) {
  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const globalLenis = (window as any).lenis;
      
      if (globalLenis?.lenis) {
        globalLenis.lenis.scrollTo(element, { 
          offset: -140,
          duration: 1.5,
          lock: true,
        });
      } else {
        const offset = 140;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }
  };

  return (
    <nav className="w-full h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60 z-40">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <ModuleSwitcher dict={dict} />
        <div className="flex items-center gap-1 h-full">
          {sections.map((section) => (
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

function ModuleSwitcher({ dict }: { dict: any }) {
  const [isOpen, setIsOpen] = useState(false);

  // Usamos textos seguros por si dict falla o es parcial
  const labelMod1 = dict?.navigation?.modules?.mod1 || "Módulo 01";
  const labelMod2 = dict?.navigation?.modules?.mod2 || "Módulo 02";
  const labelMod3 = dict?.navigation?.modules?.mod3 || "Módulo 03";

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="flex items-center gap-2 text-xs font-mono text-cyan-500 hover:text-white transition-colors py-2 uppercase tracking-widest font-bold cursor-pointer">
        <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
        <span className="truncate max-w-[150px] md:max-w-none">{labelMod1}</span>
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
              Select Module
            </div>
            
            <ModuleOption label={labelMod1} active />
            <ModuleOption label={labelMod2} locked />
            <ModuleOption label={labelMod3} locked />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModuleOption({ label, active, locked }: { label: string; active?: boolean; locked?: boolean }) {
  return (
    <div className={`px-4 py-3 flex items-center justify-between text-xs font-mono transition-colors ${
      active ? 'bg-cyan-500/10 text-cyan-500 border-l-2 border-cyan-500' : 
      locked ? 'text-slate-600 cursor-not-allowed opacity-60' : 'text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer'
    }`}>
      <span className="truncate">{label}</span>
      {locked && <Lock size={12} className="flex-shrink-0 ml-2" />}
      {active && <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full flex-shrink-0 ml-2" />}
    </div>
  );
}

function NavGroup({ section, onNavigate }: { section: NavSection; onNavigate: (id: string) => void }) {
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
          isHovered ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-200'
        }`}
      >
        <Icon size={14} />
        <span className="hidden lg:inline">{section.label}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isHovered ? 'rotate-180 text-cyan-400' : 'opacity-50'}`} />
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
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setIsHovered(false); }}
                className="w-full text-left px-4 py-2.5 text-[11px] font-mono text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors uppercase tracking-wide border-l-2 border-transparent hover:border-cyan-500"
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