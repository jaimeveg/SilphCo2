'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Package, TrendingUp, Loader2 } from 'lucide-react';
import { IPokemon, IEvYield, IPokemonDrop } from '@/types/interfaces';
import { Lang } from '@/lib/pokedexDictionary';
import itemDexData from '@/data/item_dex.json';
import { cn } from '@/lib/utils';

interface Props {
  pokemon: IPokemon;
  lang: Lang;
}

const itemDex = itemDexData as Record<string, any>;

// Normalizador estricto para mapear nombres de objetos a URLs seguras
const normalizeItemName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[']/g, '') // Elimina apóstrofes (ej. Leader's Crest -> leaders crest)
    .replace(/[\s_]/g, '-') // Cambia espacios/guiones bajos por guiones medios
    .replace(/--+/g, '-'); // Evita dobles guiones
};

// Mapeo corto para los stats
const statMap: Record<string, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SPA',
  'special-defense': 'SPD',
  speed: 'SPE',
};

export default function YieldData({ pokemon, lang }: Props) {
  const [drops, setDrops] = useState<IPokemonDrop[]>(pokemon.drops || []);
  const [evs, setEvs] = useState<IEvYield[]>(pokemon.evYields || []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Si la data ya viene por el ETL estático (O(1)), no hacemos fetch.
    if (pokemon.drops?.length || pokemon.evYields?.length) {
      setIsLoading(false);
      return;
    }

    const fetchYieldData = async () => {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`);
        if (!res.ok) throw new Error('PokeAPI request failed');
        const data = await res.json();

        // Extraer EVs (donde effort sea mayor a 0)
        const fetchedEvs: IEvYield[] = data.stats
          .filter((s: any) => s.effort > 0)
          .map((s: any) => ({
            stat: statMap[s.stat.name] || s.stat.name.toUpperCase(),
            effort: s.effort,
          }));

        // Extraer Objetos (Held Items) y su % máximo de drop
        const fetchedDrops: IPokemonDrop[] = data.held_items.map((hi: any) => {
          // Buscamos la rareza más alta entre las versiones disponibles
          const maxChance = Math.max(...hi.version_details.map((vd: any) => vd.rarity));
          return {
            item: hi.item.name,
            chance: maxChance,
          };
        });

        setEvs(fetchedEvs);
        setDrops(fetchedDrops);
      } catch (error) {
        console.error('[SilphCo2 ETL] Fetching live yield data failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchYieldData();
  }, [pokemon.id, pokemon.drops, pokemon.evYields]);

  // Componente interno para manejar el estado de error de la imagen independientemente
  const ItemSprite = ({ itemName }: { itemName: string }) => {
    const [imgError, setImgError] = useState(false);
    const itemKey = normalizeItemName(itemName);
    
    // Prioridad: 1. Nuestro JSON estático | 2. Asset local | 3. Fallback visual
    const localSprite = itemDex[itemKey]?.sprites?.low_res;
    const itemUrl = localSprite || `/images/items/sprites/${itemKey}.png`;

    if (imgError) {
      return (
        <div className="w-5 h-5 flex items-center justify-center bg-slate-800 rounded-full border border-slate-700 shadow-inner flex-shrink-0">
          <Package size={10} className="text-slate-500" />
        </div>
      );
    }

    return (
      <div className="w-5 h-5 relative flex-shrink-0">
        <Image 
          src={itemUrl} 
          alt={itemName} 
          fill 
          className="object-contain drop-shadow-md group-hover:scale-110 transition-transform rendering-pixelated" 
          unoptimized
          onError={() => setImgError(true)}
        />
      </div>
    );
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
      <div className="flex flex-col gap-3 p-3 bg-slate-900/50 border border-slate-800 rounded-xl relative overflow-hidden mx-1 shadow-lg">
        {/* Fondo Tech/Holográfico Sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(34,211,238,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] pointer-events-none" />

        {isLoading && (
          <div className="absolute inset-0 z-20 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
             <Loader2 size={16} className="text-cyan-500 animate-spin" />
          </div>
        )}

        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 transition-opacity duration-300", isLoading ? "opacity-30" : "opacity-100")}>
          {/* BLOQUE: EV YIELDS */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 border-b border-slate-700/50 pb-1">
              <TrendingUp size={12} className="text-amber-500" />
              <h4 className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-widest">
                {lang === 'es' ? 'EVs al Vencer' : 'EV Yield'}
              </h4>
            </div>
            {evs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {evs.map((ev, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-slate-950 border border-amber-900/30 rounded shadow-sm hover:border-amber-500/50 transition-colors">
                    <span className="text-[10px] font-mono font-bold text-amber-400">+{ev.effort}</span>
                    <span className="text-[9px] font-bold text-slate-300 uppercase">{ev.stat}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-slate-600 font-mono italic">
                {lang === 'es' ? 'Datos no disponibles' : 'Data unavailable'}
              </span>
            )}
          </div>

          {/* BLOQUE: DROPS */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 border-b border-slate-700/50 pb-1">
              <Package size={12} className="text-emerald-500" />
              <h4 className="text-[10px] font-display font-bold text-slate-400 uppercase tracking-widest">
                {lang === 'es' ? 'Objetos (Drops)' : 'Item Drops'}
              </h4>
            </div>
            {drops.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {drops.map((drop, idx) => {
                  const itemKey = normalizeItemName(drop.item);
                  return (
                  <Link href={`/${lang}/items/${itemKey}`} key={idx} className="flex items-center gap-2 px-2 py-1 bg-slate-950 border border-emerald-900/30 rounded shadow-sm group hover:border-emerald-500/50 transition-colors">
                    <ItemSprite itemName={drop.item} />
                    <div className="flex flex-col justify-center">
                      <span className="text-[9px] font-bold text-slate-200 uppercase leading-none mb-0.5 group-hover:text-cyan-400 transition-colors">
                        {drop.item.replace(/-/g, ' ')}
                      </span>
                      <span className="text-[8px] font-mono text-emerald-400 leading-none">
                        {drop.chance}% Drop
                      </span>
                    </div>
                  </Link>
                  );
                })}
              </div>
            ) : (
              <span className="text-[10px] text-slate-600 font-mono italic">
                {lang === 'es' ? 'No hay drops registrados' : 'No registered drops'}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}