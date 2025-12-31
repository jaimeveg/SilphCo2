'use client';
import { useState, useEffect } from 'react';
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
  animate,
} from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, Zap, Droplets } from 'lucide-react';

type ConceptType = 'accuracy' | 'move' | 'stab' | 'category' | 'status';

export default function VisualConcept({
  pokeId,
  concept,
  dict, // 1. Inyección de I18n
}: {
  pokeId: number;
  concept: ConceptType;
  dict: any;
}) {
  // 2. Hook a textos
  const t = dict.visuals.concept;

  switch (concept) {
    case 'accuracy':
      return <AccuracyVisual t={t.accuracy} />;
    case 'move':
      return <MoveBreakdown t={t.move} />;
    case 'stab':
      return <StabMechanic t={t.stab} />;
    case 'category':
      return <CategorySplit t={t.category} />;
    case 'status':
      return <StatusMove t={t.status} />;
    default:
      return null;
  }
}

// ASSETS
const PIDGEOTTO_IMG =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/17.png';
const MILOTIC_IMG =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/350.png';
const GARCHOMP_IMG =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/445.png';
const ALAKAZAM_IMG =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/65.png';
const SABLEYE_IMG =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/302.png';
const URSHIFU_IMG =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/892.png';
const TYPE_ICON_BASE =
  'https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/';

/* --- 1. ACCURACY --- */
function AccuracyVisual({ t }: { t: any }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-900/50">
      <div className="relative z-20 flex flex-col items-center">
        <div className="relative w-40 h-40 drop-shadow-2xl">
          <Image
            src={PIDGEOTTO_IMG}
            alt="Pidgeotto"
            fill
            className="object-contain"
          />
        </div>
        <div className="flex flex-col items-center -mt-2 space-y-1">
          <div className="bg-slate-950/90 border border-cyan-500/50 px-3 py-1 rounded-full flex items-center gap-2 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-white tracking-widest">
              {t.evasion} {/* I18N */}
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 uppercase">
            {t.move_name} {/* I18N */}
          </span>
        </div>
      </div>
      {[...Array(2)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ x: [0, i === 0 ? -50 : 50, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute w-32 h-32 opacity-40 blur-sm grayscale mix-blend-screen z-10"
          style={{
            left: i === 0 ? '20%' : 'auto',
            right: i === 1 ? '20%' : 'auto',
          }}
        >
          <Image
            src={PIDGEOTTO_IMG}
            alt="Clone"
            fill
            className="object-contain"
          />
        </motion.div>
      ))}
      <motion.div
        animate={{ opacity: [0, 1, 0], y: -30, x: -30 }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute left-[15%] top-1/3 text-3xl font-black text-white/20 italic"
      >
        MISS
      </motion.div>
      <motion.div
        animate={{ opacity: [0, 1, 0], y: -30, x: 30 }}
        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        className="absolute right-[15%] top-1/3 text-3xl font-black text-white/20 italic"
      >
        MISS
      </motion.div>
    </div>
  );
}

