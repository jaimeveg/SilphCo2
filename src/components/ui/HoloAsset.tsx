'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Mapeo legacy (lo mantenemos por compatibilidad)
const VISUAL_ID_MAP: Record<string, number> = {
  Elemental_Type_Chart_Active: 6,
  Dual_Type_Overlap: 448,
  // ... resto
  default: 132,
};

interface HoloAssetProps {
  signature?: string;
  pokeId?: number; // <--- Nueva prop para control directo
}

export default function HoloAsset({
  signature = 'default',
  pokeId,
}: HoloAssetProps) {
  // Si nos dan un ID directo, lo usamos. Si no, buscamos en el mapa.
  const finalId =
    pokeId || VISUAL_ID_MAP[signature] || VISUAL_ID_MAP['default'];

  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${finalId}.png`;

  return (
    <div className="relative w-full h-full flex items-center justify-center group">
      {/* ... resto del código igual (Glow, Image, SVG ring) ... */}
      <div className="absolute inset-0 bg-brand-cyan/20 blur-[60px] rounded-full scale-50 group-hover:scale-75 transition-transform duration-700" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-[70%] h-[70%]"
      >
        <Image
          src={spriteUrl}
          alt={`Pokemon ${finalId}`}
          fill
          className="object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        />
      </motion.div>
    </div>
  );
}
