'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ChevronDown, Filter, AlertCircle, Check, Gamepad2 } from 'lucide-react';
import { IPokemonMove, IMoveVersionGroupDetail, IMoveDetail } from '@/types/interfaces';
import { fetchMoveDetail, useMachine, VERSION_METADATA } from '@/services/pokeapi'; 
import { Lang, POKEDEX_DICTIONARY } from '@/lib/pokedexDictionary';
import TypeBadge from '@/components/ui/TypeBadge';
import { cn } from '@/lib/utils';

// --- DICCIONARIO DE GRUPOS DE JUEGO (VERSION GROUPS) ---
// Mapea los identificadores de grupo de PokeAPI a nombres comerciales 
const GAME_NAMES: Record<string, { es: string, en: string }> = {
    // GEN 1
    'red-blue': { es: 'Rojo / Azul', en: 'Red / Blue' },
    'yellow': { es: 'Amarillo', en: 'Yellow' },
    // GEN 2
    'gold-silver': { es: 'Oro / Plata', en: 'Gold / Silver' },
    'crystal': { es: 'Cristal', en: 'Crystal' },
    // GEN 3
    'ruby-sapphire': { es: 'Rubí / Zafiro', en: 'Ruby / Sapphire' },
    'emerald': { es: 'Esmeralda', en: 'Emerald' },
    'firered-leafgreen': { es: 'Rojo Fuego / Verde Hoja', en: 'FireRed / LeafGreen' },
    'colosseum': { es: 'Colosseum', en: 'Colosseum' },
    'xd': { es: 'XD: Tempestad Oscura', en: 'XD: Gale of Darkness' },
    // GEN 4
    'diamond-pearl': { es: 'Diamante / Perla', en: 'Diamond / Pearl' },
    'platinum': { es: 'Platino', en: 'Platinum' },
    'heartgold-soulsilver': { es: 'Oro HeartGold / Plata SoulSilver', en: 'HeartGold / SoulSilver' },
    // GEN 5
    'black-white': { es: 'Negro / Blanco', en: 'Black / White' },
    'black-2-white-2': { es: 'Negro 2 / Blanco 2', en: 'Black 2 / White 2' },
    // GEN 6
    'x-y': { es: 'X / Y', en: 'X / Y' },
    'omega-ruby-alpha-sapphire': { es: 'Rubí Omega / Zafiro Alfa', en: 'Omega Ruby / Alpha Sapphire' },
    // GEN 7
    'sun-moon': { es: 'Sol / Luna', en: 'Sun / Moon' },
    'ultra-sun-ultra-moon': { es: 'Ultra Sol / Ultra Luna', en: 'Ultra Sun / Ultra Moon' },
    'lets-go-pikachu-lets-go-eevee': { es: "Let's Go Pikachu / Eevee", en: "Let's Go Pikachu / Eevee" },
    // GEN 8
    'sword-shield': { es: 'Espada / Escudo', en: 'Sword / Shield' },
    'the-isle-of-armor': { es: 'Isla de la Armadura', en: 'Isle of Armor' },
    'the-crown-tundra': { es: 'Las Nieves de la Corona', en: 'The Crown Tundra' },
    'brilliant-diamond-shining-pearl': { es: 'Diamante Brillante / Perla Reluciente', en: 'Brilliant Diamond / Shining Pearl' },
    'legends-arceus': { es: 'Leyendas: Arceus', en: 'Legends: Arceus' },
    // GEN 9
    'scarlet-violet': { es: 'Escarlata / Púrpura', en: 'Scarlet / Violet' },
    'the-teal-mask': { es: 'La Máscara Turquesa', en: 'The Teal Mask' },
    'the-indigo-disk': { es: 'El Disco Índigo', en: 'The Indigo Disk' }
};

const getGameName = (key: string, lang: Lang) => {
    return GAME_NAMES[key]?.[lang] || key.replace(/-/g, ' ').toUpperCase();
};

