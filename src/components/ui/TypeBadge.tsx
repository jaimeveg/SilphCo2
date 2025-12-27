'use client';
import Image from 'next/image';

// 1. Paleta de Colores Tácticos por Tipo (Hexadecimales ajustados para Dark Mode)
const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  steel: '#B7B7CE',
  fairy: '#D685AD',
  default: '#777',
};

interface TypeBadgeProps {
  type: string; // ej: "fire", "water"
  showLabel?: boolean;
}

export default function TypeBadge({ type, showLabel = true }: TypeBadgeProps) {
  const normalizedType = type.toLowerCase();
  const color = TYPE_COLORS[normalizedType] || TYPE_COLORS.default;

  // 2. Repositorio de Iconos SVG (raw.githubusercontent)
  // Usamos el set de iconos 'duiker101' que es el estándar de la industria
  const iconUrl = `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${normalizedType}.svg`;

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-opacity-10 backdrop-blur-md transition-transform hover:scale-105"
      style={{
        backgroundColor: `${color}20`, // 20 = 12% opacidad
        borderColor: `${color}60`, // 60 = 40% opacidad
        boxShadow: `0 0 10px ${color}40`, // Glow sutil
      }}
    >
      {/* Icono Vectorial */}
      <div className="relative w-4 h-4">
        <Image src={iconUrl} alt={type} fill className="object-contain" />
      </div>

      {/* Etiqueta de Texto (Opcional) */}
      {showLabel && (
        <span
          className="text-xs font-bold uppercase tracking-wider font-mono"
          style={{ color: color }}
        >
          {type}
        </span>
      )}
    </div>
  );
}
