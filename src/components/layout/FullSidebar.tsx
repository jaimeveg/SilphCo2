'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCoreMenu } from '@/data/navigation';
import { Settings, HelpCircle, LogOut, Lock, ChevronRight, Globe } from 'lucide-react';

interface FullSidebarProps {
  lang: string;
  dict: any;
}

export default function FullSidebar({ lang, dict }: FullSidebarProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>('academy');
  
  const pathname = usePathname();
  const router = useRouter();

  const CORE_MENU = getCoreMenu(lang, dict);
  const displayedCategory = isHovering ? openCategory : null;

  // LÓGICA DE ETIQUETA DE IDIOMA
  // Si estoy en ES, ofrezco cambiar a EN (en inglés).
  // Si estoy en EN, ofrezco cambiar a ES (en español).
  const languageSwitchLabel = lang === 'es' ? 'Switch to English' : 'Cambiar a español';

  const handleLanguageSwitch = () => {
    const newLang = lang === 'es' ? 'en' : 'es';
    const newPath = pathname.replace(`/${lang}`, `/${newLang}`);
    router.push(newPath);
  };

  const handleNavigation = (moduleId: string, sectionId: string) => {
    if (pathname.includes('/academy/module-1') && moduleId === 'mod_1') {
      const element = document.getElementById(sectionId);
      if (element) {
        const globalLenis = (window as any).lenis;
        if (globalLenis?.lenis) {
          globalLenis.lenis.scrollTo(element, { offset: -140, duration: 1.5, lock: true });
        } else {
          const offset = 140;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.scrollY - offset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }
    } else {
      if (moduleId === 'mod_1') {
        router.push(`/${lang}/academy/module-1#${sectionId}`);
      }
    }
  };

  return (
    <aside 
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="fixed top-0 left-0 h-full z-[9999] bg-slate-950 border-r border-slate-800 transition-all duration-500 delay-200 ease-[cubic-bezier(0.25,1,0.5,1)] w-20 hover:w-80 group shadow-2xl flex flex-col"
    >
      {/* HEADER LOGO */}
      <div className="h-20 flex-shrink-0 flex items-center justify-start px-0 border-b border-slate-800 bg-slate-950 z-20 relative overflow-hidden">
        <div className="absolute left-0 w-20 h-full flex items-center justify-center transition-opacity duration-300 delay-200 group-hover:opacity-0 pointer-events-none">
          <span className="font-display font-bold text-white text-xl text-cyan-500">S.</span>
        </div>
        <div className="w-full h-full flex items-center px-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">
           <span className="font-display font-bold text-white text-xl whitespace-nowrap">
            SILPH<span className="text-cyan-500">.CO</span>
          </span>
        </div>
      </div>

      {/* CORE NAVIGATION */}
      <div data-lenis-prevent="true" className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar py-8 space-y-2 overscroll-contain">
        {CORE_MENU.map((category) => {
          const Icon = category.icon;
          const isOpen = displayedCategory === category.id;
          const isActive = openCategory === category.id;

          return (
            <div key={category.id} className="relative">
              <button 
                onClick={() => setOpenCategory(isActive ? null : category.id)}
                className={`w-full h-14 flex items-center transition-all duration-300 delay-200 relative group/cat ${
                  isActive ? 'text-cyan-400' : 'text-slate-500 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <div className="w-20 min-w-[5rem] flex items-center justify-center relative z-10 flex-shrink-0">
                  <Icon size={24} strokeWidth={1.5} className={`transition-transform duration-500 delay-200 ${isActive && isHovering ? 'scale-110' : ''}`} />
                </div>
                <div className="flex-1 flex items-center justify-between pr-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200 overflow-hidden whitespace-nowrap">
                  <span className="font-display font-bold text-sm tracking-widest uppercase">{category.label}</span>
                  <ChevronRight size={16} className={`transition-transform duration-300 delay-200 ${isOpen ? 'rotate-90 text-cyan-400' : 'text-slate-700'}`} />
                </div>
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-opacity duration-300 delay-200 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
              </button>

              <div className={`overflow-hidden transition-all duration-500 delay-200 ease-in-out bg-slate-900/20 ${isOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'}`}>
                {category.type === 'module_root' && (
                  <div className="flex flex-col pb-4 pt-1 w-full">
                    {category.children.map((module: any) => (
                      <div key={module.id} className="mb-2 w-full">
                        <div className={`px-6 py-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest border-b border-white/5 mx-4 mb-2 ${module.locked ? 'text-slate-700' : 'text-cyan-500/70'}`}>
                          <span className="truncate">{module.label}</span>
                          {module.locked && <Lock size={10} className="flex-shrink-0 ml-2" />}
                        </div>
                        {!module.locked && (
                          <div className="flex flex-col space-y-0.5">
                            {module.sections?.map((section: any) => (
                              <button
                                key={section.id}
                                onClick={() => handleNavigation(module.id, section.id)}
                                className="h-9 w-full flex items-center text-left pl-[4.5rem] pr-4 text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors border-l-2 border-transparent hover:border-cyan-500/30"
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
                {category.type === 'link_root' && (
                  <div className="flex flex-col pb-4 pt-2 w-full">
                    {category.children.map((link: any) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="h-10 w-full flex items-center pl-[4.5rem] pr-4 text-xs font-mono text-slate-400 hover:text-cyan-400 hover:bg-slate-800/40 transition-colors"
                      >
                        {link.icon && <link.icon size={14} className="mr-2 flex-shrink-0" />}
                        <span className="uppercase tracking-wide truncate">{link.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 z-20 flex-shrink-0">
        
        
        {/* SELECTOR DE IDIOMA ACTUALIZADO */}
        <SidebarAction 
          icon={Globe} 
          label={languageSwitchLabel} 
          onClick={handleLanguageSwitch} 
        />

      </div>
    </aside>
  );
}

function SidebarAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center h-10 text-slate-600 hover:text-white transition-colors group/btn rounded-md hover:bg-slate-900/50"
    >
       <div className="w-12 flex items-center justify-center flex-shrink-0">
         <Icon size={18} />
       </div>
       <span className="font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200 hidden group-hover:block whitespace-nowrap overflow-hidden">
         {label}
       </span>
    </button>
  );
}