/* --- 2. MOVE BREAKDOWN (TIGHT LAYOUT) --- */
function MoveBreakdown({ t }: { t: any }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center mt-12">
      {/* TARJETA CENTRAL */}
      <div className="relative z-10 bg-slate-950 border border-blue-500/40 p-5 rounded-xl w-60 shadow-2xl flex flex-col gap-3">
        {/* HEADER */}
        <div className="flex justify-between items-start border-b border-white/10 pb-2">
          <div>
            <h3 className="text-xl font-black text-white uppercase italic">
              {t.name} {/* I18N */}
            </h3>
            <span className="text-[10px] text-blue-300 font-mono">
              {t.type_cat} {/* I18N */}
            </span>
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded p-1 shadow">
            <img
              src={`${TYPE_ICON_BASE}water.svg`}
              className="w-full h-full invert"
              alt="Water Type"
            />
          </div>
        </div>
        {/* STATS */}
        <div className="space-y-2">
          <div className="flex justify-between items-center bg-slate-900 px-2 py-1.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              {t.power} {/* I18N */}
            </span>
            <span className="font-bold text-white">80</span>
          </div>
          <div className="flex justify-between items-center bg-slate-900 px-2 py-1.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
              {t.accuracy} {/* I18N */}
            </span>
            <span className="font-bold text-white">100%</span>
          </div>
        </div>
        {/* FOOTER */}
        <div className="text-[10px] text-slate-300 leading-tight pt-2 border-t border-white/5 bg-blue-900/10 p-2 rounded">
          {t.effect_desc} {/* I18N */}
        </div>
      </div>

      {/* LABELS (AJUSTADAS Y CERCANAS) */}

      {/* NOMBRE */}
      <div className="absolute top-[24%] left-[12%] flex items-center group">
        <span className="bg-slate-800 text-[9px] font-mono text-white px-2 py-1 rounded border border-slate-600 shadow-lg">
          {t.label_name} {/* I18N */}
        </span>
        <div className="w-8 h-px bg-slate-500" />
        <div className="w-px h-8 bg-slate-500" />
      </div>

      {/* TIPO */}
      <div className="absolute top-[25%] right-[14%] flex items-center justify-end group">
        <div className="w-px h-8 bg-blue-500" />
        <div className="w-8 h-px bg-blue-500" />
        <span className="bg-blue-900/50 text-[9px] font-mono text-blue-300 px-2 py-1 rounded border border-blue-500/50 shadow-lg">
          {t.label_type} {/* I18N */}
        </span>
      </div>

      {/* POTENCIA */}
      <div className="absolute top-[44%] left-[10%] flex items-center group">
        <span className="bg-red-900/40 text-[9px] font-mono text-red-300 px-2 py-1 rounded border border-red-500/40 shadow-lg">
          {t.label_power} {/* I18N */}
        </span>
        <div className="w-12 h-px bg-red-500/60" />
      </div>

      {/* PRECISIÓN */}
      <div className="absolute top-[55%] right-[10%] flex items-center justify-end group">
        <div className="w-12 h-px bg-emerald-500/60" />
        <span className="bg-emerald-900/40 text-[9px] font-mono text-emerald-300 px-2 py-1 rounded border border-emerald-500/40 shadow-lg">
          {t.label_accuracy} {/* I18N */}
        </span>
      </div>

      {/* EFECTO */}
      <div className="absolute bottom-[10%] left-[45%] flex flex-col items-center group">
        <div className="h-6 w-px bg-slate-500 mb-1" />
        <span className="bg-slate-800 text-[9px] font-mono text-slate-300 px-2 py-1 rounded border border-slate-600 shadow-lg">
          {t.label_effect} {/* I18N */}
        </span>
      </div>
    </div>
  );
}

/* --- 3. STAB MECHANIC (CICLO DE REINICIO) --- */
function StabMechanic({ t }: { t: any }) {
  const count = useMotionValue(80);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const runAnimationCycle = async () => {
      count.set(80);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await animate(count, 120, { duration: 2.5, ease: 'circOut' });
      await new Promise((resolve) => setTimeout(resolve, 4000));
      runAnimationCycle();
    };

    runAnimationCycle();
  }, [count]);

  return (
    <div className="relative w-full h-full flex items-center justify-center gap-6 px-4">
      {/* BACKGROUND: MILOTIC */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
        <div className="relative w-[340px] h-[340px] opacity-40 grayscale-[0.3]">
          <Image
            src={MILOTIC_IMG}
            alt="Milotic"
            fill
            className="object-contain"
          />
        </div>
        <div className="mt-[-20px] bg-blue-900/50 border border-blue-500/50 px-3 py-0.5 rounded-full flex items-center gap-1 shadow-lg backdrop-blur-sm z-10">
          <div className="w-3 h-3">
            <img src={`${TYPE_ICON_BASE}water.svg`} alt="Type" />
          </div>
          <span className="text-[10px] font-bold text-blue-200">{t.type_water}</span>
        </div>
      </div>

      {/* CARDS */}
      <div className="relative z-10 flex items-center gap-4 mt-8">
        <div className="w-28 bg-slate-950/80 border border-slate-700 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex justify-between border-b border-slate-700 pb-1 mb-1">
            <span className="text-[9px] font-bold text-white">{t.move_name}</span>
            <div className="w-3 h-3 bg-blue-600 rounded-full p-0.5">
              <img src={`${TYPE_ICON_BASE}water.svg`} className="invert" alt="Type" />
            </div>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 block">{t.base}</span>
            <span className="text-2xl font-mono text-white">80</span>
          </div>
        </div>

        <ArrowRight className="text-white/50" />

        <div className="w-32 bg-slate-950/90 border border-brand-cyan/50 rounded-lg p-3 backdrop-blur-sm shadow-[0_0_20px_rgba(56,189,248,0.2)]">
          <div className="flex justify-between border-b border-brand-cyan/30 pb-1 mb-1">
            <span className="text-[9px] font-bold text-brand-cyan">
              {t.result}
            </span>
            <div className="w-3 h-3 bg-brand-cyan rounded-full p-0.5 flex items-center justify-center">
              <Droplets size={8} className="text-slate-900 fill-current" />
            </div>
          </div>
          <div className="text-center">
            <motion.div className="text-4xl font-black text-white tabular-nums">
              {rounded}
            </motion.div>
            <span className="text-[9px] font-bold text-brand-cyan bg-brand-cyan/10 px-1 rounded block mt-1">
              {t.multiplier}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- 4. CATEGORY SPLIT --- */
function CategorySplit({ t }: { t: any }) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl flex border border-white/10">
      <div className="w-1/2 h-full relative overflow-hidden group border-r border-white/10">
        <div className="absolute inset-0 bg-orange-900/80 z-0" />
        <Image
          src={GARCHOMP_IMG}
          alt="Garchomp"
          fill
          className="object-cover opacity-30 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10 text-center">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-3 shadow-lg ring-4 ring-orange-500/20">
            <span className="text-2xl">💥</span>
          </div>
          <h4 className="text-lg font-black text-white uppercase drop-shadow-md">
            {t.physical} {/* I18N */}
          </h4>
          <div className="h-px w-12 bg-orange-300/50 my-2" />
          <p className="text-[9px] text-orange-100 text-center font-mono leading-tight px-2 whitespace-pre-line">
            {t.physical_desc} {/* I18N */}
          </p>
        </div>
      </div>

      <div className="w-1/2 h-full relative overflow-hidden group">
        <div className="absolute inset-0 bg-purple-900/80 z-0" />
        <Image
          src={ALAKAZAM_IMG}
          alt="Alakazam"
          fill
          className="object-cover opacity-30 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10 text-center">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-3 shadow-lg ring-4 ring-purple-500/20 relative overflow-hidden">
            <div className="absolute inset-0 border-2 border-white/50 rounded-full animate-ping" />
            <div className="absolute inset-2 border-2 border-white rounded-full" />
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <h4 className="text-lg font-black text-white uppercase drop-shadow-md">
            {t.special} {/* I18N */}
          </h4>
          <div className="h-px w-12 bg-purple-300/50 my-2" />
          <p className="text-[9px] text-purple-100 font-mono leading-tight px-2 whitespace-pre-line">
            {t.special_desc} {/* I18N */}
          </p>
        </div>
      </div>
    </div>
  );
}

