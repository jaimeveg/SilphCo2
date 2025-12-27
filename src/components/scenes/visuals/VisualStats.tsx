'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import Image from 'next/image';

interface VisualStatsProps {
  pokeId: number;
  highlightStat: string;
  scrollProgress: any;
}

export default function VisualStats({
  pokeId,
  highlightStat,
}: VisualStatsProps) {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // URLs de Assets
  const OFFICIAL_ARTWORK = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeId}.png`;
  const SPRITE_ICON = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png`;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeId}`);
        const data = await res.json();
        const normalize = (val: number) => Math.min((val / 160) * 100, 100);

        setStats([
          {
            label: 'HP',
            value: data.stats[0].base_stat,
            norm: normalize(data.stats[0].base_stat),
            key: 'hp',
          },
          {
            label: 'ATK',
            value: data.stats[1].base_stat,
            norm: normalize(data.stats[1].base_stat),
            key: 'atk',
          },
          {
            label: 'DEF',
            value: data.stats[2].base_stat,
            norm: normalize(data.stats[2].base_stat),
            key: 'def',
          },
          {
            label: 'SPE',
            value: data.stats[5].base_stat,
            norm: normalize(data.stats[5].base_stat),
            key: 'spe',
          },
          {
            label: 'SPD',
            value: data.stats[4].base_stat,
            norm: normalize(data.stats[4].base_stat),
            key: 'spd',
          },
          {
            label: 'SPA',
            value: data.stats[3].base_stat,
            norm: normalize(data.stats[3].base_stat),
            key: 'spa',
          },
        ]);
        setLoading(false);
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, [pokeId]);

  if (loading)
    return (
      <div className="animate-pulse w-full h-full bg-slate-800/50 rounded-xl" />
    );

  const size = 300;
  const center = size / 2;
  const radius = 100;
  const angleSlice = (Math.PI * 2) / 6;

  const getCoordinates = (value: number, index: number) => {
    const angle = index * angleSlice - Math.PI / 2;
    return {
      x: center + Math.cos(angle) * (radius * (value / 100)),
      y: center + Math.sin(angle) * (radius * (value / 100)),
    };
  };

  const pathData =
    stats
      .map((stat, i) => {
        const { x, y } = getCoordinates(stat.norm, i);
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
      })
      .join(' ') + 'Z';

  const bgPath =
    stats
      .map((_, i) => {
        const { x, y } = getCoordinates(100, i);
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
      })
      .join(' ') + 'Z';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* 1. LAYER FONDO: ARTWORK GIGANTE (Recuperado) */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[120%] h-[120%] opacity-[0.07] grayscale mix-blend-overlay">
          <Image
            src={OFFICIAL_ARTWORK}
            alt="Background Asset"
            fill
            className="object-contain scale-110"
          />
        </div>
      </div>

      {/* 2. LAYER DATA: GRÁFICO SVG */}
      <div className="relative w-[300px] h-[300px] z-10">
        <svg width={size} height={size} className="overflow-visible">
          {/* Grid Hexagonal */}
          <path
            d={bgPath}
            fill="none"
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {[25, 50, 75].map((p) => (
            <circle
              key={p}
              cx={center}
              cy={center}
              r={radius * (p / 100)}
              fill="none"
              stroke="#1e293b"
              strokeWidth="0.5"
              strokeOpacity="0.5"
            />
          ))}

          {/* Polígono de Stats */}
          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            d={pathData}
            fill="rgba(56, 189, 248, 0.2)"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Nodos Activos */}
          {stats.map((stat, i) => {
            const isHighlighted =
              highlightStat === 'all' || highlightStat.includes(stat.key);
            const { x, y } = getCoordinates(stat.norm, i);
            const { x: labelX, y: labelY } = getCoordinates(125, i);

            return (
              <g key={stat.key}>
                <line
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="#38BDF8"
                  strokeWidth="1"
                  strokeOpacity="0.1"
                />

                {isHighlighted && (
                  <motion.g
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1 + i * 0.1 }}
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill="#38BDF8"
                      fillOpacity="0.3"
                      className="animate-pulse"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#ffffff"
                      stroke="#38BDF8"
                      strokeWidth="1"
                    />
                  </motion.g>
                )}

                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-[10px] font-mono font-bold ${
                    isHighlighted ? 'fill-brand-cyan' : 'fill-slate-600'
                  }`}
                >
                  {stat.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* 3. LAYER NÚCLEO: SPRITE CENTRAL */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-slate-900/80 backdrop-blur border border-white/10 flex items-center justify-center z-20 shadow-xl">
          <img
            src={SPRITE_ICON}
            alt="icon"
            className="w-12 h-12 object-contain opacity-90"
          />
        </div>
      </div>

      {/* Leyenda */}
      <div className="absolute bottom-4 flex gap-4 z-20">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-brand-cyan" />
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            {highlightStat === 'all'
              ? 'BST OVERVIEW'
              : `Foco: ${highlightStat.toUpperCase().replace('-', ' & ')}`}
          </span>
        </div>
      </div>
    </div>
  );
}
