'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, Shield } from 'lucide-react';
import TypeBadge from '@/components/ui/TypeBadge';
import { TYPES, calculateDefense } from '@/lib/typeLogic';

interface TypeCalculatorViewProps {
  dict: any;
}

export default function TypeCalculatorView({ dict }: TypeCalculatorViewProps) {
  const router = useRouter();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  // Hook a textos
  const t = dict.tools.calculator;

  const handleTypeClick = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      if (selectedTypes.length < 2) setSelectedTypes([...selectedTypes, type]);
    }
  };

  const effectiveness =
    selectedTypes.length > 0
      ? calculateDefense(selectedTypes[0], selectedTypes[1])
      : {};

  const grouped = {
    x4: Object.keys(effectiveness).filter((t) => effectiveness[t] === 4),
    x2: Object.keys(effectiveness).filter((t) => effectiveness[t] === 2),
    x05: Object.keys(effectiveness).filter((t) => effectiveness[t] === 0.5),
    x025: Object.keys(effectiveness).filter((t) => effectiveness[t] === 0.25),
    x0: Object.keys(effectiveness).filter((t) => effectiveness[t] === 0),
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors px-4 py-2 border border-transparent hover:border-cyan-500/30 rounded-lg group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-mono text-sm uppercase tracking-widest">
            {t.back_module} {/* I18N */}
          </span>
        </button>
        <div className="flex items-center gap-3">
          <Shield className="text-cyan-500" />
          <h1 className="text-2xl font-display font-bold text-white">
            {t.title} {/* I18N */}
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-mono text-slate-400 uppercase tracking-widest">
                {t.select_types} ({selectedTypes.length}/2) {/* I18N */}
              </h2>
              {selectedTypes.length > 0 && (
                <button
                  onClick={() => setSelectedTypes([])}
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <RefreshCw size={16} className="text-slate-500" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {TYPES.map((type) => {
                const isSelected = selectedTypes.includes(type);
                const isDisabled = !isSelected && selectedTypes.length >= 2;
                return (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTypeClick(type)}
                    className={`transition-opacity ${
                      isDisabled ? 'opacity-40 grayscale' : 'opacity-100 grayscale-0'
                    }`}
                    disabled={isDisabled}
                  >
                    <div
                      className={`transform transition-all ${
                        isSelected
                          ? 'scale-110 ring-2 ring-cyan-500 rounded-full'
                          : ''
                      }`}
                    >
                      <TypeBadge type={type} showLabel={false} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center items-center h-40 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
            {selectedTypes.length === 0 ? (
              <span className="text-slate-600 font-mono text-xs">
                {t.waiting_data} {/* I18N */}
              </span>
            ) : (
              <div className="flex items-center gap-4">
                {selectedTypes.map((t) => (
                  <div key={t} className="scale-150">
                    <TypeBadge type={t} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7">
          {selectedTypes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <Shield size={64} className="mb-4 text-slate-500" />
              <p className="font-mono text-sm text-slate-400">
                {t.select_prompt} {/* I18N */}
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {grouped.x4.length > 0 && (
                <ResultRow
                  title={t.threat_x4} // I18N
                  types={grouped.x4}
                  color="bg-red-500"
                />
              )}
              {grouped.x2.length > 0 && (
                <ResultRow
                  title={t.weak_x2} // I18N
                  types={grouped.x2}
                  color="bg-orange-500"
                />
              )}

              <div className="h-px bg-slate-800 my-4" />

              {grouped.x05.length > 0 && (
                <ResultRow
                  title={t.resist_x05} // I18N
                  types={grouped.x05}
                  color="bg-green-500"
                />
              )}
              {grouped.x025.length > 0 && (
                <ResultRow
                  title={t.resist_x025} // I18N
                  types={grouped.x025}
                  color="bg-emerald-400"
                />
              )}
              {grouped.x0.length > 0 && (
                <ResultRow
                  title={t.immune_x0} // I18N
                  types={grouped.x0}
                  color="bg-slate-100"
                  textColor="text-slate-900"
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ResultRow({ title, types, color, textColor = 'text-white' }: any) {
  return (
    <div className="bg-slate-900 border border-white/5 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-2 h-2 rounded-full ${color} animate-pulse`} />
        <h3
          className={`text-xs font-bold ${color.replace(
            'bg-',
            'text-'
          )} uppercase tracking-widest`}
        >
          {title}
        </h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {types.map((t: string) => (
          <div key={t} className="scale-110">
            <TypeBadge type={t} />
          </div>
        ))}
      </div>
    </div>
  );
}