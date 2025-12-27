'use client';
import { useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionValueEvent,
} from 'framer-motion';
import dynamic from 'next/dynamic';
import { NarrativeSceneData } from '@/types/silph';
import { TextScramble } from '@/components/ui/TextScramble';
import { ArrowRight, Database, ArrowUpCircle } from 'lucide-react';

import VisualStats from './visuals/VisualStats';
import VisualTypes from './visuals/VisualTypes';
import VisualDual from './visuals/VisualDual';
import VisualConcept from './visuals/VisualConcept';
import HoloAsset from '@/components/ui/HoloAsset';

const WeatherSim = dynamic(() => import('./visuals/simulations/WeatherSim'), {
  loading: () => (
    <div className="h-full flex items-center justify-center text-brand-cyan animate-pulse">
      LOADING...
    </div>
  ),
});
const SynergyGraph = dynamic(() => import('./visuals/graphs/SynergyGraph'), {
  loading: () => (
    <div className="h-full flex items-center justify-center text-brand-cyan animate-pulse">
      LOADING...
    </div>
  ),
});

const SCENE_CONFIG: Record<
  string,
  { type: string; pokeId: number; extra?: string }
> = {
  '1.1_type_matchup': { type: 'types', pokeId: 6 },
  '1.2_dual_typing': { type: 'dual', pokeId: 306 },
  '1.3_stat_hp': { type: 'stat', pokeId: 242, extra: 'hp' },
  '1.4_stat_atk_def': { type: 'stat', pokeId: 464, extra: 'atk-def' },
  '1.5_stat_spa_spd': { type: 'stat', pokeId: 987, extra: 'spa-spd' },
  '1.6_stat_speed': { type: 'stat', pokeId: 887, extra: 'spe' },
  '1.7_bst_analysis': { type: 'stat', pokeId: 150, extra: 'all' },
  '1.8_hidden_accuracy': { type: 'concept', pokeId: 405, extra: 'accuracy' },
  '1.9_move_logic': { type: 'concept', pokeId: 475, extra: 'move' },
  '1.10_stab_mechanic': { type: 'concept', pokeId: 474, extra: 'stab' },
  '1.11_move_category': { type: 'concept', pokeId: 107, extra: 'category' },
  '1.12_status_moves': { type: 'concept', pokeId: 302, extra: 'status' },
};

const ID_MAP: Record<string, string> = {
  '1.4_stat_atk_def': 'section-physical-stats',
  '1.5_stat_spa_spd': 'section-special-stats',
  '1.11_move_category': 'section-mechanics-category',
};

interface NavigationState {
  isActive: boolean;
  originY: number;
  targetY: number;
}

