import { getDictionary } from "@/i18n/get-dictionary";
import { Locale } from "@/i18n/settings";

interface PageProps {
  params: {
    lang: string;
  };
}

export default async function Home({ params }: PageProps) {
  const lang = params.lang as Locale;
  const dict = await getDictionary(lang);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-8 font-sans">
      
      {/* HEADER VISUAL */}
      <div className="relative">
        <div className="absolute -inset-4 bg-cyan-500/20 blur-xl rounded-full opacity-50 animate-pulse" />
        {/* Usamos font-bold que aplicará Inter Bold o Space Grotesk según tu config de Tailwind */}
        <h1 className="relative text-5xl md:text-7xl font-bold text-white tracking-tight">
          SILPH <span className="text-cyan-400">CO.</span>
        </h1>
      </div>

      {/* COMPROBACIÓN DE DICCIONARIO */}
      <div className="space-y-2">
        <h2 className="text-2xl font-light text-slate-300">
          {dict.common.welcome}
        </h2>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-xs font-mono text-slate-400">
            LOCALE DETECTADO: <span className="text-cyan-400 font-bold uppercase">{lang}</span>
          </p>
        </div>
      </div>

      {/* ÁREA DE STATUS (Fase B) */}
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 rounded-lg p-6 backdrop-blur-sm text-left">
        <h3 className="text-sm font-mono text-slate-500 uppercase mb-4 border-b border-slate-800 pb-2">
          Estado del Sistema
        </h3>
        <ul className="space-y-3 text-sm text-slate-300">
          <li className="flex items-center gap-3">
            <span className="text-green-400">✓</span> Arquitectura i18n
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-400">✓</span> Middleware Routing
          </li>
          <li className="flex items-center gap-3">
            <span className="text-green-400">✓</span> Diccionarios JSON
          </li>
          <li className="flex items-center gap-3 text-slate-500">
            <span className="w-4 h-4 border-2 border-slate-600 border-t-cyan-500 rounded-full animate-spin" />
            Esperando migración de Módulos...
          </li>
        </ul>
      </div>

    </div>
  );
}