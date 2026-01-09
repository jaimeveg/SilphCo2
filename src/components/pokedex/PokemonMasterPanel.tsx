'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Ruler, Weight, Dna, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TypeBadge from '@/components/ui/TypeBadge';
import AbilityChip from './AbilityChip';
import DexSelector from '@/components/ui/DexSelector';
import FormSelector from '@/components/ui/FormSelector';
import { IPokemon } from '@/types/interfaces';
import { usePokemonNavigation, PokedexContext } from '@/hooks/usePokemonNavigation';
import { cn } from '@/lib/utils';
import { POKEDEX_DICTIONARY, Lang } from '@/lib/pokedexDictionary';

interface Props {
  pokemon: IPokemon;
  lang: Lang;
}

export default function PokemonMasterPanel({ pokemon, lang }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dict = POKEDEX_DICTIONARY[lang];

  // --- TOGGLE STATE ---
  // Simplificado: Solo gestionamos Shiny. El género y formas se gestionan vía FormSelector.
  const [isShiny, setIsShiny] = useState(false);

  // Reiniciar estado shiny al cambiar de pokémon
  useEffect(() => {
    setIsShiny(false);
  }, [pokemon.id]);

  // Selección de Imagen Activa
  // Al navegar a una variedad específica (ej. Indeedee Female), assets.main ya trae la imagen correcta de esa forma.
  const activeSprite = isShiny ? pokemon.assets.shiny : pokemon.assets.main;

  // --- NAVIGATION & LOGIC ---
  const anchorId = pokemon.speciesId || pokemon.id;
  const { context, setContext, goToNext, goToPrev } = usePokemonNavigation(anchorId);
  const displayId = pokemon.dexIds?.[context] || anchorId;

  const availableContexts = useMemo(() => {
    const allContexts: PokedexContext[] = ['NATIONAL', 'KANTO', 'JOHTO', 'HOENN', 'SINNOH', 'UNOVA', 'KALOS', 'ALOLA', 'GALAR', 'HISUI', 'PALDEA'];
    return allContexts.filter(ctx => !!pokemon.dexIds?.[ctx]);
  }, [pokemon.dexIds]);

  const hasVarieties = pokemon.varieties && pokemon.varieties.length > 1;
  const speciesName = pokemon.speciesName || pokemon.name.split('-')[0];
  
  const handleVarietyChange = (newVariantId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newVariantId === pokemon.speciesId.toString()) {
      params.delete('variant');
    } else {
      params.set('variant', newVariantId);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-full relative p-2 select-none">
      
      {/* 1. HEADER FIXED */}
      <div className="w-full flex justify-between items-start h-[5rem] shrink-0 relative z-40">
        <div className="flex flex-col items-start gap-1">
             <h1 className="text-3xl xl:text-4xl font-display font-black text-white uppercase tracking-tighter leading-none drop-shadow-lg truncate max-w-[240px]">
                {speciesName}
            </h1>
            
            {hasVarieties && (
              <div className="flex items-center gap-2 mb-0.5 pl-0.5 animate-in fade-in slide-in-from-left-2">
                 <div className="flex items-center gap-1.5 opacity-90">
                    <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_cyan]" />
                    <span className="text-[9px] font-mono font-bold text-cyan-400 tracking-widest uppercase drop-shadow-[0_0_3px_rgba(34,211,238,0.5)]">
                      {dict.labels.morph}
                    </span>
                 </div>
                 <FormSelector 
                    currentId={pokemon.id} 
                    varieties={pokemon.varieties} 
                    onChange={handleVarietyChange} 
                 />
              </div>
            )}

            <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-mono font-bold text-cyan-500 tracking-widest bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-500/20">
                    #{displayId.toString().padStart(4, '0')}
                </span>
                {context !== 'NATIONAL' && <span className="text-[9px] font-mono text-slate-600 uppercase">{dict.labels.local_id}</span>}
            </div>
        </div>

        <DexSelector current={context} options={availableContexts} onChange={setContext} lang={lang} />
      </div>

      {/* 2. CORE CENTERED */}
      <div className="flex-1 flex items-center justify-center gap-2 xl:gap-8 relative min-h-0 z-10">
        <button onClick={goToPrev} className="group p-2 focus:outline-none" aria-label="Previous">
          <ChevronLeft size={40} strokeWidth={1} className="text-slate-700 transition-all duration-300 group-hover:text-cyan-400 group-hover:scale-110 group-active:scale-95" />
        </button>

        <div className="relative flex items-center gap-4">
            <div className="flex flex-col gap-3 py-2 w-[40px] items-center">
                <VerticalDataPoint label={dict.labels.height} value={`${pokemon.height / 10}m`} icon={Ruler} />
                <VerticalDataPoint label={dict.labels.weight} value={`${pokemon.weight / 10}kg`} icon={Weight} />
                <VerticalDataPoint label={dict.labels.gen} value={pokemon.generation} icon={Dna} highlight />
            </div>

            <div className="relative w-[220px] aspect-square flex items-center justify-center group/art">
                <div className="absolute inset-0 rounded-2xl border border-cyan-500/30 shadow-[0_0_20px_-5px_rgba(34,211,238,0.15)] opacity-80 transition-all duration-500" />
                <div className="absolute inset-2 rounded-xl bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                <div className="relative w-[85%] h-[85%]">
                    {/* AnimatePresence para transición suave entre normal y shiny */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSprite}
                            initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, scale: 1.05, filter: 'blur(2px)' }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full h-full animate-holo-glitch"
                        >
                            <Image
                                src={activeSprite}
                                alt={pokemon.name}
                                fill
                                className="object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-10 group-hover/art:scale-105 transition-transform duration-500"
                                priority
                                unoptimized
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* --- TOGGLE SHINY ÚNICO --- */}
                <div className="absolute bottom-2 right-2 flex flex-col gap-2 z-30">
                    <button
                        onClick={() => setIsShiny(!isShiny)}
                        className={cn(
                            "p-1.5 rounded-full border transition-all duration-300 shadow-lg backdrop-blur-md",
                            isShiny 
                                ? "bg-yellow-400/20 border-yellow-400 text-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.3)]" 
                                : "bg-slate-900/60 border-slate-700 text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                        )}
                        title="Shiny Form"
                    >
                        <Sparkles size={14} className={cn(isShiny && "fill-current")} />
                    </button>
                </div>

            </div>
        </div>

        <button onClick={goToNext} className="group p-2 focus:outline-none" aria-label="Next">
          <ChevronRight size={40} strokeWidth={1} className="text-slate-700 transition-all duration-300 group-hover:text-cyan-400 group-hover:scale-110 group-active:scale-95" />
        </button>
      </div>

      {/* 3. FOOTER FIXED */}
      <div className="h-[11rem] shrink-0 flex flex-col justify-end items-center gap-4 pb-2 z-30">
        <div className="flex justify-center gap-3">
          {pokemon.types.map((t) => (
            <TypeBadge 
              key={t} 
              type={t} 
              showLabel={false} 
              className="h-8 w-12 justify-center shadow-lg" 
              lang={lang} 
            />
          ))}
        </div>

          {/* Habilidades: min-h para evitar recortes y overflow visible */}
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center min-w-[220px] min-h-[5.5rem] h-auto">
              <h3 className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2">{dict.labels.abilities}</h3>
              <div className="flex flex-wrap justify-center gap-2">
                  {pokemon.abilities.map((ab, i) => (
                      <AbilityChip key={i} ability={ab} />
                  ))}
              </div>
          </div>
      </div>

    </div>
  );
}

function VerticalDataPoint({ label, value, icon: Icon, highlight }: any) {
    return (
        <div className="group flex flex-col items-center gap-0.5">
            <div className={cn("p-1.5 rounded-full transition-colors mb-0.5", highlight ? "bg-cyan-500/10 text-cyan-500" : "bg-slate-800/50 text-slate-500 group-hover:text-slate-300")}>
                <Icon size={12} />
            </div>
            <span className={cn("text-[10px] font-mono font-bold writing-mode-vertical", highlight ? "text-cyan-400" : "text-slate-300")}>{value}</span>
            <span className="text-[8px] font-mono text-slate-600 uppercase tracking-wider scale-75 origin-top">{label}</span>
        </div>
    )
}