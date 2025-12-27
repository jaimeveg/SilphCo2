'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronRight, Zap, Lock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { NAVIGATION_DATA } from '@/data/navigation'; // <--- Importamos la data

export default function FullSidebar() {
  const [activeMenu, setActiveMenu] = useState<string | null>('modules');
  const [expandedSub, setExpandedSub] = useState<string | null>(
    '01. Fundamentos'
  );

  const toggleMenu = (id: string) =>
    setActiveMenu(activeMenu === id ? null : id);
  const toggleSub = (label: string) =>
    setExpandedSub(expandedSub === label ? null : label);

  return (
    // FIX 1: overflow-hidden estricto para evitar sliders laterales
    // FIX 2: z-[9999] para estar por encima de todo
    <aside className="fixed left-0 top-0 h-full bg-slate-950 border-r border-slate-800/50 flex flex-col transition-all duration-300 ease-in-out z-[9999] w-20 hover:w-80 group shadow-2xl overflow-hidden">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800/50 shrink-0 bg-slate-950 relative z-20">
        <div className="w-8 h-8 bg-brand-cyan rounded-lg flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
          <Zap className="text-slate-950 fill-current" size={20} />
        </div>
        <span className="ml-4 font-display font-bold text-xl tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-white delay-100 absolute left-16">
          SILPH OS
        </span>
      </div>

      {/* Navigation - FIX SCROLLBAR: [&::-webkit-scrollbar]:hidden */}
      <nav className="flex-1 py-8 px-3 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block hover:[&::-webkit-scrollbar]:w-1 hover:[&::-webkit-scrollbar-thumb]:bg-slate-700">
        {NAVIGATION_DATA.map((item) => {
          // Renderizado condicional según si es Link directo o Acordeón
          if (item.type === 'link') {
            return (
              <Link
                key={item.id}
                href={item.href!}
                className="flex items-center gap-4 px-3 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors relative"
              >
                <item.icon size={24} className="shrink-0" />
                {/* FIX TEXTO CORTADO: Absolute positioning + Opacity control */}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap absolute left-14">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => toggleMenu(item.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors relative overflow-hidden',
                  activeMenu === item.id
                    ? 'text-brand-cyan bg-brand-cyan/5'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={24} className="shrink-0 relative z-10" />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap font-medium absolute left-14">
                    {item.label}
                  </span>
                </div>
                <ChevronRight
                  size={16}
                  className={cn(
                    'opacity-0 group-hover:opacity-100 transition-all duration-200 absolute right-4',
                    activeMenu === item.id && 'rotate-90'
                  )}
                />
              </button>

              {/* Submenu Area */}
              <AnimatePresence>
                {activeMenu === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    // FIX TEXTO CORTADO: hidden group-hover:block asegura que si el sidebar está cerrado, esto NO se renderiza visualmente
                    className="overflow-hidden bg-slate-900/30 rounded-lg mx-2 hidden group-hover:block"
                  >
                    <div className="py-2 space-y-1">
                      {item.subItems?.map((sub: any, idx: number) => (
                        <div key={idx}>
                          {sub.locked ? (
                            <div className="flex items-center justify-between px-4 py-2 text-sm text-slate-600 cursor-not-allowed">
                              <span className="flex items-center gap-2">
                                {sub.label}
                              </span>
                              <Lock size={12} />
                            </div>
                          ) : (
                            <div
                              className="flex items-center justify-between px-4 py-2 text-sm text-slate-400 hover:text-brand-cyan hover:bg-brand-cyan/5 cursor-pointer rounded transition-colors"
                              onClick={() =>
                                sub.sections && toggleSub(sub.label)
                              }
                            >
                              {sub.sections ? (
                                <span className="flex-1 select-none">
                                  {sub.label}
                                </span>
                              ) : (
                                <Link href={sub.href} className="flex-1 block">
                                  {sub.label}
                                </Link>
                              )}

                              {sub.sections && (
                                <ChevronRight
                                  size={12}
                                  className={cn(
                                    'transition-transform',
                                    expandedSub === sub.label && 'rotate-90'
                                  )}
                                />
                              )}
                            </div>
                          )}

                          {/* Level 3: Sections */}
                          {sub.sections && expandedSub === sub.label && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              className="overflow-hidden pl-6 border-l border-slate-800 ml-4 my-1"
                            >
                              {sub.sections.map((sec: any, sIdx: number) => (
                                <Link
                                  key={sIdx}
                                  href={sec.href} // Ahora usa ruta absoluta '/#section'
                                  className="block py-1.5 text-xs text-slate-500 hover:text-white transition-colors"
                                >
                                  {sec.label}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer User */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-950 shrink-0">
        <button className="flex items-center gap-4 w-full px-2 text-slate-400 hover:text-white transition-colors relative">
          <Settings size={24} className="shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm whitespace-nowrap delay-100 absolute left-14">
            Ajustes
          </span>
        </button>
      </div>
    </aside>
  );
}
