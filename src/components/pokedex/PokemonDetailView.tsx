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
  // Key compuesta para refrescar si cambia idioma
  const { data: pokemon, isLoading, isError } = usePokemon(pokemonId, lang);

  if (isLoading) return <div className="w-full h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-cyan-500 animate-spin" /></div>;
  if (isError || !pokemon) return <div className="text-red-500">Error de sincronización con la base de datos.</div>;

  return (
    <MasterDetailLayout 
      master={
        <PokemonMasterPanel pokemon={pokemon} lang={lang} />
      }
      detail={
        // AHORA PASAMOS LANG AQUÍ
        <DetailDeck pokemon={pokemon} lang={lang} />
      }
    />
  );
}