// --- ICONOS DE CLASE ---
const PhysicalIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500 drop-shadow-sm">
        <path d="M12 2l3 7h7l-6 5 2 7-6-5-6 5 2-7-6-5h7z" />
    </svg>
);

const SpecialIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 drop-shadow-sm">
        <circle cx="12" cy="12" r="10" className="opacity-20" />
        <path d="M12 2a10 10 0 0 1 10 10" className="opacity-50" />
        <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
    </svg>
);

const StatusIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 drop-shadow-sm">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" className="opacity-30" />
        <path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor" />
        <path d="M12 16v.01" strokeWidth="3" />
    </svg>
);

// --- UTILIDADES ---
const TextWithTooltip = ({ text, className }: { text: string, className?: string }) => (
    <div className="relative group overflow-hidden w-full">
        <p className={cn("truncate text-left", className)}>{text}</p>
        <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block w-max max-w-[200px] p-2 bg-slate-950 border border-slate-700 rounded shadow-xl text-[10px] text-slate-200 z-50 pointer-events-none whitespace-normal break-words leading-tight">
            {text}
        </div>
    </div>
);

// Helper para encontrar Generación desde el nombre del grupo
const getGenFromGroup = (groupName: string): number => {
    // Intentamos separar por guiones y buscar si alguna parte es una versión conocida
    // Ej: "red-blue" -> busca "red" -> GEN 1
    const parts = groupName.split('-');
    for (const part of parts) {
        if (VERSION_METADATA[part]) return VERSION_METADATA[part].gen;
    }
    // Fallback: Casos especiales o DLCs con nombres únicos
    if (groupName.includes('scarlet') || groupName.includes('violet') || groupName.includes('teal') || groupName.includes('indigo')) return 9;
    if (groupName.includes('sword') || groupName.includes('shield') || groupName.includes('armor') || groupName.includes('crown') || groupName.includes('legends')) return 8;
    if (groupName.includes('sun') || groupName.includes('moon') || groupName.includes('lets')) return 7;
    return 99;
};

// --- RESOLVER NÚMERO DE TM ---
const TMResolver = ({ machines, versionGroup }: { machines?: { machine: { url: string }, version_group: { name: string } }[], versionGroup: string }) => {
    const machineEntry = machines?.find(m => m.version_group.name === versionGroup);
    const { data: machineData, isLoading } = useMachine(machineEntry?.machine.url);

    if (!machineEntry) return <span className="text-slate-600 text-[9px]">-</span>;
    if (isLoading) return <span className="text-slate-600 animate-pulse text-[9px]">...</span>;
    
    const tmName = machineData?.item.name.replace(/^tm/i, 'TM').replace(/^hm/i, 'HM').toUpperCase() || 'TM??';
    return <span className="text-emerald-400 font-bold text-[10px] tracking-tight">{tmName}</span>;
};

