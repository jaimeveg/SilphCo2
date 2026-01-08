'use client';

import { useState } from 'react';
import TabNavigator, { TabOption } from './navigation/TabNavigator';
import { IPokemon } from '@/types/interfaces';
import { Lang } from '@/lib/pokedexDictionary';

// IMPORTACIÓN CORREGIDA: Default import para el componente real
import ViewportData from './viewports/ViewportData'; 

// Placeholders para las pestañas futuras
import { ViewportMoves, ViewportPVP, ViewportNuzlocke } from './viewports/Placeholders';

interface Props {
  pokemon: IPokemon;
  lang: Lang;
}

export default function DetailDeck({ pokemon, lang }: Props) {
  const [activeTab, setActiveTab] = useState<TabOption>('DATA');

  const renderContent = () => {
    switch (activeTab) {
      case 'DATA': 
        // Renderizamos el componente REAL con los datos y el idioma
        return <ViewportData pokemon={pokemon} lang={lang} />;
      
      case 'MOVES': return <ViewportMoves />;
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