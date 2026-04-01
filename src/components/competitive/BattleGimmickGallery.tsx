'use client';

import { useState, useRef, useEffect } from 'react';
import { IGimmickStats } from '@/types/competitive';
import { Gem, Diamond, LoaderCircle, FilterX, ChevronDown, ChevronRight } from 'lucide-react';
import TypeBadge from '@/components/ui/TypeBadge';
import { POKEDEX_DICTIONARY, Lang } from '@/lib/pokedexDictionary';

interface BattleGimmickProps {
    gimmicks?: IGimmickStats;
    lang: string;
}

type GimmickTab = 'teras' | 'z_moves' | 'megas';

export default function BattleGimmickGallery({ gimmicks, lang }: BattleGimmickProps) {
    // ⚠️ CRITICAL: ALL hooks MUST be declared unconditionally BEFORE any early return.
    // Violating this rule crashes the entire React tree when switching between formats
    // with gimmicks (Gen 6+) and without (Gen 1-5). See React "Rules of Hooks".
    const getInitialTab = (): GimmickTab => {
        if (gimmicks?.teras) return 'teras';
        if (gimmicks?.megas) return 'megas';
        return 'z_moves';
    };

    const [activeTab, setActiveTab] = useState<GimmickTab>(getInitialTab());
    const [selectedTera, setSelectedTera] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Reset state when gimmicks data changes (user switched format)
    // Include total_usage values for a unique key per dataset
    const gimmickKey = gimmicks
        ? `${gimmicks.teras?.total_usage || 0}_${gimmicks.megas?.total_usage || 0}_${gimmicks.z_moves?.total_usage || 0}`
        : '';
    useEffect(() => {
        setSelectedTera(null);
        setIsDropdownOpen(false);
        // Re-evaluate the correct initial tab for the new data
        if (gimmicks?.teras) setActiveTab('teras');
        else if (gimmicks?.megas) setActiveTab('megas');
        else if (gimmicks?.z_moves) setActiveTab('z_moves');
    }, [gimmickKey]);

    // Safe early return — AFTER all hooks have been called
    if (!gimmicks || Object.keys(gimmicks).length === 0) return null;

    const tabs: Array<{ id: GimmickTab; label: string; icon: any }> = [];
    if (gimmicks.teras) tabs.push({ id: 'teras', label: 'Terastallization', icon: Gem });
    if (gimmicks.megas) tabs.push({ id: 'megas', label: 'Mega Evolution', icon: LoaderCircle });
    if (gimmicks.z_moves) tabs.push({ id: 'z_moves', label: 'Z-Moves', icon: Diamond });

    // Handle stale tab state if data changes
    if (!gimmicks[activeTab]) {
        setActiveTab(tabs[0].id);
    }

    const activeTabData = tabs.find(t => t.id === activeTab) || tabs[0];
    const ActiveIcon = activeTabData.icon;

    const formatUsage = (val: number) => `${val.toFixed(1)}%`;
    const formatCount = (val: number) => Math.round(val).toLocaleString();

    const translateType = (typeRaw: string): string => {
        const l = (lang as Lang) || 'es';
        // @ts-ignore
        return POKEDEX_DICTIONARY[l].types[typeRaw.toLowerCase()] || typeRaw.toUpperCase();
    };

    // Filter Top Tera Users dynamically
    const filteredTeraUsers = activeTab === 'teras' && gimmicks.teras
        ? (selectedTera
            ? gimmicks.teras.top_pkm.filter(p => p.tera_type === selectedTera)
            : gimmicks.teras.top_pkm).slice(0, 6)
        : [];

    return (
        <div className="flex flex-col gap-2">
            {/* COLLAPSIBLE BANNER */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 hover:bg-slate-900 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-1">
                        {tabs.map(t => {
                            const Icon = t.icon;
                            return <Icon key={t.id} size={12} className="text-cyan-500/70 group-hover:text-cyan-400 transition-opacity" />;
                        })}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Battle Gimmicks</span>
                </div>
                <ChevronRight size={12} className={`text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>

            {/* EXPANDED CONTENT */}
            {isExpanded && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 h-fit flex flex-col gap-3 text-white animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <ActiveIcon size={10} className="text-cyan-500" />
                    BATTLE GIMMICKS
                </h3>

                {tabs.length > 1 && (
                    <div className="flex gap-1 bg-slate-950/80 rounded-md p-1 border border-slate-800/80">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        if (tab.id !== 'teras') setSelectedTera(null);
                                    }}
                                    title={tab.label}
                                    className={`flex items-center justify-center p-1.5 rounded text-[11px] font-mono font-bold transition-all duration-300 ${isActive
                                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 border border-transparent'
                                        }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Sub-header context label */}
            <div className="flex items-center justify-between mb-1 relative z-20">
                <div className="flex items-center gap-2">
                    <ActiveIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[13px] font-mono font-semibold text-cyan-500 uppercase tracking-wider">
                        {activeTabData.label}
                    </span>
                </div>
                {activeTab === 'teras' && gimmicks.teras && (
                    <div className="relative group" ref={dropdownRef}>
                        <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex justify-between items-center bg-slate-950/80 border border-slate-800 text-cyan-400/60 hover:text-cyan-400 hover:border-cyan-500/40 text-[9px] font-mono uppercase tracking-widest py-1 pl-2 pr-2 rounded cursor-pointer transition-all w-32"
                        >
                            <span>{selectedTera ? translateType(selectedTera).toUpperCase() : '-- FILTER --'}</span>
                            <ChevronDown className={`w-3 h-3 text-cyan-500/50 group-hover:text-cyan-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isDropdownOpen && (
                            <div className="absolute top-full mt-1 right-0 w-32 bg-slate-950 border border-slate-800/80 rounded py-1 z-50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]" data-lenis-prevent="true">
                                <ul
                                    className="max-h-48 overflow-y-auto overscroll-contain pointer-events-auto custom-scrollbar"
                                    data-lenis-prevent="true"
                                >
                                    <li
                                        onClick={() => { setSelectedTera(null); setIsDropdownOpen(false); }}
                                        className="px-3 py-1.5 text-[9px] font-mono uppercase cursor-pointer hover:bg-slate-800/60 text-slate-500 transition-colors"
                                    >
                                        -- FILTER --
                                    </li>
                                    {gimmicks.teras.top_types.map(t => (
                                        <li
                                            key={t.type}
                                            onClick={() => { setSelectedTera(t.type); setIsDropdownOpen(false); }}
                                            className={`px-3 py-1.5 text-[9px] font-mono uppercase cursor-pointer transition-colors flex justify-between items-center ${selectedTera === t.type
                                                    ? 'bg-cyan-900/40 text-cyan-400 border-l-2 border-cyan-400'
                                                    : 'text-slate-300 hover:bg-slate-800/80'
                                                }`}
                                        >
                                            {translateType(t.type).toUpperCase()}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 flex-1">
                {activeTab === 'teras' && gimmicks.teras && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {gimmicks.teras.top_types.slice(0, 6).map(t => {
                                const isSelected = selectedTera === t.type;
                                return (
                                    <div
                                        key={t.type}
                                        onClick={() => setSelectedTera(prev => prev === t.type ? null : t.type)}
                                        className={`flex justify-between items-center px-3 py-1.5 rounded border cursor-pointer transition-all duration-300 ${isSelected
                                                ? 'bg-cyan-950/30 border-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.15)]'
                                                : 'bg-slate-950/60 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/60'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden h-6 cursor-pointer">
                                            <div className="transform scale-50 origin-left -my-4 -ml-2 -mr-8 flex items-center justify-start w-24">
                                                <TypeBadge type={t.type} lang={lang as Lang} />
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-mono text-cyan-400 font-bold tracking-tighter shrink-0 ml-2">
                                            {formatUsage((t.count / gimmicks.teras!.total_usage) * 100)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div>
                            <div className="flex items-center justify-between border-b border-slate-800/50 pb-1 mb-2">
                                <h4 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                                    TOP TERA USERS {selectedTera && <span className="text-cyan-400 ml-1">({translateType(selectedTera).toUpperCase()})</span>}
                                </h4>
                                {selectedTera && (
                                    <button
                                        onClick={() => setSelectedTera(null)}
                                        className="text-[8px] flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors uppercase tracking-widest"
                                    >
                                        <FilterX className="w-2.5 h-2.5" /> Clear Filter
                                    </button>
                                )}
                            </div>

                            {filteredTeraUsers.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {filteredTeraUsers.map(pkm => (
                                        <div key={pkm.id} title={pkm.name} className="group flex items-center justify-between bg-slate-950/80 rounded border border-slate-800/80 p-1.5 hover:border-cyan-500/40 hover:bg-cyan-950/10 transition-all cursor-crosshair">
                                            <div className="flex items-center min-w-0 pr-2">
                                                <div className="w-9 h-9 relative flex-shrink-0 bg-slate-900 rounded mr-2 overflow-hidden border border-slate-800 flex items-center justify-center">
                                                    <img
                                                        src={`/images/pokemon/high-res/${pkm.id}.png`}
                                                        alt={pkm.name}
                                                        className="w-7 h-7 object-contain drop-shadow group-hover:scale-110 transition-transform"
                                                        onError={(e) => {
                                                            const target = e.currentTarget as HTMLImageElement;
                                                            if (target.src.includes('PokeAPI')) {
                                                                target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NDc0OGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxsaW5lIHgxPSJtNCIgeTE9Im00IiB4Mj0ibTIwIiB5Mj0ibTIwIi8+PC9zdmc+'; // lucide circle-off
                                                            } else {
                                                                target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pkm.id}.png`;
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="transform scale-50 origin-left -ml-2 h-5 flex items-center">
                                                    <TypeBadge type={pkm.tera_type} lang={lang as Lang} />
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-mono text-cyan-400 font-semibold shrink-0 pr-1">
                                                {formatUsage(pkm.usage_rate)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-[10px] font-mono text-slate-500 text-center py-4 italic">
                                    No Top Users exclusively found for {selectedTera} in the Top 50 bounds.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'z_moves' && gimmicks.z_moves && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {gimmicks.z_moves.top_crystals.slice(0, 6).map(z => (
                                <div key={z.name} className="flex justify-between items-center bg-slate-950/60 px-3 py-1.5 rounded border border-slate-800 hover:border-cyan-500/30 transition-colors">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Diamond className="w-3.5 h-3.5 text-cyan-400 opacity-90 shrink-0" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest truncate text-slate-300">{z.name.replace(/-/g, ' ')}</span>
                                    </div>
                                    <span className="text-[9px] text-cyan-500/80 font-mono tracking-tighter shrink-0 ml-2">
                                        {formatUsage((z.count / gimmicks.z_moves!.total_usage) * 100)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div>
                            <h4 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-1 mb-2">
                                TOP Z-CRYSTAL HOLDERS
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {gimmicks.z_moves.top_pkm.slice(0, 6).map(pkm => (
                                    <div key={pkm.id} title={pkm.name} className="group flex items-center justify-between bg-slate-950/80 rounded border border-slate-800/80 p-1.5 hover:border-cyan-500/40 hover:bg-cyan-950/10 transition-all cursor-crosshair">
                                        <div className="flex items-center min-w-0 pr-2">
                                            <div className="w-9 h-9 relative flex-shrink-0 bg-slate-900 rounded mr-2 flex items-center justify-center border border-slate-800">
                                                <img
                                                    src={`/images/pokemon/high-res/${pkm.id}.png`}
                                                    alt={pkm.name}
                                                    className="w-7 h-7 object-contain drop-shadow group-hover:scale-110 transition-transform"
                                                    onError={(e) => {
                                                        const target = e.currentTarget as HTMLImageElement;
                                                        if (target.src.includes('PokeAPI')) {
                                                            target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NDc0OGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxsaW5lIHgxPSJtNCIgeTE9Im00IiB4Mj0ibTIwIiB5Mj0ibTIwIi8+PC9zdmc+'; // lucide circle-off
                                                        } else {
                                                            target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pkm.id}.png`;
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <div className="h-1.5 w-1.5 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-sm shrink-0" />
                                                    <span className="text-[9px] text-slate-400 truncate uppercase tracking-widest">{pkm.crystal.replace(/-/g, ' ')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-mono font-semibold text-cyan-400 shrink-0 pr-1">
                                            {formatUsage(pkm.usage_rate)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'megas' && gimmicks.megas && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800/50 pb-1 mb-2">
                                MOST USED MEGA EVOLUTIONS
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {gimmicks.megas.top_pkm.slice(0, 8).map(pkm => (
                                    <div key={pkm.id} title={pkm.name} className="flex items-center justify-between bg-slate-950/80 rounded border border-slate-800/80 p-1.5 relative overflow-hidden group hover:border-cyan-500/40 hover:bg-cyan-950/10 transition-all cursor-crosshair">
                                        <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-cyan-500/10 to-transparent -mr-2 -mt-2 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all" />
                                        <div className="flex items-center min-w-0 pr-2 z-10">
                                            <div className="w-9 h-9 relative flex-shrink-0 bg-slate-900 rounded mr-2 border border-slate-800 flex items-center justify-center">
                                                <img
                                                    src={`/images/pokemon/high-res/${pkm.id}.png`}
                                                    alt={pkm.name}
                                                    className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.3)] group-hover:scale-110 transition-transform"
                                                    onError={(e) => {
                                                        const target = e.currentTarget as HTMLImageElement;
                                                        if (target.src.includes('PokeAPI')) {
                                                            target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2NDc0OGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxsaW5lIHgxPSJtNCIgeTE9Imm0IiB4Mj0ibTIwIiB5Mj0ibTIwIi8+PC9zdmc+'; // lucide circle-off
                                                        } else {
                                                            target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pkm.id}.png`;
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center">
                                                    <span className="text-[9px] text-slate-400 uppercase tracking-widest opacity-80 flex items-center gap-1">
                                                        <LoaderCircle className="w-2.5 h-2.5 text-cyan-500" /> Mega
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-[10px] font-mono font-semibold text-cyan-400 z-10 pr-1 shrink-0">
                                            {formatUsage(pkm.usage_rate)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            </div>
            )}
        </div>
    );
}
