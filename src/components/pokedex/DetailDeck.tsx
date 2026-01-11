// src/components/pokedex/DetailDeck.tsx
'use client';

import { useState } from 'react';
import TabNavigator, { TabOption } from './navigation/TabNavigator';
import { IPokemon } from '@/types/interfaces';
import { Lang } from '@/lib/pokedexDictionary';
import ViewportData from './viewports/ViewportData';
import MoveRegistry from './viewports/MoveRegistry'; // <--- IMPORTAR
import { ViewportPVP, ViewportNuzlocke } from './viewports/Placeholders';

interface Props {
  pokemon: IPokemon;
  lang: Lang;
}

export default function DetailDeck({ pokemon, lang }: Props) {
  const [activeTab, setActiveTab] = useState<TabOption>('DATA');

  const renderContent = () => {
    switch (activeTab) {
      case 'DATA': return <ViewportData pokemon={pokemon} lang={lang} />;
      case 'MOVES': return <MoveRegistry moves={pokemon.moves} lang={lang} />; // <--- CONECTAR
      case 'PVP': return <ViewportPVP />;
      case 'NUZLOCKE': return <ViewportNuzlocke />;
      default: return <ViewportData pokemon={pokemon} lang={lang} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-h-[500px]">
      <div className="flex justify-between items-center pr-4">
        <TabNavigator activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div className="flex-1 relative">
         {renderContent()}
      </div>
    </div>
  );
}