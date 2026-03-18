'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface PokemonAvatarProps {
  numericId: string | number;
  alt: string;
}

export default function PokemonAvatar({ numericId, alt }: PokemonAvatarProps) {
  const [error, setError] = useState(false);

  const primarySrc = `/images/pokemon/high-res/${numericId}.png`;
  const fallbackSrc = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${numericId}.png`;

  return (
    <Image 
      src={error ? fallbackSrc : primarySrc}
      alt={alt}
      width={64}
      height={64}
      className="object-contain"
      unoptimized
      onError={() => {
        if (!error) {
          setError(true);
        }
      }}
    />
  );
}
