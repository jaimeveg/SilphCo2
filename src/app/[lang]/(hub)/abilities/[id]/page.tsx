import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IAbilityDetail, AbilityCompetitiveTier } from '@/types/abilitydex';
import { promises as fs } from 'fs';
import path from 'path';
import { Sparkles, Users, Shield, Eye, BookOpen, Trophy, TrendingUp } from 'lucide-react';
import AbilityNavButtons from './AbilityNavButtons';

// ── Competitive Tier Helpers ──────────────────────────────────────────────────
const TIER_CONFIG: Record<NonNullable<AbilityCompetitiveTier>, { label: string; color: string; bg: string; border: string; desc: string }> = {
    'S': { label: 'S', color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/50', desc: 'Dominant across VGC top play' },
    'A': { label: 'A', color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/50', desc: 'Highly popular in VGC formats' },
    'B': { label: 'B', color: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/50', desc: 'Solid competitive presence' },
    'C': { label: 'C', color: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/60', desc: 'Occasional VGC usage' },
    'D': { label: 'D', color: 'text-slate-400', bg: 'bg-slate-600/20', border: 'border-slate-600/60', desc: 'Very niche in VGC' },
    'Niche': { label: 'N', color: 'text-slate-600', bg: 'bg-slate-900/40', border: 'border-slate-800', desc: 'Rarely seen in VGC' },
};
type Props = {
  params: {
    lang: string;
    id: string;
  };
};

export async function generateStaticParams() {
  const indexFile = path.join(process.cwd(), 'public', 'data', 'abilitydex_index.json');
  try {
    const raw = await fs.readFile(indexFile, 'utf-8');
    const items = JSON.parse(raw);
    return items.map((item: any) => ({ id: item.id }));
  } catch { return []; }
}

async function getAbilityData(id: string): Promise<IAbilityDetail | null> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'abilities', `ability_${id}.json`);
    const rawData = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(rawData);
  } catch { return null; }
}

const formatName = (slug: string) =>
  slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export default async function AbilityDetailPage({ params }: Props) {
  const { id, lang } = params;
  const ability = await getAbilityData(id);

  if (!ability) {
    return (
      <div className="min-h-screen bg-[#0B101B] flex flex-col items-center justify-center p-4">
        <Sparkles className="w-12 h-12 text-slate-700 opacity-50 mb-3 animate-pulse" />
        <h1 className="text-xl font-mono uppercase tracking-widest text-slate-400 mb-4">ABILITY_NOT_FOUND</h1>
        <AbilityNavButtons lang={lang} />
      </div>
    );
  }

  const totalLearners = ability.learners.slot_1.length + ability.learners.slot_2.length + ability.learners.hidden.length;

  const LearnerSection = ({
    title,
    icon,
    learners,
    accentColor,
    borderColor
  }: {
    title: string;
    icon: React.ReactNode;
    learners: typeof ability.learners.slot_1;
    accentColor: string;
    borderColor: string;
  }) => {
    if (learners.length === 0) return null;
    return (
      <div className={`bg-slate-900/60 backdrop-blur-sm border rounded-xl p-4 ${borderColor}`}>
        <h3 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-4 pb-2 border-b border-slate-800 ${accentColor}`}>
          {icon}
          {title} ({learners.length})
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {learners.map((learner) => {
            return (
              <Link
                key={learner.pokemon_id}
                href={`/${lang}/pokedex/${learner.pokemon_id}`}
                className="group flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-950/60 border border-slate-800/50 hover:border-cyan-500/50 hover:bg-slate-800/60 transition-all duration-200"
              >
                <div className="relative w-10 h-10">
                  <img
                    src={`/images/pokemon/high-res/${learner.pokemon_id}.png`}
                    alt={learner.pokemon_id}
                    className="w-full h-full object-contain pixelated group-hover:scale-110 transition-transform"
                    loading="lazy"
                  />
                </div>
                <span className="text-[8px] font-mono text-slate-500 group-hover:text-slate-300 capitalize truncate w-full text-center transition-colors">
                  {formatName(learner.pokemon_name)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B101B] relative pb-20">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E293B_1px,transparent_1px),linear-gradient(to_bottom,#1E293B_1px,transparent_1px)] opacity-20 bg-[size:40px_40px] pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">

        <AbilityNavButtons lang={lang} />

        {/* Hero Card */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 md:p-8 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <Sparkles size={28} className="text-purple-400" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-black text-white tracking-tighter uppercase">
                    {formatName(ability.name)}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded tracking-widest uppercase">
                      GEN {ability.generation}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest flex items-center gap-1">
                      <Users size={10} /> {totalLearners} Pokémon
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Flavor Text */}
            {ability.flavor_text && (
              <div className="border-l-2 border-purple-500 pl-4 mb-4">
                <p className="text-slate-400 font-mono text-[11px] leading-relaxed uppercase tracking-wide italic">
                  &quot;{ability.flavor_text}&quot;
                </p>
              </div>
            )}

            {/* Competitive Intelligence Block */}
            {ability.competitive && (() => {
              const tier = ability.competitive.tier;
              const cfg = tier ? TIER_CONFIG[tier] : null;
              const usagePct = Math.round(ability.competitive.normalized_score * 100);
              const rawPct = (ability.competitive.usage_rate * 100).toFixed(2);
              return (
                <div className={`rounded-xl border p-4 mb-4 ${cfg?.border ?? 'border-slate-800'} ${cfg?.bg ?? 'bg-slate-900/30'}`}>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Trophy size={14} className={cfg?.color ?? 'text-slate-500'} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">VGC COMPETITIVE IMPACT</span>
                      <span className="text-[8px] font-mono text-slate-600 uppercase">{ability.competitive.format}</span>
                    </div>
                    {cfg && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                        <span className={`text-lg font-display font-black leading-none ${cfg.color}`}>{cfg.label}</span>
                        <span className={`text-[9px] font-mono ${cfg.color} opacity-70`}>TIER</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><TrendingUp size={9} /> VGC USAGE SCORE</span>
                      <span className={cfg?.color}>{usagePct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${tier === 'S' ? 'bg-amber-500/60' : tier === 'A' ? 'bg-emerald-500/60' : tier === 'B' ? 'bg-cyan-500/60' : tier === 'C' ? 'bg-blue-500/60' : 'bg-slate-600/60'}`}
                        style={{ width: `${Math.max(usagePct, 2)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-mono text-slate-600">
                      <span>{cfg?.desc}</span>
                      <span>{ability.competitive.carrier_count} carriers &middot; {rawPct}% raw rate</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Effect Text */}
            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
              <h3 className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <BookOpen size={10} /> MECHANIC DETAILS
              </h3>
              <p className="text-slate-200 text-sm leading-relaxed">
                {ability.effect_text}
              </p>
            </div>
          </div>
        </div>

        {/* Learners Matrix */}
        <div className="space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
            <Users size={14} className="text-purple-400" /> POKÉMON CARRIERS
          </h2>

          <LearnerSection
            title="PRIMARY ABILITY (SLOT 1)"
            icon={<Shield size={12} className="text-emerald-400" />}
            learners={ability.learners.slot_1}
            accentColor="text-emerald-400"
            borderColor="border-slate-800"
          />

          <LearnerSection
            title="SECONDARY ABILITY (SLOT 2)"
            icon={<Eye size={12} className="text-cyan-400" />}
            learners={ability.learners.slot_2}
            accentColor="text-cyan-400"
            borderColor="border-slate-800"
          />

          <LearnerSection
            title="HIDDEN ABILITY"
            icon={<Sparkles size={12} className="text-amber-400" />}
            learners={ability.learners.hidden}
            accentColor="text-amber-400"
            borderColor="border-amber-500/30"
          />
        </div>

      </div>
    </div>
  );
}
