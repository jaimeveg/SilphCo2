'use client';

import { useState } from 'react';
import TabNavigator, { TabOption } from './navigation/TabNavigator';
import { 
  ViewportData, 
  ViewportMoves, 
  ViewportPVP, 
  ViewportNuzlocke 
} from './viewports/Placeholders';
import { IPokemon } from '@/types/interfaces'; // Asumiendo que recibiremos datos completos

interface Props {
  // En el futuro, pasaremos aquí los datos completos (competitive, nuzlocke, etc.)
  pokemon: IPokemon; 
}

export default function DetailDeck({ pokemon }: Props) {
  // 1. STATE DEFINITION
  const [activeTab, setActiveTab] = useState<TabOption>('DATA');

  // 2. RENDER LOGIC (Switch Case)
  // Usamos una función render para mantener el JSX limpio
  const renderContent = () => {
    switch (activeTab) {
      case 'DATA':
        return <ViewportData />;
      case 'MOVES':
        return <ViewportMoves />;
      case 'PVP':
        return <ViewportPVP />;
      case 'NUZLOCKE':
        return <ViewportNuzlocke />;
      default:
        return <ViewportData />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-h-[500px]">
      
      {/* 1. NAVEGACIÓN (Sticky Header) */}
      {/* Pasamos el estado y el setter hacia abajo */}
      <TabNavigator 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {/* 2. CONTENIDO DINÁMICO (Viewport) */}
      {/* El contenido cambia instantáneamente sin recarga */}
      <div className="flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {renderContent()}
      </div>

    </div>
  );
}