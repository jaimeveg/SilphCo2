'use client';

import Image from 'next/image';
import TypeBadge from '@/components/ui/TypeBadge';
import StatsDisplay from './StatsDisplay';
import { IPokemon } from '@/types/interfaces';

interface Props {
  pokemon: IPokemon;
}

export default function PokemonMasterPanel({ pokemon }: Props) {
  // NOTA: Hemos quitado 'h-full' para permitir que el scroll funcione naturalmente
  return (
    <div className="flex flex-col gap-8">
      
      {/* 1. IDENTITY HEADER */}
      <div className="flex flex-col items-center lg:items-start gap-4">
        <div className="w-full flex items-baseline justify-between border-b border-slate-800 pb-3">
          <h1 className="text-4xl xl:text-5xl font-display font-bold text-white uppercase tracking-tighter">
            {pokemon.name}
          </h1>
          <span className="font-mono text-2xl text-slate-600">
            #{pokemon.id.toString().padStart(4, '0')}
          </span>
        </div>
        
        <div className="flex gap-2 scale-110 origin-left">
          {pokemon.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
      </div>

      {/* 2. HOLO ASSET (Reducido de 320px a 280px) */}
      <div className="relative w-full aspect-square max-h-[280px] mx-auto group my-4">
         {/* Platform Effect */}
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-cyan-500/10 blur-xl rounded-full group-hover:bg-cyan-500/20 transition-all duration-500" />
         
         <Image
           src={pokemon.sprite}
           alt={pokemon.name}
           fill
           className="object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.15)] z-10 transition-transform duration-500 group-hover:scale-105"
           priority
           unoptimized
         />
      </div>

      {/* 3. PHYSICAL DATA */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-slate-900/40 py-3 rounded border border-slate-800/50">
          <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Height</span>
          <span className="font-mono text-lg text-cyan-400">{pokemon.height / 10}m</span>
        </div>
        <div className="bg-slate-900/40 py-3 rounded border border-slate-800/50">
          <span className="block text-[10px] text-slate-500 uppercase tracking-widest mb-1">Weight</span>
          <span className="font-mono text-lg text-cyan-400">{pokemon.weight / 10}kg</span>
        </div>
      </div>

      {/* 4. BASE STATS */}
      <div className="bg-slate-900/20 rounded-xl border border-slate-800/30 p-5">
        <StatsDisplay stats={pokemon.stats} />
      </div>
      
      {/* 5. ESPACIO EXTRA (DEBUG - Mantenemos por si acaso) */}
      <div className="opacity-0 h-4">.</div>
      
    </div>
  );
}