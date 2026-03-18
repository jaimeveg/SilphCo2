'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCoreMenu } from '@/data/navigation';
import { Lock, ChevronRight, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlobalSearchBar from '@/components/layout/GlobalSearchBar';

interface FullSidebarProps {
  lang: string;
  dict: any;
}

export default function FullSidebar({ lang, dict }: FullSidebarProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pathname = usePathname();
  const router = useRouter();

  const isExpanded = isHovering || isSearchFocused;

  // Collapse everything (mouse out + search blur)
  const collapseAll = () => {
    setIsHovering(false);
    setIsSearchFocused(false);
  };

  // Ctrl+K / Cmd+K global shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsHovering(true);
        setIsSearchFocused(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. DETECCIÓN DE MODO
  const isNuzlockeMode = pathname.includes('/nuzlocke');

  // 2. TEMA DINÁMICO
  const theme = {
    // Fondo: Negro puro vs Slate
    bg: isNuzlockeMode ? 'bg-[#020000]' : 'bg-slate-950',
    
    // BORDE DERECHO (Reemplaza a la sombra para evitar el azul)
    // Nuzlocke: Borde rojo oscuro brillante. Standard: Borde slate sutil.
    borderRight: isNuzlockeMode 
      ? 'border-r border-red-950 shadow-[5px_0_30px_-5px_rgba(50,0,0,0.8)]' // Sombra roja personalizada manual
      : 'border-r border-slate-800 shadow-2xl', // Sombra standard

    // Textos
    text: isNuzlockeMode ? 'text-red-900' : 'text-cyan-500',
    textHover: isNuzlockeMode ? 'hover:text-red-700' : 'hover:text-cyan-400',
    
    // Indicadores
    indicator: isNuzlockeMode ? 'text-red-900/50' : 'text-cyan-500/70',
    barBg: isNuzlockeMode ? 'bg-red-900' : 'bg-cyan-500',
    barGlow: isNuzlockeMode 
      ? 'shadow-[0_0_10px_rgba(80,0,0,0.5)]' 
      : 'shadow-[0_0_10px_rgba(56,189,248,0.5)]',
      
    // Bordes Interiores
    itemBorderHover: isNuzlockeMode ? 'hover:border-red-900/40' : 'hover:border-cyan-500/30',
  };

  const t = dict.navigation;
  const CORE_MENU = getCoreMenu(lang, dict);
  const displayedCategory = isExpanded ? openCategory : null;

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
      onMouseLeave={() => { if (!isSearchFocused) setIsHovering(false); }}
      className={cn(
        "fixed top-0 left-0 h-full z-[9999] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col",
        isExpanded ? 'w-80' : 'w-20',
        theme.bg, 
        theme.borderRight
      )}
    >
      {/* HEADER LOGO */}
      <Link 
        href={`/${lang}`}
        className={cn(
          "h-20 flex-shrink-0 flex items-center justify-start px-0 border-b z-20 relative overflow-hidden cursor-pointer",
          theme.bg, 
          isNuzlockeMode ? 'border-red-950/30' : 'border-slate-800'
        )}
      >
        <div className={cn(
          "absolute left-0 w-20 h-full flex items-center justify-center transition-opacity duration-300 pointer-events-none",
          isExpanded ? 'opacity-0' : 'opacity-100'
        )}>
          <span className={cn("font-display font-bold text-xl", theme.text)}>S.</span>
        </div>
        <div className={cn(
          "w-full h-full flex items-center px-8 transition-opacity duration-300",
          isExpanded ? 'opacity-100' : 'opacity-0'
        )}>
          <span className="font-display font-bold text-white text-xl whitespace-nowrap">
            SILPH<span className={theme.text}>.CO</span>
          </span>
        </div>
      </Link>

      {/* GLOBAL SEARCH */}
      <GlobalSearchBar
        lang={lang}
        isExpanded={isExpanded}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => setIsSearchFocused(false)}
        onClickOutside={collapseAll}
        inputRef={searchInputRef}
      />

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
                className={cn(
                  "w-full h-14 flex items-center transition-all duration-300 relative group/cat",
                  isActive ? theme.text : "text-slate-500 hover:text-white hover:bg-slate-900/50"
                )}
              >
                <div className="w-20 min-w-[5rem] flex items-center justify-center relative z-10 flex-shrink-0">
                  <Icon size={24} strokeWidth={1.5} className={`transition-transform duration-300 ${isActive && isExpanded ? 'scale-110' : ''}`} />
                </div>
                <div className={cn(
                  "flex-1 flex items-center justify-between pr-6 transition-opacity duration-300 overflow-hidden whitespace-nowrap",
                  isExpanded ? 'opacity-100' : 'opacity-0'
                )}>
                  <span className="font-display font-bold text-sm tracking-widest uppercase">{category.label}</span>
                  <ChevronRight size={16} className={cn("transition-transform duration-300 delay-200", isOpen ? `rotate-90 ${theme.text}` : "text-slate-700")} />
                </div>
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1 transition-opacity duration-300 delay-200",
                  theme.barBg, theme.barGlow,
                  isActive ? 'opacity-100' : 'opacity-0'
                )} />
              </button>

              <div className={`overflow-hidden transition-all duration-500 delay-200 ease-in-out bg-slate-900/20 ${isOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'}`}>
                {category.type === 'module_root' && (
                  <div className="flex flex-col pb-4 pt-1 w-full">
                    {category.children.map((module: any) => (
                      <div key={module.id} className="mb-2 w-full">
                        <div className={cn(
                          "px-6 py-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest border-b border-white/5 mx-4 mb-2",
                          module.locked ? 'text-slate-700' : theme.indicator
                        )}>
                          <span className="truncate">{module.label}</span>
                          {module.locked && <Lock size={10} className="flex-shrink-0 ml-2" />}
                        </div>
                        {!module.locked && (
                          <div className="flex flex-col space-y-0.5">
                            {module.sections?.map((section: any) => (
                              <button
                                key={section.id}
                                onClick={() => handleNavigation(module.id, section.id)}
                                className={cn(
                                  "h-9 w-full flex items-center text-left pl-[4.5rem] pr-4 text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors border-l-2 border-transparent",
                                  theme.itemBorderHover
                                )}
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
                        className={cn(
                          "h-10 w-full flex items-center pl-[4.5rem] pr-4 text-xs font-mono text-slate-400 hover:bg-slate-800/40 transition-colors",
                          theme.textHover
                        )}
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

      <div className={cn(
        "p-4 border-t z-20 flex-shrink-0", 
        theme.bg, 
        isNuzlockeMode ? 'border-red-950/30' : 'border-slate-800'
      )}>
        <SidebarAction 
          icon={Globe} 
          label={languageSwitchLabel} 
          onClick={handleLanguageSwitch}
          isExpanded={isExpanded}
        />
        <div className="h-px bg-slate-800 my-2 opacity-50" />
      </div>
    </aside>
  );
}

function SidebarAction({ icon: Icon, label, onClick, isExpanded }: { icon: any; label: string; onClick?: () => void; isExpanded: boolean }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center h-10 text-slate-600 hover:text-white transition-colors rounded-md hover:bg-slate-900/50 overflow-hidden"
    >
       <div className="w-12 flex items-center justify-center flex-shrink-0">
         <Icon size={18} />
       </div>
       <span className={cn(
         "font-mono text-xs transition-opacity duration-300 whitespace-nowrap",
         isExpanded ? "opacity-100" : "opacity-0"
       )}>
         {label}
       </span>
    </button>
  );
}