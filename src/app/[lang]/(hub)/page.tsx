import Link from 'next/link';
import { ArrowRight, BookOpen, Wrench } from 'lucide-react';
import { getDictionary } from "@/i18n/get-dictionary";

interface HubPageProps {
  params: {
    lang: string;
  };
}

export default async function HubPage({ params }: HubPageProps) {
  const { lang } = params;
  const dict = await getDictionary(lang as any);
  const t = dict.hub;

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950 text-slate-200">
      
      {/* HEADER */}
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white">
          SILPH <span className="text-cyan-500">HUB</span>
        </h1>
        <div className="inline-block px-3 py-1 bg-slate-900 border border-slate-800 rounded-full">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            {t.subtitle} • Lang: {lang.toUpperCase()}
          </span>
        </div>
      </div>

      {/* NAVIGATION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        
        {/* CARD: MÓDULO 1 */}
        <Link 
          href={`/${lang}/academy/module-1`}
          className="group relative p-8 bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 rounded-2xl transition-all duration-300 hover:bg-slate-900 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-cyan-500">
            <BookOpen size={120} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-between space-y-8">
            <div>
              <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4 text-cyan-400">
                <BookOpen size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                {t.cards.academy.title}
              </h2>
              <p className="mt-2 text-slate-400 group-hover:text-slate-300">
                {t.cards.academy.description}
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-sm font-bold text-cyan-500 uppercase tracking-widest">
              {t.cards.academy.action} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* CARD: TOOLS */}
        <Link 
          href={`/${lang}/tools/type-calculator`}
          className="group relative p-8 bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 rounded-2xl transition-all duration-300 hover:bg-slate-900 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-purple-500">
            <Wrench size={120} />
          </div>
          
          <div className="relative z-10 flex flex-col h-full justify-between space-y-8">
            <div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 text-purple-400">
                <Wrench size={24} />
              </div>
              <h2 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
                {t.cards.tools.title}
              </h2>
              <p className="mt-2 text-slate-400">
                {t.cards.tools.description}
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-sm font-bold text-purple-500 uppercase tracking-widest">
              {t.cards.tools.action} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

      </div>
    </div>
  );
}