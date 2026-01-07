'use client';

import { usePokemon } from '@/services/pokeapi';
import MasterDetailLayout from './layout/MasterDetailLayout';
import PokemonMasterPanel from './PokemonMasterPanel';
import DetailDeck from './DetailDeck';
import { Loader2 } from 'lucide-react';
import { Lang } from '@/lib/pokedexDictionary';

interface Props {
  pokemonId: string;
  lang: Lang;
}

export default function PokemonDetailView({ pokemonId, lang }: Props) {
  // Reutilizamos caché
  const { data: pokemon, isLoading, isError } = usePokemon(pokemonId, lang);

  if (isLoading) return <div className="w-full h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-cyan-500 animate-spin" /></div>;
  if (isError || !pokemon) return <div className="text-red-500">Error</div>;

  return (
    <MasterDetailLayout 
      master={
        <PokemonMasterPanel pokemon={pokemon} lang={lang} />
      }
      detail={
        <DetailDeck pokemon={pokemon} />
      }
    />
  );
}