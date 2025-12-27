'use client';
import { motion } from 'framer-motion';

const STATS_CONFIG = [
  { id: 'hp', label: 'HP', angle: 0 },
  { id: 'atk', label: 'ATK', angle: 60 },
  { id: 'def', label: 'DEF', angle: 120 },
  { id: 'spe', label: 'SPEED', angle: 180 },
  { id: 'spd', label: 'SP.DEF', angle: 240 },
  { id: 'spa', label: 'SP.ATK', angle: 300 },
];

const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

interface StatRadarChartProps {
  stats: Record<string, number>;
  highlightStat?: string;
  scrollProgress: any;
}

export default function StatRadarChart({
  stats,
  highlightStat,
}: StatRadarChartProps) {
  const size = 360; // Tamaño aumentado
  const center = size / 2;
  const radius = size / 2 - 50; // Más margen para las etiquetas grandes

  const levels = [0.25, 0.5, 0.75, 1];

  const gridPaths = levels.map((level) => {
    const points = STATS_CONFIG.map((stat) => {
      const { x, y } = polarToCartesian(
        center,
        center,
        radius * level,
        stat.angle
      );
      return `${x},${y}`;
    }).join(' ');
    return (
      <polygon
        key={level}
        points={points}
        fill="none"
        stroke="#334155"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.5"
      />
    );
  });

  const dataPoints = STATS_CONFIG.map((stat) => {
    const value = Math.min((stats[stat.id] || 0) / 255, 1);
    const { x, y } = polarToCartesian(
      center,
      center,
      radius * value,
      stat.angle
    );
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible max-w-[500px]"
      >
        {/* Grid */}
        <g>{gridPaths}</g>

        {/* Ejes */}
        {STATS_CONFIG.map((stat) => {
          const { x, y } = polarToCartesian(center, center, radius, stat.angle);
          return (
            <line
              key={stat.id}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#334155"
              strokeWidth="1"
            />
          );
        })}

        {/* Datos */}
        <motion.polygon
          points={dataPoints}
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          style={{ originX: '50%', originY: '50%' }}
          fill="rgba(56, 189, 248, 0.3)"
          stroke="#38BDF8"
          strokeWidth="3"
          className="drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]"
        />

        {/* Etiquetas y Highlight */}
        {STATS_CONFIG.map((stat) => {
          // Posición de la etiqueta un poco más lejos del radio
          const { x, y } = polarToCartesian(
            center,
            center,
            radius + 35,
            stat.angle
          );
          const isHighlighted =
            stat.id === highlightStat || highlightStat === 'all';

          return (
            <g key={stat.label} transform={`translate(${x}, ${y})`}>
              {/* Highlight Dot: Ahora posicionado justo encima del texto */}
              {isHighlighted && (
                <motion.circle
                  r="4"
                  fill="#10B981"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  cx="0"
                  cy="-12" // Fijo encima del texto, sin cálculos raros
                />
              )}

              <text
                x={0}
                y={0}
                dy={4}
                textAnchor="middle"
                className={`
                  text-xs md:text-sm font-mono font-bold tracking-wider 
                  ${
                    isHighlighted
                      ? 'fill-brand-cyan drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                      : 'fill-slate-500'
                  }
                `}
              >
                {stat.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
