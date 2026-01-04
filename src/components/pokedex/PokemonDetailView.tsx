'use client';

import { usePokemon } from '@/services/pokeapi';
import Image from 'next/image'; // <--- NUEVO IMPORT
import TypeBadge from '@/components/ui/TypeBadge';
import StatsDisplay from './StatsDisplay';
import { Loader2, AlertTriangle } from 'lucide-react';

interface Props {
  pokemonId: string;
}

export default function PokemonDetailView({ pokemonId }: Props) {
  const { data: pokemon, isLoading, isError } = usePokemon(pokemonId);

  if (isLoading) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (isError || !pokemon) {
    return (
      <div className="w-full h-[50vh] flex flex-col items-center justify-center text-red-400 gap-2">
        <AlertTriangle className="w-8 h-8" />
        <span className="font-mono text-sm">DATA_CORRUPTION // POKEMON_NOT_FOUND</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 animate-in fade-in duration-500">
      
      {/* COLUMNA IZQUIERDA: Identidad & Visual */}
      <div className="flex flex-col gap-6">
        
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between border-b border-slate-800 pb-2">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-wide">
              {pokemon.name}
            </h1>
            <span className="font-mono text-xl text-slate-500">
              #{pokemon.id.toString().padStart(4, '0')}
            </span>
          </div>
          
          <div className="flex gap-2">
            {pokemon.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
        </div>

        {/* Holo Asset Container (REEMPLAZADO) */}
        {/* Usamos directamente la URL del servicio para evitar el error de Ditto */}
        <div className="aspect-square w-full max-w-sm mx-auto relative group">
           
           {/* Efecto de plataforma holográfica (Opcional/Decorativo) */}
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-4 bg-cyan-500/20 blur-xl rounded-full" />
           
           <Image
             src={pokemon.sprite}
             alt={pokemon.name}
             fill
             className="object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.2)] z-10"
             priority
             unoptimized // Vital para que los GIFs de Showdown se muevan
           />
           
           {/* Scanline Effect Overlay */}
           <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20 z-20" />
        </div>
      </div>

      {/* COLUMNA DERECHA: Datos Biológicos */}
      <div className="flex flex-col justify-center gap-6">
        
        {/* Datos Físicos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/50 text-center">
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Height</span>
            <span className="font-mono text-lg text-cyan-400">{pokemon.height / 10}m</span>
          </div>
          <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/50 text-center">
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Weight</span>
            <span className="font-mono text-lg text-cyan-400">{pokemon.weight / 10}kg</span>
          </div>
        </div>

        {/* Stats */}
        <StatsDisplay stats={pokemon.stats} />
        
      </div>
    </div>
  );
}