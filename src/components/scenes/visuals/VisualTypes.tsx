'use client';
import { ExternalLink, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function VisualTypes({
  pokeId,
  visualSignature,
}: {
  pokeId: number;
  visualSignature: string;
}) {
  const CHARIZARD_URL =
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png';
  const BLASTOISE_URL =
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png';
  const VENUSAUR_URL =
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png';
  const TYPE_ICON_BASE =
    'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* BACKGROUND ATMOSPHERE */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 opacity-20 pointer-events-none mix-blend-screen grayscale-[0.3]">
        <Image
          src={CHARIZARD_URL}
          alt="Charizard"
          fill
          className="object-contain"
        />
      </div>
      <div className="absolute -bottom-10 -right-10 w-64 h-64 opacity-20 pointer-events-none mix-blend-screen grayscale-[0.3]">
        <Image
          src={VENUSAUR_URL}
          alt="Venusaur"
          fill
          className="object-contain"
        />
      </div>
      <div className="absolute -bottom-10 -left-10 w-64 h-64 opacity-20 pointer-events-none mix-blend-screen grayscale-[0.3]">
        <Image
          src={BLASTOISE_URL}
          alt="Blastoise"
          fill
          className="object-contain"
        />
      </div>

      {/* CORE VISUAL: REACTOR DE TIPOS */}
      <div className="relative w-[280px] h-[280px] flex items-center justify-center mt-[-20px]">
        {/* TEXTO CENTRAL */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
          <h3 className="text-sm font-display font-bold text-white/50 uppercase tracking-widest text-center leading-tight">
            CICLO DE
            <br />
            EFECTIVIDAD
          </h3>
        </div>

        {/* ANILLO EXTERIOR (EFICAZ) */}
        <div className="absolute inset-0 rounded-full border border-slate-200/20">
          {/* Spin Clockwise */}
          <svg className="absolute inset-0 w-full h-full animate-[spin_60s_linear_infinite]">
            <circle
              cx="50%"
              cy="50%"
              r="49%"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeOpacity="0.4"
              strokeDasharray="4 4"
            />
            {/* Punteros Triangulares (Alineados al giro horario) */}
            {/* Top (0 deg) -> Points Right */}
            <polygon
              points="-4,-4 4,0 -4,4"
              fill="#e2e8f0"
              transform="translate(140, 2)"
            />
            {/* Right-Bottom (120 deg) */}
            <polygon
              points="-4,-4 4,0 -4,4"
              fill="#e2e8f0"
              transform="translate(260, 210) rotate(120)"
            />
            {/* Left-Bottom (240 deg) */}
            <polygon
              points="-4,-4 4,0 -4,4"
              fill="#e2e8f0"
              transform="translate(20, 210) rotate(240)"
            />
          </svg>

          {/* ETIQUETA EXTERIOR (Entre Fuego y Agua - Top Left) */}
          <div className="absolute top-[15%] left-[10%] -translate-x-1/2 -translate-y-1/2">
            <span className="text-[9px] font-mono text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-500/30 whitespace-nowrap">
              EFICAZ (x2)
            </span>
          </div>
        </div>

        {/* ANILLO INTERIOR (RESISTENCIA) */}
        <div className="absolute inset-[15%] rounded-full border border-slate-200/20">
          {/* Spin Counter-Clockwise */}
          <svg className="absolute inset-0 w-full h-full animate-[spin_40s_linear_infinite_reverse]">
            <circle
              cx="50%"
              cy="50%"
              r="49%"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeOpacity="0.2"
              strokeDasharray="2 2"
            />
            {/* Punteros Triangulares Inversos (Alineados al giro anti-horario) */}
            {/* Top (0 deg) -> Points Left */}
            <polygon
              points="4,-4 -4,0 4,4"
              fill="#94a3b8"
              transform="translate(98, 2)"
            />
            {/* Right-Bottom (120 deg) */}
            <polygon
              points="4,-4 -4,0 4,4"
              fill="#94a3b8"
              transform="translate(182, 145) rotate(120)"
            />
            {/* Left-Bottom (240 deg) */}
            <polygon
              points="4,-4 -4,0 4,4"
              fill="#94a3b8"
              transform="translate(14, 145) rotate(240)"
            />
          </svg>

          {/* ETIQUETA INTERIOR (Más separada del círculo) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-500/30 whitespace-nowrap translate-y-2">
              RESISTENCIA (x0.5)
            </span>
          </div>
        </div>

        {/* ICONOS DE TIPO */}
        {/* FUEGO */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-14 h-14 bg-slate-900/60 backdrop-blur-md rounded-full border border-orange-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            <img
              src={`${TYPE_ICON_BASE}fire.svg`}
              className="w-8 h-8 opacity-80"
            />
          </div>
        </div>
        {/* PLANTA */}
        <div className="absolute bottom-[15%] right-0 translate-x-1/4 z-10">
          <div className="w-14 h-14 bg-slate-900/60 backdrop-blur-md rounded-full border border-green-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.2)]">
            <img
              src={`${TYPE_ICON_BASE}grass.svg`}
              className="w-8 h-8 opacity-80"
            />
          </div>
        </div>
        {/* AGUA */}
        <div className="absolute bottom-[15%] left-0 -translate-x-1/4 z-10">
          <div className="w-14 h-14 bg-slate-900/60 backdrop-blur-md rounded-full border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <img
              src={`${TYPE_ICON_BASE}water.svg`}
              className="w-8 h-8 opacity-80"
            />
          </div>
        </div>
      </div>

      {/* BOTÓN ACTION */}
      <div className="absolute bottom-6 z-30 w-full flex justify-center px-6">
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