// --- SELECTOR DE VERSIÓN PERSONALIZADO ---
const CustomVersionSelector = ({ selected, onChange, availableVersions, lang }: { selected: string, onChange: (v: string) => void, availableVersions: string[], lang: Lang }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentName = getGameName(selected, lang);

    return (
        <div className="relative w-[180px]" ref={ref}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between bg-slate-950/80 border text-[9px] font-mono font-bold uppercase py-1.5 pl-3 pr-2 rounded transition-all shadow-sm group backdrop-blur-sm",
                    isOpen 
                        ? "border-cyan-500/50 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20" 
                        : "border-slate-700 text-cyan-100 hover:bg-slate-900 hover:border-slate-600"
                )}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Gamepad2 size={12} className="text-cyan-600" />
                    <span className="truncate">{currentName || 'SELECT GAME'}</span>
                </div>
                <ChevronDown size={10} className={cn("transition-transform duration-200 text-cyan-600 group-hover:text-cyan-400", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-1 w-full bg-slate-950/95 border border-slate-700/80 rounded-lg shadow-2xl z-50 max-h-[300px] overflow-y-auto custom-scrollbar p-1.5 grid grid-cols-1 gap-0.5 backdrop-blur-md ring-1 ring-black/50">
                    {availableVersions.map((v) => {
                        const isActive = selected === v;
                        const gen = getGenFromGroup(v);
                        return (
                            <button
                                key={v}
                                onClick={() => { onChange(v); setIsOpen(false); }}
                                className={cn(
                                    "flex items-center justify-between px-2 py-1.5 rounded transition-all w-full text-left group border border-transparent",
                                    isActive 
                                        ? "bg-cyan-950/30 border-cyan-500/30 text-cyan-100" 
                                        : "hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                                )}
                            >
                                <span className="text-[9px] font-mono font-bold truncate uppercase">{getGameName(v, lang)}</span>
                                <div className="flex items-center gap-1.5">
                                    {!isActive && <span className="text-[7px] text-slate-600 font-mono">GEN {gen}</span>}
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_4px_cyan]" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- FILTRO DE TIPOS CUSTOM ---
const CustomTypeSelector = ({ selected, onChange, availableTypes, lang }: { selected: string, onChange: (t: string) => void, availableTypes: string[], lang: Lang }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const badgeStyle = "h-4 px-1.5 text-[8px] border-none [&_svg]:!w-2.5 [&_svg]:!h-2.5 shadow-none bg-opacity-90"; 

    return (
        <div className="relative w-full" ref={ref}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between bg-slate-950/80 border text-[9px] font-bold uppercase py-1.5 px-2 rounded transition-all shadow-sm group backdrop-blur-sm",
                    isOpen ? "border-cyan-500/50 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.15)]" : "border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                )}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {selected === 'all' ? (
                        <span className="truncate flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-cyan-400 transition-colors" />
                            FILTER TYPE
                        </span>
                    ) : (
                        <TypeBadge type={selected} showLabel={true} className={badgeStyle} lang={lang} />
                    )}
                </div>
                <ChevronDown size={10} className={cn("transition-transform duration-200 text-slate-500 group-hover:text-cyan-400", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950/95 border border-slate-700/80 rounded-lg shadow-2xl z-50 max-h-[220px] overflow-y-auto custom-scrollbar p-1.5 grid grid-cols-1 gap-1 backdrop-blur-md ring-1 ring-black/50">
                    <button 
                        onClick={() => { onChange('all'); setIsOpen(false); }}
                        className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800/80 transition-colors w-full text-left group",
                            selected === 'all' && "bg-slate-900 border border-slate-800"
                        )}
                    >
                        <div className="w-4 flex justify-center">
                            {selected === 'all' ? <Check size={10} className="text-cyan-400" /> : <div className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-slate-500" />}
                        </div>
                        <span className={cn("text-[9px] font-mono", selected === 'all' ? "text-cyan-100 font-bold" : "text-slate-400")}>SHOW ALL</span>
                    </button>
                    
                    {availableTypes.length > 0 ? (
                        availableTypes.map(t => (
                            <button 
                                key={t}
                                onClick={() => { onChange(t); setIsOpen(false); }}
                                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800/80 transition-colors w-full group"
                            >
                                <div className="w-4 flex justify-center">
                                    {selected === t ? <Check size={10} className="text-cyan-400" /> : <div className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </div>
                                <TypeBadge type={t} showLabel={true} className={`flex-1 h-5 justify-start px-2 border-none bg-opacity-90 hover:bg-opacity-100 ${badgeStyle}`} lang={lang} />
                            </button>
                        ))
                    ) : (
                        <div className="px-2 py-3 text-center text-[9px] text-slate-600 font-mono italic">
                            No types loaded
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- FILA DE MOVIMIENTO ---
interface MoveRowProps {
    moveData: IPokemonMove;
    detail: IMoveDetail;
    learnDetails: IMoveVersionGroupDetail;
    lang: Lang;
    selectedVersion: string;
}

const MoveRow = ({ moveData, detail, learnDetails, lang, selectedVersion }: MoveRowProps) => {
    
    const getClassIcon = (damageClass: string) => {
        switch (damageClass) {
            case 'physical': return <PhysicalIcon />;
            case 'special': return <SpecialIcon />;
            default: return <StatusIcon />;
        }
    };

    const getName = () => {
        const localized = detail.names?.find(n => n.language.name === lang);
        return localized ? localized.name : detail.name.replace(/-/g, ' ');
    };

    const getFlavorText = () => {
        const entry = detail.flavor_text_entries.find(e => e.language.name === lang) || 
                      detail.flavor_text_entries.find(e => e.language.name === 'en');
        return entry ? entry.flavor_text.replace(/[\n\f]/g, ' ') : '...';
    };

    const renderMethod = () => {
        const method = learnDetails.move_learn_method.name;
        
        if (method === 'level-up') 
            return <div className="flex flex-col items-center justify-center h-full"><span className="text-[7px] text-slate-500 font-mono">LVL</span><span className="font-bold text-cyan-400 text-xs">{learnDetails.level_learned_at}</span></div>;
        
        if (method === 'machine') 
            return <div className="flex flex-col items-center justify-center h-full"><span className="text-[7px] text-slate-500 font-mono">TM</span><TMResolver machines={detail?.machines} versionGroup={selectedVersion} /></div>;
        
        if (method === 'egg') 
            return <div className="h-full flex items-center justify-center"><span className="text-pink-400 font-bold text-[9px] border border-pink-400/30 px-1 rounded bg-pink-400/10">EGG</span></div>;
        
        if (method === 'tutor') 
            return <div className="h-full flex items-center justify-center"><span className="text-purple-400 font-bold text-[9px] border border-purple-400/30 px-1 rounded bg-purple-400/10">TUT</span></div>;
            
        return <span className="text-slate-500 uppercase text-[8px] truncate max-w-full">{method}</span>;
    };

    return (
        <div className="group flex items-center gap-2 p-1 rounded-md border border-slate-800/60 bg-slate-950 hover:bg-slate-900 hover:border-cyan-500/30 transition-all cursor-default mb-1 h-[40px]">
            {/* 1. Método */}
            <div className="w-10 flex-shrink-0 border-r border-slate-800/50 pr-1 h-full">
                {renderMethod()}
            </div>

            {/* 2. Tipo/Clase */}
            <div className="w-[72px] flex-shrink-0 flex items-center justify-center gap-2 h-full">
                <TypeBadge 
                    type={detail.type} 
                    showLabel={false} 
                    className="w-9 !h-full rounded-[4px] text-[0px] leading-none shadow-none [&_svg]:!w-3.5 [&_svg]:!h-3.5 flex items-center justify-center p-0" 
                    lang={lang} 
                />
                <div title={detail.damage_class} className="opacity-50 group-hover:opacity-100 transition-opacity">
                    {getClassIcon(detail.damage_class)}
                </div>
            </div>

            {/* 3. Nombre y Stats */}
            <div className="flex-1 min-w-0 flex flex-col justify-center px-1 border-l border-slate-800/30 pl-2">
                <div className="flex justify-between items-baseline w-full">
                    <span className="text-[11px] font-bold text-slate-200 capitalize truncate font-display tracking-wide group-hover:text-cyan-300 transition-colors">
                        {getName()}
                    </span>
                    
                    <div className="flex gap-1.5 text-[8px] font-mono text-slate-600">
                        <span title="Power" className={!detail.power ? 'opacity-30' : ''}>P:<b className="text-slate-400 font-normal">{detail.power || '-'}</b></span>
                        <span title="Accuracy" className={!detail.accuracy ? 'opacity-30' : ''}>A:<b className="text-slate-400 font-normal">{detail.accuracy || '-'}</b></span>
                        <span title="PP">PP:<b className="text-slate-400 font-normal">{detail.pp}</b></span>
                    </div>
                </div>
                
                <div className="text-[8px] text-slate-500 mt-px w-full">
                    <TextWithTooltip text={getFlavorText()} className="group-hover:text-slate-400 transition-colors" />
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---

interface Props {
    moves: IPokemonMove[];
    lang: Lang;
}

export default function MoveRegistry({ moves, lang }: Props) {
    const [selectedVersion, setSelectedVersion] = useState<string>('');
    const [filterMethod, setFilterMethod] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterClass, setFilterClass] = useState<string>('all');

    // 1. Calcular y Ordenar Versiones
    const availableVersions = useMemo(() => {
        if (!moves) return [];
        const versions = new Set<string>();
        moves.forEach(m => m.version_group_details.forEach(v => versions.add(v.version_group.name)));
        
        return Array.from(versions).sort((a, b) => {
            const genA = getGenFromGroup(a);
            const genB = getGenFromGroup(b);
            return genA - genB;
        });
    }, [moves]);

    // Inicializar Versión (Última disponible)
    useEffect(() => {
        if (availableVersions.length > 0 && !selectedVersion) {
            setSelectedVersion(availableVersions[availableVersions.length - 1]);
        }
    }, [availableVersions, selectedVersion]);

    // 2. Base Moves para Versión
    const movesForVersion = useMemo(() => {
        if (!selectedVersion || !moves) return [];
        return moves.map(m => {
            const detail = m.version_group_details.find(v => v.version_group.name === selectedVersion);
            return detail ? { move: m, detail } : null;
        }).filter((item): item is { move: IPokemonMove, detail: IMoveVersionGroupDetail } => item !== null);
    }, [moves, selectedVersion]);

    // 3. BULK FETCH
    const moveQueries = useQueries({
        queries: movesForVersion.map(item => ({
            queryKey: ['move', item.move.move.url],
            queryFn: () => fetchMoveDetail(item.move.move.url),
            staleTime: Infinity,
        }))
    });

    const isLoadingMoves = moveQueries.some(q => q.isLoading);

    const enrichedMoves = useMemo(() => {
        return movesForVersion.map((item, index) => {
            const query = moveQueries[index];
            return {
                ...item,
                data: query.data as IMoveDetail | undefined,
                isLoading: query.isLoading
            };
        });
    }, [movesForVersion, moveQueries]);

    // 4. Tipos Disponibles
    const availableTypes = useMemo(() => {
        const types = new Set<string>();
        enrichedMoves.forEach(m => {
            if (m.data?.type) types.add(m.data.type);
        });
        return Array.from(types).sort();
    }, [enrichedMoves]);

    // 5. Filtrado Final
    const finalDisplayData = useMemo(() => {
        let filtered = enrichedMoves.filter(m => m.data); 

        if (filterMethod !== 'all') filtered = filtered.filter(item => item.detail.move_learn_method.name === filterMethod);
        if (filterType !== 'all') filtered = filtered.filter(item => item.data?.type === filterType);
        if (filterClass !== 'all') filtered = filtered.filter(item => item.data?.damage_class === filterClass);

        return filtered.sort((a, b) => {
            const methodA = a.detail.move_learn_method.name;
            const methodB = b.detail.move_learn_method.name;
            const priority: Record<string, number> = { 'level-up': 1, 'machine': 2, 'evolution': 3, 'tutor': 4, 'egg': 5 };
            const pA = priority[methodA] || 99;
            const pB = priority[methodB] || 99;

            if (pA !== pB) return pA - pB;
            if (methodA === 'level-up') return a.detail.level_learned_at - b.detail.level_learned_at;
            
            const nameA = a.data?.names?.find(n => n.language.name === lang)?.name || a.move.move.name;
            const nameB = b.data?.names?.find(n => n.language.name === lang)?.name || b.move.move.name;
            return nameA.localeCompare(nameB);
        });

    }, [enrichedMoves, filterMethod, filterType, filterClass, lang]);

    if (!moves || moves.length === 0) return null;

    return (
        <div className="flex flex-col h-full bg-slate-950 rounded-xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-sm">
            
            <div className="p-3 border-b border-slate-800 bg-slate-900/90 flex flex-col gap-3 z-20 shadow-md">
                <div className="flex justify-between items-center gap-4">
                    <h3 className="text-[10px] font-display font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2 shrink-0">
                        <Filter size={12} />
                        MOVES
                    </h3>
                    
                    {/* SELECTOR DE VERSIÓN CUSTOM */}
                    <CustomVersionSelector 
                        selected={selectedVersion} 
                        onChange={setSelectedVersion} 
                        availableVersions={availableVersions} 
                        lang={lang} 
                    />
                </div>

                <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1 no-scrollbar">
                    {['all', 'level-up', 'machine', 'egg', 'tutor'].map((method) => {
                        let label = 'ALL';
                        if(method === 'level-up') label = 'LEVEL';
                        if(method === 'machine') label = 'TM/HM';
                        if(method === 'egg') label = 'EGG';
                        if(method === 'tutor') label = 'TUTOR';

                        return (
                            <button
                                key={method}
                                onClick={() => setFilterMethod(method)}
                                className={cn(
                                    "px-3 py-1 rounded text-[8px] font-mono font-bold uppercase border transition-all whitespace-nowrap",
                                    filterMethod === method 
                                        ? "bg-cyan-950 border-cyan-500/50 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.1)]" 
                                        : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                                )}
                            >
                                {label}
                            </button>
                        )
                    })}
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                    <CustomTypeSelector 
                        selected={filterType} 
                        onChange={setFilterType} 
                        availableTypes={availableTypes} 
                        lang={lang} 
                    />

                    <div className="flex bg-slate-950 rounded border border-slate-800 p-0.5 h-[28px] items-center">
                        {['all', 'physical', 'special', 'status'].map(c => (
                            <button
                                key={c}
                                onClick={() => setFilterClass(c)}
                                title={c}
                                className={cn(
                                    "p-1.5 rounded transition-colors h-full flex items-center justify-center aspect-square",
                                    filterClass === c ? "bg-slate-800 text-cyan-400" : "text-slate-600 hover:text-slate-400"
                                )}
                            >
                                {c === 'all' ? <span className="text-[8px] font-bold">ALL</span> : 
                                 c === 'physical' ? <PhysicalIcon /> : 
                                 c === 'special' ? <SpecialIcon /> : <StatusIcon />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar relative bg-slate-950">
                {isLoadingMoves && finalDisplayData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                        <span className="text-[9px] text-slate-500 font-mono animate-pulse">LOADING...</span>
                    </div>
                ) : finalDisplayData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-2 opacity-60">
                        <AlertCircle size={20} />
                        <span className="text-[9px] font-mono">NO DATA FOR SELECTION</span>
                    </div>
                ) : (
                    finalDisplayData.map((item, idx) => (
                        item.data && (
                            <MoveRow 
                                key={`${item.move.move.name}-${idx}`} 
                                moveData={item.move} 
                                detail={item.data}
                                learnDetails={item.detail} 
                                lang={lang}
                                selectedVersion={selectedVersion}
                            />
                        )
                    ))
                )}
            </div>
            
            <div className="py-1 px-3 bg-slate-950 border-t border-slate-800 text-[7px] flex justify-between text-slate-600 font-mono uppercase tracking-wider">
                <span>{selectedVersion}</span>
                <span>{finalDisplayData.length} MOVES</span>
            </div>
        </div>
    );
}