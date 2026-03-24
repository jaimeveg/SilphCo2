'use client';
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

interface TacticalIconProps {
  pokemonId: string;
  pokemonName?: string;
  size?: number;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export default function TacticalIcon({ pokemonId, pokemonName = '???', size = 48, className, fallbackIcon }: TacticalIconProps) {
  const [step, setStep] = useState(0);

  const getSource = () => {
    switch (step) {
      case 0:
        return `/images/pokemon/icon/${pokemonId}.png`;
      case 1:
        return `/images/pokemon/high-res/${pokemonId}.png`;
      case 2:
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
      default:
        return null;
    }
  };

  const currentSrc = getSource();

  // Clean numeric ID for PokeAPI if the current ID is a string like "151-mega"
  const cleanPokeApiSrc = () => {
    const numericPart = pokemonId.split('-')[0];
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${numericPart}.png`;
  };

  const handleError = () => {
    if (step === 2 && pokemonId.includes('-')) {
      // Very specific edge case, if step 2 failed, let's try the base form on pokeapi
      setStep(3); // Wait, we can add a 4th step or just go to 3
    }
    setStep((prev) => prev + 1);
  };

  if (step >= 3 || !currentSrc) {
    // If all visual fallbacks failed, return the semantic fallback
    return (
      <div 
        style={{ width: size, height: size }}
        className={cn("bg-slate-800/50 border border-slate-700/50 rounded-md flex items-center justify-center text-slate-500", className)}
        title={pokemonName}
      >
        {fallbackIcon || <HelpCircle size={size * 0.5} />}
      </div>
    );
  }

  return (
    <div 
      style={{ width: size, height: size }} 
      className={cn("relative flex items-center justify-center flex-shrink-0 drop-shadow-md", className)}
      title={pokemonName}
    >
      <img
        src={step === 2 && pokemonId.includes('-') ? cleanPokeApiSrc() : currentSrc}
        alt={pokemonName}
        onError={handleError}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
