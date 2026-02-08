'use client';

import { useState } from 'react';
import TabNavigator, { TabOption } from './navigation/TabNavigator';
import { IPokemon } from '@/types/interfaces';
import { Lang } from '@/lib/pokedexDictionary';
import ViewportData from './viewports/ViewportData';
import MoveRegistry from './viewports/MoveRegistry'; 
import CompetitiveDashboard from './viewports/competitive/CompetitiveDashboard';
import NuzlockeView from './viewports/nuzlocke/NuzlockeView';
import { ViewportNuzlocke } from './viewports/Placeholders';
import { useSearchParams } from 'next/navigation';

interface Props {
  pokemon: IPokemon;
  lang: Lang;
}

export default function DetailDeck({ pokemon, lang }: Props) {
  // Estado local para la navegación interna del Deck
  const searchParams = useSearchParams();
    
    // Inicializar estado basado en URL param '?tab='
    const [activeTab, setActiveTab] = useState<TabOption>(() => {
        const tabParam = searchParams.get('tab');
        const validTabs = ['DATA', 'MOVES', 'PVP', 'NUZLOCKE'];
        return validTabs.includes(tabParam || '') ? (tabParam as TabOption) : 'DATA';
    });

  const renderContent = () => {
    switch (activeTab) {
      case 'DATA': return <ViewportData pokemon={pokemon} lang={lang} />;
      case 'MOVES': return <MoveRegistry moves={pokemon.moves} lang={lang} />;
      case 'PVP': return <CompetitiveDashboard pokemon={pokemon} lang={lang} />; // <--- CONECTAR AQUÍ
      case 'NUZLOCKE': return <NuzlockeView pokemon={pokemon} lang={lang} />;
      default: return <ViewportData pokemon={pokemon} lang={lang} />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-h-[500px]">
      {/* Header con Navegación */}
      <div className="flex justify-between items-center pr-4 border-b border-slate-800/50">
        <TabNavigator activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      {/* Área de Contenido Dinámico */}
      <div className="flex-1 relative overflow-hidden bg-slate-950/30">
         {renderContent()}
      </div>
    </div>
  );
}