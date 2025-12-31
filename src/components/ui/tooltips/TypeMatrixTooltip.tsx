'use client';
import { motion } from 'framer-motion';
import TypeBadge from '../TypeBadge';

const TYPES = [
  'normal', 'fire', 'water', 'grass', 'electric', 'ice', 
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 
  'rock', 'ghost', 'dragon', 'steel', 'fairy',
];

const MATRIX_MOCK: Record<string, Record<string, number>> = {
  fire: { grass: 1, water: 2, rock: 2, steel: 1, fire: 2, dragon: 2 },
  water: { fire: 1, ground: 1, rock: 1, water: 2, grass: 2, dragon: 2 },
  // ... resto simplificado para UI
};

const getMultiplier = (attacker: string, defender: string) => {
  const code = MATRIX_MOCK[attacker]?.[defender] ?? 0;
  if (code === 1) return { text: 'x2', color: 'text-green-400' };
  if (code === 2) return { text: '½', color: 'text-red-400' };
  if (code === 3) return { text: '0', color: 'text-slate-600' };
  return { text: '', color: '' };
};

export default function TypeMatrixTooltip({ dict }: { dict: any }) {
  const t = dict.modal.tooltip;

  return (
    <div className="relative group inline-block">
      {/* Trigger */}
      <button className="flex items-center gap-2 px-4 py-2 bg-brand-cyan/10 border border-brand-cyan/30 rounded-lg text-brand-cyan text-sm hover:bg-brand-cyan/20 transition-colors">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-table-2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M3 15h18" />
          <path d="M3 9h18" />
          <path d="M12 21v-6" />
          <path d="M12 9V3" />
          <path d="M3 21a2 2 0 0 1-2-2" />
          <path d="M21 21a2 2 0 0 0 2-2" />
          <path d="M3 3a2 2 0 0 1 2-2" />
          <path d="M21 3a2 2 0 0 0-2 2" />
        </svg>
        {t.open_matrix}
      </button>

      {/* Tooltip Pop-up */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95, pointerEvents: 'none' }}
        whileHover={{ opacity: 1, y: 0, scale: 1, pointerEvents: 'auto' }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="absolute bottom-full left-0 mb-4 w-[600px] p-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 hidden group-hover:block"
      >
        <div className="text-xs text-slate-400 mb-2 text-center font-mono">
          {t.defender_label} →
        </div>
        <div className="grid grid-cols-[auto_repeat(17,_1fr)] gap-1 items-center">
          {/* Header Row */}
          <div className="text-xs text-slate-400 font-mono rotate-180 italic writing-mode-vertical">
            {t.attacker_label}
          </div>
          {TYPES.map((type) => (
            <div key={type} className="scale-75">
              <TypeBadge type={type} showLabel={false} />
            </div>
          ))}

          {/* Matrix Rows */}
          {TYPES.map((attacker) => (
            <>
              <div className="scale-75">
                <TypeBadge type={attacker} showLabel={false} />
              </div>
              {TYPES.map((defender) => {
                const { text, color } = getMultiplier(attacker, defender);
                return (
                  <div
                    key={defender}
                    className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold ${color} bg-white/5 rounded`}
                  >
                    {text}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </motion.div>
    </div>
  );
}