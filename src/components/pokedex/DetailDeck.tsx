'use client';

import { useState } from 'react';
import TabNavigator, { TabOption } from './navigation/TabNavigator';
import { ViewportData, ViewportMoves, ViewportPVP, ViewportNuzlocke } from './viewports/Placeholders';
import { IPokemon } from '@/types/interfaces';

interface Props {
  pokemon: IPokemon;
}

export default function DetailDeck({ pokemon }: Props) {
  // Estado local para navegación de pestañas
  const [activeTab, setActiveTab] = useState<TabOption>('DATA');

  // Renderizado condicional del contenido del Viewport B
  const renderContent = () => {
    switch (activeTab) {
      case 'DATA': return <ViewportData />;
      case 'MOVES': return <ViewportMoves />;
      case 'PVP': return <ViewportPVP />;
      case 'NUZLOCKE': return <ViewportNuzlocke />;
      default: return <ViewportData />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-h-[500px]">
      
      {/* HEADER BAR: Solo TabNavigator por ahora */}
      <div className="flex justify-between items-center pr-4">
        <TabNavigator activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* VIEWPORT CONTENT AREA */}
      <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {renderContent()}
      </div>

    </div>
  );
}