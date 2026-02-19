import { useState, useMemo } from 'react';
import { Swords, Shield, Skull, ChevronDown, Trophy, Users, Crown, Zap } from 'lucide-react';
import { BossBattle, BossPokemon } from '@/types/nuzlocke';
import { cn } from '@/lib/utils';
import staticMoveDex from '@/data/move_dex.json';
import staticPokedexIds from '@/data/pokedex_ids.json';

interface Props {
    pokemonSlug: string;
    bosses: BossBattle[];
    t: any;
}

interface GroupedBoss {
    id: string; 
    baseName: string;
    segmentId: string;
    variants: BossBattle[];
}

const TYPE_COLORS: Record<string, string> = {
    normal: 'bg-neutral-400', fire: 'bg-orange-500', water: 'bg-blue-500',
    grass: 'bg-green-500', electric: 'bg-yellow-400', ice: 'bg-cyan-300',
    fighting: 'bg-red-700', poison: 'bg-purple-500', ground: 'bg-amber-600',
    flying: 'bg-indigo-300', psychic: 'bg-pink-500', bug: 'bg-lime-500',
    rock: 'bg-stone-500', ghost: 'bg-violet-700', dragon: 'bg-indigo-600',
    steel: 'bg-slate-400', dark: 'bg-neutral-800', fairy: 'bg-pink-300'
};

const getTypeColor = (type: string) => TYPE_COLORS[type.toLowerCase()] || 'bg-slate-700';

