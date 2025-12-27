'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Zap } from 'lucide-react';

export default function VisualDual({ pokeId }: { pokeId: number }) {
  const POKEMON_IMG =
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/306.png';
  const TYPE_ICON_BASE =
    'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/';

  return (
    // FIX: pt-24 para bajar el contenido y evitar solapamiento con DATA POINT
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden pt-24 pb-4">
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[300px] h-[300px] mt-8">
          <Image
            src={POKEMON_IMG}
            alt="Aggron Background"
            fill
            className="object-contain opacity-40 blur-[2px] grayscale-[0.5]"
          />
        </div>
      </div>
      <div className="absolute inset-0 bg-slate-950/60 z-0" />

      {/* HEADER + LOGOS PILL STYLE */}
      <div className="relative z-10 text-center mb-6">
        <h3 className="text-lg font-display font-bold text-white uppercase tracking-widest mb-3">
          AGGRON
        </h3>
        <div className="flex justify-center gap-3">
          <div className="flex items-center gap-2 pl-1 pr-3 py-1 bg-slate-800/80 border border-slate-600 rounded-full shadow-lg backdrop-blur-md">
            <div className="w-5 h-5 bg-slate-700 rounded-full flex items-center justify-center p-1">
              <img
                src={`${TYPE_ICON_BASE}steel.svg`}
                className="invert opacity-90"
              />
            </div>
            <span className="text-[10px] font-bold text-slate-300 tracking-wide">
              ACERO
            </span>
          </div>
          <div className="flex items-center gap-2 pl-1 pr-3 py-1 bg-yellow-900/40 border border-yellow-700/50 rounded-full shadow-lg backdrop-blur-md">
            <div className="w-5 h-5 bg-yellow-800 rounded-full flex items-center justify-center p-1">
              <img
                src={`${TYPE_ICON_BASE}rock.svg`}
                className="invert opacity-90"
              />
            </div>
            <span className="text-[10px] font-bold text-yellow-500 tracking-wide">
              ROCA
            </span>
          </div>
        </div>
      </div>

      {/* TARJETAS DE DATOS */}
      <div className="grid grid-cols-2 gap-4 w-full px-6 mb-6 relative z-10">
        {/* DEBILIDAD */}
        <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 flex flex-col backdrop-blur-sm hover:bg-red-900/30 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-mono text-red-400 uppercase">
              Debilidad
            </span>
            <span className="text-xl font-black text-white italic">x4</span>
          </div>
          <div className="space-y-2 mt-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-slate-800 rounded-full p-1">
                <img
                  src={`${TYPE_ICON_BASE}fighting.svg`}
                  className="opacity-70"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-300">
                LUCHA
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-slate-800 rounded-full p-1">
                <img
                  src={`${TYPE_ICON_BASE}ground.svg`}
                  className="opacity-70"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-300">
                TIERRA
              </span>
            </div>
          </div>
        </div>
        {/* RESISTENCIA */}
        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 flex flex-col backdrop-blur-sm hover:bg-emerald-900/30 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[9px] font-mono text-emerald-400 uppercase">
              Resistencia
            </span>
            <span className="text-xl font-black text-white italic">x0.25</span>
          </div>
          <div className="space-y-2 mt-1">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-slate-800 rounded-full p-1">
                <img
                  src={`${TYPE_ICON_BASE}normal.svg`}
                  className="opacity-70"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-300">
                NORMAL
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-slate-800 rounded-full p-1">
                <img
                  src={`${TYPE_ICON_BASE}flying.svg`}
                  className="opacity-70"
                />
              </div>
              <span className="text-[10px] font-bold text-slate-300">
                VOLADOR
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÓN ACTION */}
      <div className="relative z-30 w-full flex justify-center px-6">
        <Link
          href="/tools/type-calculator"
          className="w-full max-w-xs group relative flex items-center justify-between px-5 py-3 bg-slate-900/90 border border-slate-700 hover:border-brand-cyan/50 rounded-lg overflow-hidden transition-all shadow-lg"
        >
          <div className="absolute inset-0 bg-brand-cyan/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-slate-800 rounded text-brand-cyan">
              <Zap size={16} />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-mono text-slate-500 uppercase">
                HERRAMIENTA
              </span>
              <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                CALCULADORA DE TIPOS
              </span>
            </div>
          </div>
          <ExternalLink
            size={14}
            className="text-slate-600 group-hover:text-brand-cyan transition-colors"
          />
        </Link>
      </div>
    </div>
  );
}
