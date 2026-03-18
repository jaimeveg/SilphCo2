'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { IAbilityIndex, AbilityCompetitiveTier } from '@/types/abilitydex';
import { Search, Zap, ChevronDown, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Competitive Tier Badge ────────────────────────────────────────────────────
const TIER_CONFIG: Record<NonNullable<AbilityCompetitiveTier>, { label: string; className: string }> = {
    'S': { label: 'S', className: 'bg-amber-500/20 text-amber-300 border-amber-500/50' },
    'A': { label: 'A', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' },
    'B': { label: 'B', className: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' },
    'C': { label: 'C', className: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
    'D': { label: 'D', className: 'bg-slate-600/40 text-slate-400 border-slate-600/60' },
    'Niche': { label: '—', className: 'bg-slate-900/40 text-slate-600 border-slate-800/60' },
};

function TierBadge({ tier }: { tier: AbilityCompetitiveTier }) {
    if (!tier || tier === 'Niche') return null;
    const cfg = TIER_CONFIG[tier];
    return (
        <span className={cn(
            'shrink-0 text-[9px] font-display font-black border rounded px-1.5 py-0.5 tracking-widest leading-tight',
            cfg.className
        )}>
            {cfg.label}
        </span>
    );
}

const TIER_VALUE: Record<string, number> = {
    'S': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'Niche': 1
};

export default function AbilityDexIndex({ params }: { params: { lang: string } }) {
    const lang = params.lang || 'en';
    const [abilities, setAbilities] = useState<IAbilityIndex[]>([]);
    const [search, setSearch] = useState('');
    const [genFilter, setGenFilter] = useState('');
    const [tierFilter, setTierFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('tier_desc');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/data/abilitydex_index.json')
            .then(res => res.json())
            .then((data: IAbilityIndex[]) => setAbilities(data))
            .catch(e => console.error('Error loading AbilityDex Index', e))
            .finally(() => setLoading(false));
    }, []);

    const filteredAbilities = useMemo(() => {
        let filtered = abilities.filter(a => {
            const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                a.short_effect.toLowerCase().includes(search.toLowerCase());
            const matchGen = genFilter ? a.generation === parseInt(genFilter) : true;
            const matchTier = tierFilter ? a.competitive_tier === tierFilter : true;
            return matchSearch && matchGen && matchTier;
        });

        filtered.sort((a, b) => {
            if (sortOrder === 'tier_desc' || sortOrder === 'tier_asc') {
                const valA = a.competitive_tier ? TIER_VALUE[a.competitive_tier] || 0 : 0;
                const valB = b.competitive_tier ? TIER_VALUE[b.competitive_tier] || 0 : 0;
                if (valA !== valB) {
                    return sortOrder === 'tier_desc' ? valB - valA : valA - valB;
                }
            }
            // fallback to name A-Z
            return a.name.localeCompare(b.name);
        });

        return filtered;
    }, [abilities, search, genFilter, tierFilter, sortOrder]);

    const allGens = useMemo(() =>
        Array.from(new Set(abilities.map(a => a.generation))).sort((a, b) => a - b),
        [abilities]
    );

    const formatName = (slug: string) => slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-6 pt-0 md:pt-0 space-y-6 animate-in fade-in zoom-in-95 duration-500">

            {/* Sticky Ceiling */}
            <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-3xl border-b border-slate-800/80 -mx-4 md:-mx-6 px-4 md:px-6 pt-16 pb-4 shadow-2xl">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col xl:flex-row justify-between gap-4 items-center">
                    <div className="flex items-center gap-4 z-10 w-full xl:w-auto">
                        <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                            <Sparkles size={22} className="text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-tighter uppercase">
                                TACTICAL <span className="text-cyan-400">ABILITYDEX</span>
                            </h1>
                            <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                                {filteredAbilities.length} records indexed
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto z-10">
                        {/* Search */}
                        <div className="relative group flex-1">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="SEARCH ABILITY OR EFFECT..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 rounded-lg py-2.5 pl-9 pr-4 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                            />
                        </div>

                        {/* Generation Filter */}
                        <div className="relative">
                            <select
                                value={genFilter}
                                onChange={(e) => setGenFilter(e.target.value)}
                                className="appearance-none bg-slate-900/80 border border-slate-800 text-xs font-mono uppercase text-slate-300 rounded-lg py-2.5 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all cursor-pointer"
                            >
                                <option value="">ALL GENS</option>
                                {allGens.map(g => (
                                    <option key={g} value={g}>GEN {g}</option>
                                ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>

                        {/* VGC Tier Filter */}
                        <div className="relative">
                            <select
                                value={tierFilter}
                                onChange={(e) => setTierFilter(e.target.value)}
                                className="appearance-none bg-slate-900/80 border border-slate-800 text-xs font-mono uppercase text-slate-300 rounded-lg py-2.5 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all cursor-pointer"
                            >
                                <option value="">ALL TIERS</option>
                                <option value="S">VGC S-TIER</option>
                                <option value="A">VGC A-TIER</option>
                                <option value="B">VGC B-TIER</option>
                                <option value="C">VGC C-TIER</option>
                                <option value="D">VGC D-TIER</option>
                                <option value="Niche">NICHE</option>
                            </select>
                            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>

                        {/* Sort Order */}
                        <div className="relative">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="appearance-none bg-slate-900/80 border border-slate-800 text-xs font-mono uppercase text-slate-300 rounded-lg py-2.5 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all cursor-pointer"
                            >
                                <option value="tier_desc">TIER: HIGH TO LOW</option>
                                <option value="tier_asc">TIER: LOW TO HIGH</option>
                                <option value="name_asc">A-Z</option>
                            </select>
                            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center flex-col gap-3 items-center py-20">
                    <div className="w-8 h-8 border-2 border-slate-800 border-t-cyan-500 rounded-full animate-spin" />
                    <span className="text-cyan-400 font-mono text-xs animate-pulse uppercase tracking-widest">SYNCING DATABANK...</span>
                </div>
            )}

            {/* Grid */}
            {!loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredAbilities.map(ability => (
                        <Link
                            href={`/${lang}/abilities/${ability.id}`}
                            key={ability.id}
                            className="group bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 hover:border-cyan-500/50 hover:bg-slate-800/60 rounded-xl p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.1)] relative overflow-hidden flex flex-col gap-2"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-start justify-between gap-2">
                                <h3 className="text-sm font-bold text-slate-200 group-hover:text-cyan-300 transition-colors capitalize leading-tight">
                                    {formatName(ability.name)}
                                </h3>
                                <div className="flex items-center gap-1 shrink-0">
                                    <TierBadge tier={ability.competitive_tier} />
                                    <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded tracking-widest">
                                        GEN {ability.generation}
                                    </span>
                                </div>
                            </div>

                            <p className="text-[11px] font-mono text-slate-500 leading-relaxed line-clamp-2">
                                {ability.short_effect}
                            </p>
                        </Link>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredAbilities.length === 0 && (
                <div className="w-full py-20 flex flex-col items-center justify-center text-slate-600 border border-slate-800 border-dashed rounded-xl bg-slate-900/20">
                    <Zap size={48} className="mb-4 opacity-50" />
                    <p className="font-mono text-sm uppercase tracking-widest">No Abilities Match Your Search</p>
                </div>
            )}
        </div>
    );
}