/* --- 5. STATUS MOVE --- */
function StatusMove({ t }: { t: any }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center gap-16 px-4 bg-slate-900/50">
      {/* USER: SABLEYE */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 relative mb-2 drop-shadow-xl grayscale-[0.3]">
          <Image
            src={SABLEYE_IMG}
            alt="Sableye"
            fill
            className="object-contain"
          />
        </div>
        <div className="px-3 py-1 bg-purple-900/80 border border-purple-500/50 rounded-full text-[10px] text-purple-200 font-mono font-bold shadow-lg">
          Will-O-Wisp
        </div>
      </div>

      {/* TARGET: URSHIFU */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-40 h-40 relative mb-2 drop-shadow-2xl">
          <Image
            src={URSHIFU_IMG}
            alt="Urshifu"
            fill
            className="object-contain"
          />

          {/* BRN LABEL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 0, 1, 1, 0],
              scale: [0.8, 0.8, 1.1, 1, 0.9],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              times: [0, 0.5, 0.55, 0.9, 0.95],
            }}
            className="absolute top-0 right-4 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg z-20"
          >
            {t.burn} {/* I18N */}
          </motion.div>
        </div>

        {/* ATK DROP LABEL */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 0, 1, 1, 0], y: [10, 10, 0, 0, 5] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            times: [0, 0.5, 0.55, 0.9, 0.95],
          }}
          className="px-2 py-0.5 bg-red-900/40 border border-red-500/30 rounded text-[9px] text-red-200 font-mono"
        >
          {t.atk_drop} {/* I18N */}
        </motion.div>
      </div>

      {/* PROYECTIL */}
      <motion.div
        initial={{ left: '35%', opacity: 0, scale: 0.5 }}
        animate={{
          left: ['35%', '63%', '63%'],
          opacity: [1, 1, 0],
          scale: [0.8, 1.2, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          times: [0, 0.5, 0.55],
        }}
        className="absolute top-[40%] z-20 -translate-y-1/2"
      >
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 bg-purple-500 rounded-full blur-sm" />
          <div className="absolute inset-2 bg-white rounded-full blur-[1px]" />
          <div className="absolute right-full top-1/2 w-10 h-4 bg-gradient-to-l from-purple-600 to-transparent -translate-y-1/2 opacity-60 blur-sm" />
        </div>
      </motion.div>
    </div>
  );
}