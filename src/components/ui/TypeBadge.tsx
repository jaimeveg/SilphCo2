'use client';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { POKEDEX_DICTIONARY, Lang } from '@/lib/pokedexDictionary'; // Importar diccionario

// Mapeo de colores (se mantiene igual, no depende del idioma)
const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
  grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
  ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', steel: '#B7B7CE',
  fairy: '#D685AD', stellar: '#48D0B0', default: '#777',
};

interface TypeBadgeProps {
  type: string;
  className?: string;
  showLabel?: boolean;
  lang?: Lang; // <--- Nuevo Prop Opcional (default 'es' si no viene)
}

export default function TypeBadge({ type, className, showLabel = true, lang = 'es' }: TypeBadgeProps) {
  const normalizedType = type.toLowerCase();
  const color = TYPE_COLORS[normalizedType] || TYPE_COLORS.default;
  const iconUrl = `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${normalizedType}.svg`;

  // Obtener nombre traducido
  // @ts-ignore
  const translatedName = POKEDEX_DICTIONARY[lang].types[normalizedType] || type.toUpperCase();
  const labelPrefix = POKEDEX_DICTIONARY[lang].labels.type;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-opacity-10 backdrop-blur-md transition-transform hover:scale-105 cursor-help",
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        borderColor: `${color}60`,
        boxShadow: `0 0 10px ${color}40`,
      }}
      title={`${labelPrefix}: ${translatedName.toUpperCase()}`} // <--- Tooltip Traducido
    >
      <div className="relative w-4 h-4 shrink-0">
        <Image src={iconUrl} alt={type} fill className="object-contain" />
      </div>

      {showLabel && (
        <span
          className="text-xs font-bold uppercase tracking-wider font-mono"
          style={{ color: color }}
        >
          {translatedName} {/* Etiqueta Traducida (si se muestra) */}
        </span>
      )}
    </div>
  );
}