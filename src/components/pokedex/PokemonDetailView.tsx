'use client';

import { usePokemon } from '@/services/pokeapi';
import MasterDetailLayout from './layout/MasterDetailLayout';
import PokemonMasterPanel from './PokemonMasterPanel';
import DetailDeck from './DetailDeck'; // <--- NUEVO IMPORT
import { Loader2, AlertTriangle } from 'lucide-react';

interface Props {
  pokemonId: string;
}

export default function PokemonDetailView({ pokemonId }: Props) {
  const { data: pokemon, isLoading, isError } = usePokemon(pokemonId);

  // ... (Lógica de Loading/Error se mantiene igual) ...
  if (isLoading) return <div className="w-full h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-cyan-500 animate-spin" /></div>;
  if (isError || !pokemon) return <div className="text-red-500">Error</div>;

  return (
    <MasterDetailLayout 
      master={
        <PokemonMasterPanel pokemon={pokemon} />
      }
      detail={
        // Inyectamos el componente interactivo con los datos
        <DetailDeck pokemon={pokemon} />
      }
    />
  );
}