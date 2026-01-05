'use client';

import { usePokemon } from '@/services/pokeapi';
import MasterDetailLayout from './layout/MasterDetailLayout';
import PokemonMasterPanel from './PokemonMasterPanel';
import { Loader2, AlertTriangle, Construction } from 'lucide-react';

interface Props {
  pokemonId: string;
}

export default function PokemonDetailView({ pokemonId }: Props) {
  // 1. Data Fetching
  const { data: pokemon, isLoading, isError } = usePokemon(pokemonId);

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  // 3. Error State
  if (isError || !pokemon) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center text-red-400 gap-2">
        <AlertTriangle className="w-8 h-8" />
        <span className="font-mono text-sm">DATA_CORRUPTION // POKEMON_NOT_FOUND</span>
      </div>
    );
  }

  // 4. Render Layout
  return (
    <MasterDetailLayout 
      master={
        <PokemonMasterPanel pokemon={pokemon} />
      }
      detail={
        // Placeholder temporal para la derecha (DetailDeck)
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 opacity-50 space-y-4">
          <Construction size={48} strokeWidth={1} />
          <p className="font-mono text-sm tracking-widest uppercase">
            Awaiting Tactical Modules...
          </p>
          <div className="flex gap-2 text-xs font-mono border-t border-slate-800 pt-4 mt-2">
            <span>[SMOGON_DB]</span>
            <span>[NUZLOCKE_OPS]</span>
            <span>[MOVE_ANALYTICS]</span>
          </div>
        </div>
      }
    />
  );
}