const MoveBadge = ({ moveName }: { moveName: string }) => {
    // @ts-ignore
    const moveData = staticMoveDex[moveName];
    if (!moveData) return <span className="text-[9px] text-slate-600 capitalize">{moveName.replace(/-/g, ' ')}</span>;

    const typeColor = getTypeColor(moveData.type);
    
    return (
        <div className="flex items-center justify-between w-full px-1.5 py-0.5 bg-slate-900/50 rounded border border-slate-800/50">
            <span className="text-[9px] text-slate-300 capitalize truncate max-w-[65px]">{moveData.name.replace(/-/g, ' ')}</span>
            <div className="flex items-center gap-1.5">
                {moveData.category === 'physical' && <div className="w-1.5 h-1.5 bg-orange-400 rotate-45" title="Physical" />}
                {moveData.category === 'special' && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" title="Special" />}
                {moveData.category === 'status' && <div className="w-1.5 h-1.5 bg-slate-400 rounded-sm" title="Status" />}
                {moveData.power > 0 && <span className="text-[8px] font-mono text-slate-500">{moveData.power}</span>}
                <div className={cn("w-2 h-2 rounded shadow-sm", typeColor)} />
            </div>
        </div>
    );
};

const BossPokemonCard = ({ poke, isAce, isTarget }: { poke: BossPokemon, isAce: boolean, isTarget: boolean }) => {
    // @ts-ignore
    const pokeId = staticPokedexIds[poke.pokemon_id] || 0;
    
    return (
        <div className={cn(
            "relative flex flex-col p-2.5 rounded-lg border transition-all animate-in fade-in zoom-in-95 duration-300",
            isTarget 
                ? "bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30" 
                : "bg-slate-950/50 border-slate-800 hover:bg-slate-900",
            !isTarget && isAce ? "border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]" : ""
        )}>
            {/* Header: Sprite + Info */}
            <div className={cn("flex items-center gap-3 mb-2.5 pb-2 border-b", isTarget ? "border-amber-500/30" : "border-slate-800/50")}>
                <div className="relative shrink-0">
                    <img 
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeId}.png`} 
                        alt={poke.pokemon_id}
                        className="w-10 h-10 object-contain pixelated"
                        loading="lazy"
                    />
                    {isAce && <Crown className="absolute -top-2 -right-2 text-purple-400 w-3.5 h-3.5 drop-shadow-md" />}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className={cn("text-[10px] font-bold uppercase truncate", 
                        isTarget ? "text-amber-400" : (isAce ? "text-purple-400" : "text-slate-200")
                    )}>
                        {poke.pokemon_id}
                    </span>
                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono mt-0.5">
                        <span className="bg-slate-900/80 px-1 rounded text-slate-400">Lv.{poke.level}</span>
                        {poke.item && <span className="truncate max-w-[80px]">@{poke.item.replace(/-/g, ' ')}</span>}
                    </div>
                </div>
            </div>

            {/* Moveset Grid */}
            <div className="grid grid-cols-2 gap-1.5">
                {poke.moves.map((m, i) => (
                    <MoveBadge key={i} moveName={m} />
                ))}
            </div>
            
            {/* Ability Footer */}
            {poke.ability && (
                <div className={cn("mt-2 pt-1.5 border-t text-[8px] text-center uppercase tracking-wider font-medium", 
                    isTarget ? "border-amber-500/30 text-amber-500/70" : "border-slate-800/50 text-slate-500"
                )}>
                    {poke.ability.replace(/-/g, ' ')}
                </div>
            )}
        </div>
    );
};

// Componente de Grupo con Selector de Variantes
const BossGroupItem = ({ group, pokemonSlug }: { group: GroupedBoss, pokemonSlug: string }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const activeVariant = group.variants[selectedIndex];
    
    // Configuración visual basada en categoría
    const isGym = activeVariant.category?.includes('leader');
    const isRival = activeVariant.category?.includes('rival');
    const isElite = activeVariant.category?.includes('elite') || activeVariant.category?.includes('champion');
    
    let badgeColor = "bg-slate-800 text-slate-400 border-slate-700";
    let Icon = Users;
    
    if (isGym) { badgeColor = "bg-blue-900/30 text-blue-400 border-blue-800/50"; Icon = Trophy; }
    if (isRival) { badgeColor = "bg-orange-900/30 text-orange-400 border-orange-800/50"; Icon = Swords; }
    if (isElite) { badgeColor = "bg-purple-900/30 text-purple-400 border-purple-800/50"; Icon = Crown; }

    // Determinar etiqueta del selector
    const variantType = activeVariant.variant?.type || 'variant';
    const selectorLabel = variantType === 'starter' ? 'Starter selected:' : 'Variation:';

    return (
        <details className="group open:bg-slate-900/20 transition-all duration-300">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none hover:bg-slate-900/40 transition-colors select-none">
                <div className="flex items-center gap-4">
                    <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg border shadow-sm", badgeColor)}>
                        <Icon size={16} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                            {group.baseName}
                            {group.variants.length > 1 && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 rounded-full text-slate-400 font-mono normal-case border border-slate-700">
                                    {group.variants.length} variations
                                </span>
                            )}
                        </span>
                        <div className="flex gap-3 text-[10px] text-slate-500 font-mono mt-0.5">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>Lv Cap: {activeVariant.level_cap}</span>
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>{activeVariant.format || 'Single'}</span>
                        </div>
                    </div>
                </div>
                <ChevronDown size={16} className="text-slate-600 transition-transform duration-300 group-open:rotate-180" />
            </summary>
            
            <div className="px-4 pb-6 pt-2 border-t border-slate-800/30">
                {/* Variant Selector Tabs */}
                {group.variants.length > 1 && (
                    <div className="flex items-center gap-3 mb-5 pb-1 border-b border-slate-800/30 overflow-x-auto custom-scrollbar">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                            {selectorLabel}
                        </span>
                        <div className="flex gap-2">
                            {group.variants.map((v, i) => {
                                let label = `Var ${i + 1}`;
                                if (v.variant?.type === 'starter') {
                                    // Extraer tipo del slug (ej: "starter-fire" -> "Fire")
                                    const type = v.variant.slug.split('-')[1] || v.variant.slug;
                                    label = type.charAt(0).toUpperCase() + type.slice(1);
                                } else if (v.variant?.description) {
                                    label = v.variant.description.replace(/[\(\)]/g, '').split(' ')[0]; 
                                } else if (v.variant?.slug) {
                                    label = v.variant.slug;
                                }

                                const isActive = selectedIndex === i;
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedIndex(i)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap",
                                            isActive
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-sm" 
                                                : "bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-600 hover:text-slate-300"
                                        )}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Active Team Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {activeVariant.team.map((poke, pIdx) => (
                        <BossPokemonCard 
                            key={`${group.id}-${selectedIndex}-${pIdx}`} 
                            poke={poke} 
                            isAce={pIdx === activeVariant.team.length - 1}
                            isTarget={poke.pokemon_id === pokemonSlug}
                        />
                    ))}
                </div>
            </div>
        </details>
    );
};

export default function BossThreats({ pokemonSlug, bosses, t }: Props) {
    if (!bosses || bosses.length === 0) return null;

    const groupedBosses = useMemo(() => {
        const map = new Map<string, GroupedBoss>();
        const groupsOrder: string[] = [];

        bosses.forEach(boss => {
            // LÓGICA DE AGRUPACIÓN POR ID (Root ID)
            // Si tiene variante, asumimos formato "root_variant" (ej: r1_water -> r1)
            let groupKey = boss.id;
            
            if (boss.variant && boss.id.includes('_')) {
                // Eliminar el último segmento del ID (el sufijo de la variante)
                groupKey = boss.id.substring(0, boss.id.lastIndexOf('_'));
            }

            if (!map.has(groupKey)) {
                map.set(groupKey, {
                    id: groupKey,
                    baseName: boss.name, // Usamos el nombre tal cual viene en el JSON
                    segmentId: boss.segment_id,
                    variants: []
                });
                groupsOrder.push(groupKey);
            }
            map.get(groupKey)!.variants.push(boss);
        });

        return groupsOrder.map(key => map.get(key)!);
    }, [bosses]);

    return (
        <div className="bg-[#0B101B] border border-slate-800 rounded-xl overflow-hidden shadow-lg w-full">
            <div className="bg-slate-900/90 border-b border-slate-800 py-3 px-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skull size={14} className="text-red-400" />
                    <h3 className="text-[11px] font-bold text-slate-200 tracking-widest uppercase">
                        Major Threats Analysis (Enemy Appearances)
                    </h3>
                </div>
                <span className="text-[9px] text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {groupedBosses.length} Battles
                </span>
            </div>

            <div className="flex flex-col divide-y divide-slate-800/50">
                {groupedBosses.map((group) => (
                    <BossGroupItem key={group.id} group={group} pokemonSlug={pokemonSlug} />
                ))}
            </div>
        </div>
    );
}