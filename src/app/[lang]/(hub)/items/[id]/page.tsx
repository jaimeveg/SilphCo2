import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IItemDetail, IItemUser } from '@/types/items';
import { promises as fs } from 'fs';
import path from 'path';
import { getDictionary } from '@/i18n/get-dictionary';
import { Activity, Beaker, ShieldAlert, Cpu, Hexagon, Biohazard, Zap, Square } from 'lucide-react';
import ItemStatCalculator from '@/components/items/ItemStatCalculator';
import PokemonAvatar from '@/components/items/PokemonAvatar';
import aliasMapJson from '@/../public/data/alias_map.json';
import pokedexBaseStatsJson from '@/../public/data/pokedex_base_stats.json';
import ItemNavButtons from './ItemNavButtons';

const aliasMap: Record<string, number> = aliasMapJson;
const pokedexBaseStats: Record<string, any> = pokedexBaseStatsJson;

// Types
type Props = {
  params: {
    lang: string;
    id: string;
  };
};

export async function generateStaticParams() {
  const indexFile = path.join(process.cwd(), 'public', 'data', 'itemdex_index.json');
  try {
    const raw = await fs.readFile(indexFile, 'utf-8');
    const items = JSON.parse(raw);
    return items.map((item: any) => ({
      id: item.id,
    }));
  } catch (error) {
    return [];
  }
}

async function getItemData(id: string): Promise<IItemDetail | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'items', `item_${id}.json`);
    const rawData = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    return null;
  }
}

async function getAliasMap(): Promise<Record<string, number>> {
  try {
    const aliasPath = path.join(process.cwd(), 'public', 'data', 'alias_map.json');
    const rawAlias = await fs.readFile(aliasPath, 'utf-8');
    return JSON.parse(rawAlias);
  } catch (e) {
    return {};
  }
}

function StatBadge({ label, value, boostType, isHp, effectType, itemId }: { label: string; value: number; boostType?: string; isHp: boolean; effectType?: string; itemId?: string }) {
  if ((!value || value === 0)) return null; // Avoid rendering empty stats unless explicitly injected

  if (itemId === 'life-orb' && isHp) {
    boostType = 'stage';
    effectType = 'reduces';
  }

  let displayValue = '';
  let isPositive = true;
  if (effectType === 'reduces') isPositive = false;
  let isRaw = boostType === 'raw';
  let isStage = boostType === 'stage';
  if (!isPositive) value = -value;

  if (isHp) {
    if (isRaw) {
      displayValue = `${value} Flat`;
    } else {
      displayValue = `${value}%`;
    }
  } else if (label === 'Power' || label === 'M.Acc') {
    displayValue = `${value}%`;
  } else if (isStage) {
    displayValue = `${value} Lvl`;
  } else {
    if (Math.abs(value) > 3) {
      displayValue = `${value}% (x${1 + value / 100})`;
    } else {
      displayValue = `x${value}`;
    }
  }

  const colorClass = isPositive
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : 'bg-rose-500/10 text-rose-400 border-rose-500/30';

  return (
    <span className={`px-2.5 py-1 rounded-md border font-mono text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm ${colorClass}`}>
      <span className="opacity-70">{label}</span>
      <span className="font-bold">{displayValue}</span>
    </span>
  );
}