export default function NarrativeScene({
  data,
  index,
}: {
  data: NarrativeSceneData;
  index: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ESTADO DE UI
  const [navState, setNavState] = useState<NavigationState | null>(null);

  // ESTADOS LÓGICOS DE VIAJE
  const pendingNavigation = useRef<{ originY: number; targetY: number } | null>(
    null
  );
  const isReturning = useRef(false); // Nuevo flag para la vuelta

  // CONTROL DE SCROLL
  const isScrollingProgrammatically = useRef(false);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { scrollY, scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0.2, 0.8], [0.95, 1]);

  const cleanId = ID_MAP[data.id] || data.id;

  // --- ENGINE DE SCROLL ---
  const performScroll = (yPosition: number) => {
    const globalLenis = (window as any).lenis;
    const lenisInstance = globalLenis?.lenis || globalLenis;

    if (lenisInstance && typeof lenisInstance.scrollTo === 'function') {
      lenisInstance.scrollTo(yPosition, {
        duration: 1.5,
        lock: true,
        force: true,
      });
    } else {
      window.scrollTo({ top: yPosition, behavior: 'smooth' });
    }
  };

  // --- TRIGGER DE NAVEGACIÓN (BAJADA) ---
  const handleNavigation = (targetId: string) => {
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    const currentScroll = window.scrollY;
    // Offset 280px para asegurar visibilidad del título
    const destinationScroll =
      targetEl.getBoundingClientRect().top + currentScroll - 280;

    isScrollingProgrammatically.current = true;
    performScroll(destinationScroll);

    // Registramos intención, pero NO mostramos botón aún
    pendingNavigation.current = {
      originY: currentScroll,
      targetY: destinationScroll,
    };

    // Timeout de caducidad para la bajada
    safetyTimeoutRef.current = setTimeout(() => {
      isScrollingProgrammatically.current = false;
      pendingNavigation.current = null;
    }, 2000);
  };

  // --- TRIGGER DE RETORNO (SUBIDA BLINDADA) ---
  const handleReturn = () => {
    if (navState) {
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

      // 1. ACTIVAR FLAGS
      isScrollingProgrammatically.current = true;
      isReturning.current = true; // Marcamos que estamos intentando volver

      // 2. EJECUTAR SCROLL
      performScroll(navState.originY);

      // 3. NO OCULTAMOS EL BOTÓN TODAVÍA
      // Se quedará visible hasta que el Observer confirme la llegada.
      // Si la inercia falla, el botón sigue ahí para reintentar.

      // Timeout de seguridad por si nos quedamos atascados
      safetyTimeoutRef.current = setTimeout(() => {
        isScrollingProgrammatically.current = false;
        isReturning.current = false;
        // Nota: Si falló, el botón sigue ahí. Correcto.
      }, 2000);
    }
  };

  // --- OBSERVER CEREBRO (CONTROL DE TRÁFICO) ---
  useMotionValueEvent(scrollY, 'change', (latest) => {
    // CASO 1: RETORNO EN PROCESO (Subiendo a casa)
    if (isReturning.current && navState) {
      const distanceToOrigin = Math.abs(latest - navState.originY);

      // Si estamos llegando a casa (< 100px)
      if (distanceToOrigin < 100) {
        setNavState(null); // AHORA SÍ: Matamos el botón
        isReturning.current = false;
        isScrollingProgrammatically.current = false;
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      }
      return; // Prioridad máxima
    }

    // CASO 2: NAVEGACIÓN PENDIENTE (Bajando al destino)
    if (pendingNavigation.current) {
      const distanceToTarget = Math.abs(
        latest - pendingNavigation.current.targetY
      );

      // Si estamos llegando al destino (< 100px)
      if (distanceToTarget < 100) {
        setNavState({
          isActive: true,
          originY: pendingNavigation.current.originY,
          targetY: pendingNavigation.current.targetY,
        });
        pendingNavigation.current = null;
        isScrollingProgrammatically.current = false;
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      }
      return;
    }

    // CASO 3: MONITORIZACIÓN ESTÁTICA (Usuario leyendo)
    if (navState && navState.isActive) {
      // Si el usuario hace scroll manual y se aleja mucho del destino...
      if (!isScrollingProgrammatically.current) {
        const distanceToTarget = Math.abs(latest - navState.targetY);
        if (distanceToTarget > 800) {
          setNavState(null); // Ocultar botón por lejanía
        }
      }
    }
  });

  // --- RENDERIZADO VISUAL ---
  const renderVisualModule = () => {
    if (data.visual_signature === 'weather_particle_sys')
      return <WeatherSim config={data.data} />;
    if (data.visual_signature === 'synergy_network_graph')
      return <SynergyGraph graphData={data.data} />;

    const legacyConfig = SCENE_CONFIG[data.id] || {
      type: 'default',
      pokeId: 132,
    };

    switch (legacyConfig.type) {
      case 'stat':
        return (
          <VisualStats
            pokeId={legacyConfig.pokeId}
            highlightStat={legacyConfig.extra || 'all'}
            scrollProgress={scrollYProgress}
          />
        );
      case 'types':
        return (
          <VisualTypes
            pokeId={legacyConfig.pokeId}
            visualSignature={data.visual_signature as string}
          />
        );
      case 'dual':
        return <VisualDual pokeId={legacyConfig.pokeId} />;
      case 'concept':
        return (
          <VisualConcept
            pokeId={legacyConfig.pokeId}
            concept={legacyConfig.extra as any}
          />
        );
      default:
        return <HoloAsset signature={data.visual_signature as string} />;
    }
  };

  const renderActionButtons = () => {
    if (data.id === '1.4_stat_atk_def' || data.id === '1.5_stat_spa_spd') {
      return (
        <div className="mt-8 pt-6 border-t border-slate-800/50">
          <button
            onClick={() => handleNavigation('section-mechanics-category')}
            className="inline-flex items-center gap-2 text-xs font-mono text-brand-cyan hover:text-white transition-colors group cursor-pointer focus:outline-none"
          >
            <span className="border-b border-brand-cyan/30 group-hover:border-brand-cyan pb-0.5">
              RELACIONADO: CATEGORÍA DE MOVIMIENTO
            </span>
            <ArrowRight
              size={12}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>
      );
    }
    if (data.id.includes('move') || data.id.includes('stab')) {
      return (
        <div className="mt-8 pt-6 border-t border-slate-800/50">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-400 cursor-not-allowed opacity-70 hover:opacity-100 transition-opacity">
            <Database size={12} />
            <span>IR A BBDD MOVIMIENTOS (WIP)</span>
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-[85vh] flex items-center justify-center py-16 border-b border-slate-800/50 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-slate-900/0 to-purple-900/5 opacity-50 blur-[100px]" />

      <motion.div
        style={{ opacity, scale, y }}
        className="relative w-full max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10"
      >
        {/* COLUMNA VISUAL */}
        <div className="relative aspect-square lg:aspect-[4/3] rounded-3xl bg-slate-900/40 border border-white/10 backdrop-blur-sm overflow-hidden flex items-center justify-center shadow-2xl group">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B_1px,transparent_1px),linear-gradient(to_bottom,#1E293B_1px,transparent_1px)] opacity-20 bg-[size:40px_40px]" />
          {renderVisualModule()}
          <div className="absolute top-6 right-6 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded border border-white/10 z-30 pointer-events-none">
            <span className="block text-[10px] text-brand-cyan font-mono tracking-widest uppercase mb-1">
              DATA POINT
            </span>
            <TextScramble
              text={data.content.kpi}
              className="text-xl font-bold text-white font-display"
            />
          </div>
        </div>

        {/* COLUMNA NARRATIVA */}
        <div className="relative z-20 space-y-10 pl-4">
          {/* ANCHOR TARGET */}
          <div id={cleanId} className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/5 border border-brand-cyan/20">
              <span className="text-brand-cyan text-xs font-mono tracking-widest">
                SEQ_{String(index + 1).padStart(2, '0')} //{' '}
                {data.id.split('_').slice(1).join('_').toUpperCase()}
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white font-display uppercase leading-[0.9] tracking-tight">
              <TextScramble text={data.content.headline} />
            </h2>
          </div>

          <p className="text-lg text-slate-400 font-light leading-relaxed max-w-xl border-l-2 border-slate-800 pl-6">
            {data.content.body}
          </p>

          {renderActionButtons()}

          {/* SYSTEM NOTES */}
          <div className="grid grid-cols-1 gap-4 pt-8 mt-4">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1 h-1 bg-slate-500 rounded-full"></span> SYSTEM
              NOTES
            </span>

            {data.content.technical_notes?.map((note, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{
                  delay: 0.1 + i * 0.1,
                  duration: 0.5,
                  ease: 'easeOut',
                }}
                className="group relative overflow-hidden bg-slate-900 border-l-2 border-slate-700 hover:border-brand-cyan p-5 transition-all duration-300 rounded-r-lg"
              >
                <div className="absolute inset-0 bg-brand-cyan/5 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                <div className="relative z-10">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-brand-cyan font-bold font-mono text-xs uppercase tracking-wider">
                      [{note.label}]
                    </span>
                    <div className="h-px flex-1 bg-slate-800 group-hover:bg-brand-cyan/30 transition-colors" />
                  </div>
                  <p className="text-sm text-slate-400 group-hover:text-slate-200 leading-relaxed font-light">
                    {note.tooltip}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* BOTÓN FLOTANTE */}
      <AnimatePresence>
        {navState?.isActive && (
          <motion.button
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            onClick={handleReturn}
            className="fixed bottom-12 right-12 z-50 flex items-center gap-3 px-5 py-3 bg-brand-cyan text-slate-950 rounded-full shadow-[0_0_30px_rgba(56,189,248,0.4)] font-bold font-mono text-xs hover:scale-105 transition-transform hover:bg-white cursor-pointer"
          >
            <ArrowUpCircle size={18} />
            <span>VOLVER AL ORIGEN</span>
          </motion.button>
        )}
      </AnimatePresence>
    </section>
  );
}
