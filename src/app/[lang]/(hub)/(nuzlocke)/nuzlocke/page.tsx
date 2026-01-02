import { getDictionary } from "@/i18n/get-dictionary";
import NuzlockeDashboard from "@/components/nuzlocke/NuzlockeDashboard";
import { Skull } from 'lucide-react';
import Image from 'next/image';

interface NuzlockePageProps {
  params: {
    lang: string;
  };
}

export default async function NuzlockePage({ params }: NuzlockePageProps) {
  const { lang } = params;
  const dict = await getDictionary(lang as any);
  const t = dict.nuzlocke_hub;

  const titleParts = t.hero.title.split('//');
  const titleBrand = titleParts[0] || 'SILPH S.A.';
  const titleSection = titleParts[1] || 'NUZLOCKE';

  return (
    <div className="min-h-screen bg-[#050000] text-slate-200 overflow-hidden relative">
      
      {/* 1. BACKGROUND ASSET: GARCHOMP (AJUSTADO) */}
      {/* Posición: Anclado abajo y a la derecha con offsets negativos en % del viewport para empujarlo hacia fuera.
          Tamaño: Reducido en desktop para que no domine la pantalla.
          Rotación: Ligera inclinación para dinamismo.
      */}
      <div className="fixed -bottom-[20vh] -right-[10vw] w-[500px] h-[500px] md:w-[800px] md:h-[800px] z-0 pointer-events-none select-none transform rotate-[10deg]">
         <Image
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/445.png"
            alt="Garchomp Asset"
            fill
            // Estilo:
            // - opacity-[0.07]: Muy sutil.
            // - grayscale/saturate: Apaga los colores vibrantes.
            // - mix-blend-screen: Funde las luces sobre el fondo negro, haciendo transparente lo oscuro.
            className="object-contain opacity-[0.10] grayscale-[0.5] saturate-[0.3] mix-blend-screen"
            unoptimized={true}
            priority
         />
         {/* Gradiente de máscara mejorado: Funde desde la esquina inferior izquierda hacia arriba a la derecha */}
         <div className="absolute inset-0 bg-gradient-to-tr from-[#050000] via-[#050000]/50 to-transparent" />
      </div>

      {/* 2. BACKGROUND GRID (Tactical - Red Tint) */}
      <div 
        className="fixed inset-0 opacity-[0.04] pointer-events-none bg-[linear-gradient(rgba(150,0,0,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(150,0,0,0.15)_1px,transparent_1px)] bg-[size:50px_50px] z-0" 
      />

      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 md:py-20 lg:px-8 space-y-12">
        
        {/* HERO HEADER */}
        <header className="space-y-4 border-l-4 border-red-950 pl-6 py-2">
           <div className="flex items-center gap-2 text-red-900 font-mono text-[10px] tracking-[0.3em] uppercase animate-pulse">
             <Skull size={14} />
             <span>WAR_ROOM_ACCESS_GRANTED</span>
           </div>

           <div>
             <h1 className="text-4xl md:text-6xl font-display font-black text-white tracking-tighter uppercase leading-none">
               {titleBrand} 
               <span className="text-red-900/30 mx-2">//</span>
               <span className="text-transparent bg-clip-text bg-gradient-to-b from-red-800 to-red-950 drop-shadow-[0_0_20px_rgba(100,0,0,0.5)]">
                 {titleSection}
               </span>
             </h1>
             <p className="text-lg text-slate-500 font-mono mt-4 max-w-2xl border-t border-red-950/30 pt-4">
               {t.hero.subtitle}
             </p>
           </div>
        </header>

        {/* DASHBOARD */}
        <section>
          <NuzlockeDashboard data={t} />
        </section>

      </main>
    </div>
  );
}