export default async function ItemDetailPage({ params }: Props) {
  const { id, lang } = params;

  // Fetch everything concurrently for speed
  const [item, dict, aliasMap] = await Promise.all([
    getItemData(id),
    getDictionary(lang as any),
    getAliasMap()
  ]);

  if (!item) {
    return (
      <div className="min-h-screen bg-[#0B101B] flex flex-col items-center justify-center p-4">
        <Activity className="w-12 h-12 text-slate-700 opacity-50 mb-3 animate-pulse" />
        <h1 className="text-xl font-mono uppercase tracking-widest text-slate-400 mb-4">ITEM_NOT_FOUND</h1>
        <ItemNavButtons lang={lang} backText={dict?.itemdex?.detail?.back || 'Back'} />
      </div>
    );
  }

  const defaultDict = {
    back: 'BACK',
    mechanics: 'MECHANICS & EFFECT',
    competitive_metrics: 'COMPETITIVE METRICS',
    top_users: 'TOP USERS OF THIS ITEM (>5% USAGE)',
    top_users_empty: 'USAGE DATA UNAVAILABLE OR INSIGNIFICANT',
    stat_modifier: "STAT MODIFIER",
    stage_modifier: "STAGE MULTIPLIER",
    hp_recovery: "HP RECOVERY"
  };

  const t = dict.itemdex?.detail || defaultDict;

  const renderMechanics = (mechanics: any[] | undefined) => {
    if (!mechanics || !Array.isArray(mechanics) || mechanics.length === 0) return <p className="text-slate-600 font-mono text-xs italic">NO_MODIFIERS_DETECTED</p>;

    return mechanics.map((mod, idx) => {
      const boostType = mod.boost;
      const effectType = mod.effect_type;

      const modifiesStats = (boostType === 'stage' || boostType === 'raw') && ['atk', 'def', 'spa', 'spd', 'spe', 'acc', 'eva'].some(k => (mod as any)[k] !== undefined && (mod as any)[k] !== 0);
      const modifiesMoves = mod.power !== undefined || mod.move_acc !== undefined;

      return (
        <div key={idx} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <StatBadge label="HP" value={mod.hp} boostType={boostType} isHp={true} effectType={effectType} itemId={id} />
            <StatBadge label="Atk" value={mod.atk} boostType={boostType} isHp={false} effectType={effectType} />
            <StatBadge label="Def" value={mod.def} boostType={boostType} isHp={false} effectType={effectType} />
            <StatBadge label="SpA" value={mod.spa} boostType={boostType} isHp={false} effectType={effectType} />
            <StatBadge label="SpD" value={mod.spd} boostType={boostType} isHp={false} effectType={effectType} />
            <StatBadge label="Spe" value={mod.spe} boostType={boostType} isHp={false} effectType={effectType} />
            <StatBadge label="Acc" value={mod.acc} boostType={boostType} isHp={false} effectType={effectType} />
            <StatBadge label="Eva" value={mod.eva} boostType={boostType} isHp={false} effectType={effectType} />
            <StatBadge label="Prio" value={mod.priority} boostType={boostType} isHp={false} effectType={effectType} />
            <StatBadge label="Crit" value={mod.crit} boostType={boostType} isHp={false} effectType={effectType} />
            <StatBadge label="Power" value={mod.power} boostType={boostType} isHp={false} effectType={effectType} />
            <StatBadge label="M.Acc" value={mod.move_acc} boostType={boostType} isHp={false} effectType={effectType} />
          </div>

          <div className="flex flex-wrap gap-2">

            {mod.use && (
              <span className={`text-[9px] font-mono uppercase flex items-center gap-1 px-2 py-0.5 rounded border ${mod.use === 'single' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'}`}>
                {mod.use === 'single' ? <Zap size={10} /> : <Square size={10} />}
                {mod.use === 'single' ? 'Consumable' : 'Permanent'}
              </span>
            )}

            {mod.condition_holder && mod.condition_holder !== "none" && (
              <span className="text-[9px] font-mono text-amber-400 uppercase flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                <ShieldAlert size={10} />
                Trigger/Condition: {mod.condition_holder.replace(/-/g, ' ')}
              </span>
            )}

            {modifiesStats && (
              <span className="text-[9px] font-mono text-slate-400 uppercase flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">
                {boostType === 'stage' ? <Beaker size={10} className="text-cyan-500" /> : <Cpu size={10} className="text-purple-500" />}
                {boostType === 'stage' ? t.stage_modifier : t.stat_modifier}
              </span>
            )}

            {modifiesMoves && (
              <span className="text-[9px] font-mono text-slate-400 uppercase flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700">
                <Activity size={10} className="text-rose-500" />
                MOVE MODIFIER
              </span>
            )}

            {mod.affects && (
              <span className={`text-[9px] font-mono uppercase flex items-center gap-1 px-2 py-0.5 rounded border ${mod.affects === 'self' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'}`}>
                Target: {mod.affects}
              </span>
            )}

            {mod.type_related && mod.type_related.length > 0 && (
              <span className="text-[9px] font-mono text-fuchsia-400 uppercase flex items-center gap-1 bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/30">
                <Hexagon size={10} />
                Type related: {mod.type_related.join(', ')}
              </span>
            )}

            {mod.status && (
              <span className={`text-[9px] font-mono uppercase flex items-center gap-1 px-2 py-0.5 rounded border ${mod.mode === 'cure' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-orange-400 bg-orange-500/10 border-orange-500/30'}`}>
                <Biohazard size={10} />
                {mod.mode === 'cure' ? 'Cures:' : 'Inflicts:'} {mod.status}
              </span>
            )}

            {mod.immunity && mod.immunity.length > 0 && (
              <span className="text-[9px] font-mono text-teal-400 uppercase flex items-center gap-1 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
                Immunity: {mod.immunity.join(', ')}
              </span>
            )}
          </div>
        </div>
      );
    });
  };

  const hasValidCalculatorStats = item.mechanics && item.mechanics.length > 0 &&
    item.mechanics[0].boost !== 'stage' &&
    ['atk', 'def', 'spa', 'spd', 'spe'].some(k => (item.mechanics[0] as any)[k] && (item.mechanics[0] as any)[k] !== 0);

  return (
    <div className="min-h-screen bg-[#0B101B] relative pb-20">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B_1px,transparent_1px),linear-gradient(to_bottom,#1E293B_1px,transparent_1px)] opacity-20 bg-[size:40px_40px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">

        <ItemNavButtons lang={lang} backText={t.back} />

        <div className="flex flex-col lg:flex-row gap-8 items-start mb-12">

          {/* LEFT COLUMN: Main Info */}
          <div className="flex-1 w-full min-w-0">

            {/* Hero DOSSIER */}
            <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-900/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col sm:flex-row gap-8 items-start">

                {/* Image Box */}
                <div className="shrink-0 w-full sm:w-40 h-40 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center relative group">
                  <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-600 uppercase">SYS_IMG_01</div>
                  <div className="relative w-full h-full">
                    <Image
                      src={item.sprites.high_res || item.sprites.low_res || '/images/items/sprites/unknown.png'}
                      alt={item.name}
                      fill
                      className="object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.15)] group-hover:scale-110 transition-transform duration-500 pixelated"
                    />
                  </div>
                </div>

                {/* Core Data */}
                <div className="flex-1 w-full flex flex-col">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold font-mono rounded border border-cyan-500/30 uppercase tracking-widest">
                      ID: {item.id}
                    </span>
                    {item.categories && item.categories.map((cat: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded border border-slate-700 uppercase tracking-widest">
                        {cat.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-4 uppercase tracking-tight">
                    {item.name.replace(/-/g, ' ')}
                  </h1>

                  <div className="bg-slate-950/80 rounded-lg p-3 md:p-4 border border-slate-800 mb-6 relative">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0"></div>
                    <h3 className="text-cyan-500 text-[9px] font-mono tracking-widest uppercase mb-1.5">
                      {t.mechanics}
                    </h3>
                    <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                      {item.effect}
                    </p>
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                      {renderMechanics(item.mechanics)}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Top Users (Appears strictly below Dossier details, on the left) */}
            {item.categories && item.categories.some((c: string) => ['competitive', 'berries', 'berry'].includes(c.toLowerCase())) && (
              <div className="w-full mt-12">
                <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-3 uppercase tracking-wide">
                  <Activity className="w-5 h-5 text-cyan-500" />
                  {t.competitive_metrics}
                </h2>
                <p className="text-[10px] font-mono text-slate-500 mb-4">{t.top_users}</p>

                {item.best_users && item.best_users.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {item.best_users.slice(0, 20).map((user: IItemUser, idx: number) => {
                      let numericId: string | number = user.pokemon_id;
                      let pokemonName = user.pokemon_id;

                      if (!isNaN(Number(numericId))) {
                        const pkmnInfo = pokedexBaseStats[numericId];
                        if (pkmnInfo && pkmnInfo.name) {
                          pokemonName = pkmnInfo.name;
                        }
                      } else {
                        const pokeIdSlug = user.pokemon_id.toLowerCase().replace(/[\s\.]/g, '-');
                        numericId = aliasMap[pokeIdSlug] || user.pokemon_id;
                      }

                      const displayName = pokemonName.split('-').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                      const slug = pokemonName.toLowerCase().replace(/[\s\.]/g, '-');

                      return (
                        <Link href={`/${lang}/pokedex/${slug}`} key={`${user.pokemon_id}-${user.format}-${idx}`} className="bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-lg p-3 flex items-center gap-3 hover:border-cyan-500/30 transition-colors group relative overflow-hidden">

                          <div
                            className="absolute inset-y-0 left-0 bg-cyan-500/5 z-0"
                            style={{ width: `${Math.min(user.usage_rate, 100)}%` }}
                          ></div>

                          <div className="w-10 h-10 relative z-10 shrink-0 flex items-center justify-center filter drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                            <PokemonAvatar numericId={String(numericId)} alt={String(displayName)} />
                          </div>

                          <div className="relative z-10 flex-1 min-w-0">
                            <h4 className="font-bold text-[11px] text-slate-200 capitalize truncate font-mono tracking-tight group-hover:text-cyan-400 transition-colors">{displayName}</h4>
                            <div className="flex justify-between items-end mt-0.5">
                              <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">{user.format}</span>
                              <span className="text-cyan-400 font-bold text-[10px]">{user.usage_rate}%</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-xl p-8 justify-center items-center flex flex-col">
                    <p className="text-slate-500 font-mono text-xs uppercase">{t.top_users_empty}</p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Floating Calculator */}
          {hasValidCalculatorStats && (
            <div className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-8 mt-8 lg:mt-0">
              <ItemStatCalculator item={item} lang={lang as import('@/lib/pokedexDictionary').Lang} t={dict.itemdex?.calculator} />
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
