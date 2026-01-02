import { getDictionary } from "@/i18n/get-dictionary";
import ToolsDashboard from "@/components/tools/ToolsDashboard";
import { Terminal } from 'lucide-react';

interface ToolsPageProps {
  params: {
    lang: string;
  };
}

export default async function ToolsPage({ params }: ToolsPageProps) {
  const { lang } = params;
  const dict = await getDictionary(lang as any);
  const t = dict.tools_dashboard;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <main className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 lg:px-8 space-y-12">
        
        {/* HEADER SECTION */}
        <header className="space-y-6 relative">
           {/* Decoración de fondo */}
           <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
           
           <div className="flex items-center gap-2 text-brand-cyan/70 font-mono text-[10px] tracking-[0.2em] uppercase">
             <Terminal size={12} />
             <span>OPS_DECK_V1.0</span>
           </div>

           <div className="space-y-2">
             <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white tracking-tighter">
               {t.title.split('//')[0]}
               <span className="text-brand-cyan opacity-80"> // {t.title.split('//')[1]}</span>
             </h1>
             <p className="text-lg text-slate-400 font-light max-w-xl leading-relaxed border-l-2 border-brand-cyan/30 pl-4">
               {t.subtitle}
             </p>
           </div>
        </header>

        {/* DASHBOARD AREA */}
        <section className="relative z-10">
          <ToolsDashboard data={t} lang={lang} />
        </section>

      </main>
    </div>
  );
}