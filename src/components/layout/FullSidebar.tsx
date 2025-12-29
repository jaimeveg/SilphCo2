'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CORE_MENU } from '@/data/navigation';
import { Settings, HelpCircle, LogOut, Lock, ChevronRight } from 'lucide-react';

export default function FullSidebar() {
  const [isHovering, setIsHovering] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>('academy');
  
  const pathname = usePathname();
  const router = useRouter();

  // Colapso inteligente al sacar el ratón
  const displayedCategory = isHovering ? openCategory : null;

  const handleNavigation = (id: string) => {
    if (pathname === '/') {
      const element = document.getElementById(id);
      if (element) {
        // USO DE LIVE TRACKING CON LENIS (Offset -140px)
        const globalLenis = (window as any).lenis;
        if (globalLenis?.lenis) {
          globalLenis.lenis.scrollTo(element, { 
            offset: -140, 
            duration: 1.5,
            lock: true 
          });
        } else {
          // Fallback nativo
          const offset = 140; 
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - offset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }
    } else {
      router.push(`/#${id}`);
    }
  };

  return (
    <aside 
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      // TRANSICIÓN DELAY-200 PARA EVITAR APERTURAS ACCIDENTALES
      className="fixed top-0 left-0 h-full z-[9999] bg-slate-950 border-r border-slate-800 transition-all duration-500 delay-200 ease-[cubic-bezier(0.25,1,0.5,1)] w-20 hover:w-80 group shadow-2xl flex flex-col"
    >
      {/* HEADER LOGO */}
      <div className="h-20 flex-shrink-0 flex items-center justify-start px-0 border-b border-slate-800 bg-slate-950 z-20 relative overflow-hidden">
        
        {/* LOGO COLAPSADO ("S.") */}
        <div className="absolute left-0 w-20 h-full flex items-center justify-center transition-opacity duration-300 delay-200 group-hover:opacity-0 pointer-events-none">
          <span className="font-display font-bold text-white text-xl text-brand-cyan">S.</span>
        </div>

        {/* LOGO EXPANDIDO ("SILPH.CO") */}
        <div className="w-full h-full flex items-center px-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
           <span className="font-display font-bold text-white text-xl whitespace-nowrap">
            SILPH<span className="text-brand-cyan">.CO</span>
          </span>
        </div>
      </div>

      {/* CORE NAVIGATION */}
      {/* CRÍTICO:
          1. min-h-0: Permite el scroll interno en flexbox.
          2. data-lenis-prevent: Aísla este scroll del global.
          3. overscroll-contain: Evita propagar el scroll al body.
      */}
      <div 
        data-lenis-prevent="true"
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar py-8 space-y-2 overscroll-contain"
      >
        {CORE_MENU.map((category) => {
          const Icon = category.icon;
          const isOpen = displayedCategory === category.id;
          const isActive = openCategory === category.id;

          return (
            <div key={category.id} className="relative">
              {/* CATEGORY HEADER */}
              <button 
                onClick={() => setOpenCategory(isActive ? null : category.id)}
                className={`w-full h-14 flex items-center transition-all duration-300 delay-200 relative group/cat ${
                  isActive ? 'text-brand-cyan' : 'text-slate-500 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <div className="w-20 min-w-[5rem] flex items-center justify-center relative z-10 flex-shrink-0">
                  <Icon 
                    size={24} 
                    strokeWidth={1.5} 
                    className={`transition-transform duration-500 delay-200 ${isActive && isHovering ? 'scale-110' : ''}`} 
                  />
                </div>

                <div className="flex-1 flex items-center justify-between pr-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200 overflow-hidden whitespace-nowrap">
                  <span className="font-display font-bold text-sm tracking-widest uppercase">
                    {category.label}
                  </span>
                  <ChevronRight 
                    size={16} 
                    className={`transition-transform duration-300 delay-200 ${isOpen ? 'rotate-90 text-brand-cyan' : 'text-slate-700'}`} 
                  />
                </div>
                
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-brand-cyan shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-opacity duration-300 delay-200 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              {/* CONTENIDO DESPLEGABLE */}
              <div className={`overflow-hidden transition-all duration-500 delay-200 ease-in-out bg-slate-900/20 ${isOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'}`}>
                
                {/* BRANCH: ACADEMY (MODULES) */}
                {category.type === 'module_root' && (
                  <div className="flex flex-col pb-4 pt-1 w-full">
                    {category.children.map((module: any) => (
                      <div key={module.id} className="mb-2 w-full">
                        <div className={`px-6 py-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest border-b border-white/5 mx-4 mb-2 ${module.locked ? 'text-slate-700' : 'text-brand-cyan/70'}`}>
                          <span className="truncate">{module.label}</span>
                          {module.locked && <Lock size={10} className="flex-shrink-0 ml-2" />}
                        </div>
                        {!module.locked && (
                          <div className="flex flex-col space-y-0.5">
                            {module.sections?.map((section: any) => (
                              <button
                                key={section.id}
                                onClick={() => handleNavigation(section.id)}
                                className="h-9 w-full flex items-center text-left pl-[4.5rem] pr-4 text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors border-l-2 border-transparent hover:border-brand-cyan/30"
                              >
                                <span className="truncate">{section.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* BRANCH: LINKS (TOOLS) */}
                {category.type === 'link_root' && (
                  <div className="flex flex-col pb-4 pt-2 w-full">
                    {category.children.length > 0 ? (
                      category.children.map((link: any) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="h-10 w-full flex items-center pl-[4.5rem] pr-4 text-xs font-mono text-slate-400 hover:text-brand-cyan hover:bg-slate-800/40 transition-colors"
                        >
                          {link.icon && <link.icon size={14} className="mr-2 flex-shrink-0" />}
                          <span className="uppercase tracking-wide truncate">{link.label}</span>
                        </Link>
                      ))
                    ) : (
                       <div className="pl-[5.5rem] py-3 text-[10px] font-mono text-slate-700 uppercase">
                         // Work In Progress
                       </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 z-20 flex-shrink-0">
        <SidebarAction icon={Settings} label="Configuración" />
        <SidebarAction icon={HelpCircle} label="Ayuda" />
        <div className="h-px bg-slate-800 my-2 opacity-50" />
        <SidebarAction icon={LogOut} label="Salir" />
      </div>
    </aside>
  );
}

// Subcomponente con Delay en opacidad
function SidebarAction({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="w-full flex items-center h-10 text-slate-600 hover:text-white transition-colors group/btn rounded-md hover:bg-slate-900/50">
       <div className="w-12 flex items-center justify-center flex-shrink-0">
         <Icon size={18} />
       </div>
       <span className="font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200 hidden group-hover:block whitespace-nowrap overflow-hidden">
         {label}
       </span>
    </button>
  );
}