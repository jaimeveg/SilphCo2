'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { 
  ArrowRight, Zap, Heart, Sun, Moon, RefreshCw, 
  Smartphone, CloudRain, Sparkles, ChevronRight, Package, BoxSelect,
  CircleHelp, History, MapPin, ChevronDown 
} from 'lucide-react';
import { IEvolutionNode, IEvolutionDetail } from '@/types/interfaces';
import { Lang, POKEDEX_DICTIONARY } from '@/lib/pokedexDictionary';
import { cn } from '@/lib/utils';

// --- CONFIGURACIÓN: DATA GENERACIONAL ---
const GEN_CONSTRAINTS: Record<string, number> = {
  'magnezone': 4,
  'probopass': 4,
  'leafeon': 4,
  'glaceon': 4,
  'vikavolt': 7,
  'crabominable': 7,
  'sylveon': 6,
  'milotic': 3 
};

const GEN_ROMAN: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX'
};

// --- DEFINICIÓN DE PROPS ---
interface Props {
  chain?: IEvolutionNode;
  lang: Lang;
  // [NUEVO] Para saber qué Pokémon estamos viendo y pre-seleccionar su rama
  activeSpecies?: string; 
}

// --- LOGIC ENGINE ---
const getOptimizedEvolutionDetail = (speciesName: string, allDetails: IEvolutionDetail[], gen: number): IEvolutionDetail[] => {
  if (!allDetails || allDetails.length === 0) return [];
  const species = speciesName.toLowerCase();

  if (['magnezone', 'probopass', 'vikavolt'].includes(species)) {
    if (gen >= 8) return filterBy(allDetails, d => d.item === 'thunder-stone') || allDetails;
    return filterBy(allDetails, d => d.location !== null) || allDetails;
  }
  if (species === 'leafeon') {
    if (gen >= 8) return filterBy(allDetails, d => d.item === 'leaf-stone') || allDetails;
    return filterBy(allDetails, d => d.location !== null) || allDetails;
  }
  if (species === 'glaceon') {
    if (gen >= 8) return filterBy(allDetails, d => d.item === 'ice-stone') || allDetails;
    return filterBy(allDetails, d => d.location !== null) || allDetails;
  }
  if (species === 'crabominable') {
    if (gen >= 9) return filterBy(allDetails, d => d.item === 'ice-stone') || allDetails;
    return filterBy(allDetails, d => d.location !== null) || allDetails;
  }
  if (species === 'milotic') {
    if (gen >= 5) return filterBy(allDetails, d => d.trigger === 'trade' && d.item === 'prism-scale') || allDetails;
    return filterBy(allDetails, d => d.minBeauty !== null) || allDetails;
  }

  return allDetails;
};

const filterBy = (list: IEvolutionDetail[], predicate: (d: IEvolutionDetail) => boolean) => {
  const filtered = list.filter(predicate);
  return filtered.length > 0 ? filtered : null;
};

// --- UI HELPERS ---

const SimpleTooltip = ({ children, text, direction = 'down' }: { children: React.ReactNode; text: string, direction?: 'up' | 'down' }) => (
  <div className="relative group/tooltip inline-block">
    {children}
    <div className={cn(
        "absolute left-1/2 -translate-x-1/2 w-max max-w-[200px] bg-slate-900 text-cyan-50 text-[10px] font-mono px-3 py-2 rounded border border-cyan-500/30 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none shadow-[0_4px_20px_rgba(0,0,0,0.9)] whitespace-normal text-center z-[9999]",
        direction === 'down' ? "top-full mt-3" : "bottom-full mb-3"
    )}>
      {text}
      <div className={cn(
          "absolute left-1/2 -translate-x-1/2 border-4 border-transparent",
          direction === 'down' ? "bottom-full border-b-cyan-500/30" : "top-full border-t-cyan-500/30"
      )} />
    </div>
  </div>
);

const ItemDisplay = ({ itemName }: { itemName: string }) => {
  const [error, setError] = useState(false);
  const itemUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName}.png`;

  if (error) {
    return (
      <div className="flex flex-col items-center">
         <div className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded-full border border-slate-700">
             <Package size={12} className="text-slate-400" />
         </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center relative group/item">
      <div className="w-6 h-6 relative">
          <Image src={itemUrl} alt={itemName} fill className="object-contain drop-shadow-lg" unoptimized onError={() => setError(true)}/>
      </div>
    </div>
  );
};

const SpecialIcon = ({ icon: Icon, color, tooltip }: { icon: any, color: string, tooltip: string }) => (
    <SimpleTooltip text={tooltip}>
        <div className={cn("p-1 rounded-full bg-slate-900 border border-slate-700", color)}>
            <Icon size={12} />
        </div>
    </SimpleTooltip>
);

// --- TRIGGER COMPONENT ---
const EvolutionTriggerDisplay = ({ details, lang, gen }: { details: IEvolutionDetail[]; lang: Lang; gen: number }) => {
  const dict = POKEDEX_DICTIONARY[lang].labels;
  const tooltips = POKEDEX_DICTIONARY[lang].labels.evo_tooltips;
  
  const detail = details[0]; 
  if (!detail) return <ArrowRight size={16} className="text-slate-700" />;

  const reqs = [];

  // 0. CUSTOM
  if (detail.customReq) {
      reqs.push(
          <SimpleTooltip key="custom" text={detail.customReq}>
              <div className="p-1 rounded-sm bg-cyan-950/30 border border-cyan-500/50 hover:bg-cyan-900/80 transition-colors cursor-help group shadow-[0_0_8px_rgba(34,211,238,0.1)]">
                  <CircleHelp size={14} className="text-cyan-400 group-hover:text-cyan-200" />
              </div>
          </SimpleTooltip>
      );
  }

  // 1. NIVEL
  if (detail.minLevel) {
    reqs.push(
      <div key="lvl" className="flex flex-col items-center leading-none">
         <span className="text-[7px] font-mono text-slate-500 uppercase mb-0.5">{dict.evo_methods.level}</span>
         <span className="text-lg font-display font-bold text-white">{detail.minLevel}</span>
      </div>
    );
  } else if (detail.trigger === 'level-up' && !detail.customReq) {
     reqs.push(
        <div key="lvl-up" className="flex flex-col items-center justify-center mr-0.5">
            <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">Lvl</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">Up</span>
        </div>
     );
  }

  // 2. LOCATION
  if (detail.location) {
     reqs.push(
        <SimpleTooltip key="loc" text={`Location: ${detail.location.replace(/-/g, ' ')}`}>
             <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 pl-1.5 pr-2 py-0.5 rounded cursor-help transition-colors hover:bg-emerald-950/60 hover:border-emerald-500/50 w-max max-w-[100px]">
                 <MapPin size={12} className="text-emerald-400 shrink-0" />
                 <span className="text-[9px] font-mono text-emerald-200 uppercase truncate leading-none pt-[1px]">
                    {detail.location.replace('mt-', 'Mt. ').replace('moss-', '').replace('ice-', '')}
                 </span>
             </div>
        </SimpleTooltip>
     );
  }

  // 3. OBJETO
  const item = detail.item || detail.heldItem;
  if (item) {
    reqs.push(
      <SimpleTooltip key="item" text={`${tooltips.hold_item}: ${item.replace(/-/g, ' ')}`}>
         <ItemDisplay itemName={item} />
      </SimpleTooltip>
    );
  }

  // 4. STATS
  const isAffection = detail.minAffection;
  const isHappiness = detail.minHappiness;
  
  if (isHappiness || isAffection || detail.minBeauty) {
    let tooltipText = "Friendship";
    let iconColor = "text-rose-500";
    let Icon = Heart;

    if (detail.minBeauty) {
        tooltipText = `Beauty (${detail.minBeauty}+)`;
        iconColor = "text-blue-400";
        Icon = Sparkles;
    } else if (isAffection) {
        tooltipText = gen >= 8 ? "High Friendship" : "Affection (2 Hearts)";
        iconColor = "text-pink-400";
    }

    reqs.push(
      <SimpleTooltip key="happy" text={tooltipText}>
        <div className="flex flex-col items-center cursor-help animate-pulse">
            <Icon size={14} className={cn("fill-current", iconColor)} />
        </div>
      </SimpleTooltip>
    );
  }

  // 5. TIEMPO
  if (detail.timeOfDay) {
    const Icon = detail.timeOfDay === 'day' ? Sun : Moon;
    const color = detail.timeOfDay === 'day' ? "text-amber-400" : "text-indigo-400";
    reqs.push(
      <SimpleTooltip key="time" text={detail.timeOfDay === 'day' ? tooltips.day : tooltips.night}>
         <Icon size={14} className={color} />
      </SimpleTooltip>
    );
  }

  // 6. OTROS
  if (detail.knownMove || detail.knownMoveType) {
      reqs.push(
          <div key="move" className="flex flex-col items-center max-w-[60px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded">
              <span className="text-[7px] text-slate-400 uppercase text-center leading-none mb-0.5">{dict.evo_methods.move}</span>
              <span className="text-[8px] text-cyan-200 text-center leading-tight font-bold truncate w-full">
                  {detail.knownMove ? detail.knownMove.replace(/-/g, ' ') : detail.knownMoveType}
              </span>
          </div>
      );
  }
  if (detail.turnUpsideDown) reqs.push(<SpecialIcon key="inkay" icon={Smartphone} color="text-amber-400" tooltip={tooltips.upside_down} />);
  if (detail.needsOverworldRain) reqs.push(<SpecialIcon key="rain" icon={CloudRain} color="text-blue-400" tooltip={tooltips.rain} />);
  if (detail.trigger === 'shed') reqs.push(<SpecialIcon key="shed" icon={BoxSelect} color="text-purple-300" tooltip={tooltips.shed} />);

  if (detail.trigger === 'trade') {
      reqs.push(
        <div key="trade" className="flex flex-col items-center">
            <RefreshCw size={14} className="text-purple-400" />
        </div>
      );
      if (detail.tradeSpecies) {
          reqs.push(
              <span key="trade-with" className="text-[7px] uppercase border border-purple-500/30 px-1 py-0.5 rounded bg-purple-900/20 text-purple-200 truncate max-w-[50px]">
                  + {detail.tradeSpecies}
              </span>
          );
      }
  }

  if (reqs.length === 0) return <ArrowRight size={16} className="text-slate-700" />;

  return (
    <div className="flex flex-wrap justify-center items-center gap-1.5 px-2 py-1 min-w-[40px]">
        {reqs}
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function EvolutionChart({ chain, lang, activeSpecies }: Props) {
  const dict = POKEDEX_DICTIONARY[lang].labels;
  const [selectedBranchIdx, setSelectedBranchIdx] = useState(0);
  const [currentGen, setCurrentGen] = useState(9);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const flatten = (node: IEvolutionNode): IEvolutionNode[][] => {
      if (!node.evolvesTo.length) return [[node]];
      return node.evolvesTo.flatMap(child => flatten(child).map(path => [node, ...path]));
  };

  // 1. Calculamos todos los caminos posibles
  const paths = useMemo(() => chain ? flatten(chain) : [], [chain]);

  // 2. [LÓGICA AUTO-ENFOQUE] Buscar la rama que contiene al Pokémon activo
  useEffect(() => {
    if (activeSpecies && paths.length > 0) {
        const targetIndex = paths.findIndex(path => 
            path.some(node => node.speciesName.toLowerCase() === activeSpecies.toLowerCase())
        );
        if (targetIndex !== -1) {
            setSelectedBranchIdx(targetIndex);
        }
    }
  }, [activeSpecies, paths]);

  const { isSensitive, minGen } = useMemo(() => {
    if (!chain) return { isSensitive: false, minGen: 1 };
    let foundSensitive = false;
    let detectedMin = 1;
    const checkRecursive = (node: IEvolutionNode) => {
        const species = node.speciesName.toLowerCase();
        if (GEN_CONSTRAINTS[species]) {
            foundSensitive = true;
            detectedMin = Math.max(detectedMin, GEN_CONSTRAINTS[species]);
        }
        node.evolvesTo.forEach(checkRecursive);
    };
    checkRecursive(chain);
    return { isSensitive: foundSensitive, minGen: detectedMin };
  }, [chain]);
  
  const availableGens = Array.from({ length: 9 - minGen + 1 }, (_, i) => 9 - i);

  if (!chain || paths.length === 0) {
    return (
        <div className="w-full py-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/30 flex flex-col items-center justify-center text-slate-500">
            <span className="text-xs font-mono">{dict.no_evo}</span>
        </div>
    );
  }

  const isBranched = paths.length > 1;
  const currentPath = paths[selectedBranchIdx];

  return (
    <div className="w-full relative rounded-xl shadow-2xl flex flex-col">
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.9)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      </div>

      {/* CONTENT LAYER */}
      <div className="relative z-10 flex flex-col">
          
          {/* HEADER BAR */}
          <div className="bg-slate-900/90 border-b border-slate-800 p-2 backdrop-blur-sm flex items-center justify-between min-h-[42px] rounded-t-xl">
                <div className="flex items-center gap-2 pl-2">
                    <Zap size={12} className="text-cyan-500" />
                    <span className="text-[10px] font-mono font-bold text-cyan-500 uppercase tracking-widest">
                        {dict.evo_target}
                    </span>
                </div>

                <div className="flex items-center gap-3 pr-1">
                    {/* SELECTOR DE GEN */}
                    {isSensitive && (
                        <div className="relative group flex items-center bg-slate-950 border border-slate-700 rounded-sm hover:border-cyan-500/50 transition-colors shadow-sm">
                            <div className="pl-2 flex items-center pointer-events-none">
                                <History size={10} className="text-slate-400 mr-1.5" />
                                <span className="text-[9px] text-slate-500 font-mono mr-1 uppercase font-bold">GEN</span>
                            </div>
                            
                            <select 
                                id="gen-select"
                                value={currentGen}
                                onChange={(e) => setCurrentGen(Number(e.target.value))}
                                className="appearance-none bg-transparent text-[10px] font-bold text-cyan-400 focus:outline-none cursor-pointer pl-1 pr-7 py-1 uppercase tracking-wide font-mono"
                            >
                                {availableGens.map(g => (
                                    <option key={g} value={g} className="bg-slate-900 text-slate-300">
                                        Gen {GEN_ROMAN[g]}
                                    </option>
                                ))}
                            </select>
                            
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-cyan-400 transition-colors">
                                <ChevronDown size={12} strokeWidth={3} />
                            </div>
                        </div>
                    )}

                    {isBranched && (
                        <div className="flex gap-1 border-l border-slate-700 pl-3">
                            <button 
                                disabled={selectedBranchIdx === 0}
                                onClick={() => setSelectedBranchIdx(p => p - 1)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 transition-colors group"
                            >
                                <ChevronRight size={12} className="rotate-180 text-cyan-400 group-disabled:text-slate-600" />
                            </button>
                            <button 
                                disabled={selectedBranchIdx === paths.length - 1}
                                onClick={() => setSelectedBranchIdx(p => p + 1)}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 transition-colors group"
                            >
                                <ChevronRight size={12} className="text-cyan-400 group-disabled:text-slate-600" />
                            </button>
                        </div>
                    )}
                </div>
          </div>
          
          {/* TABS */}
          {isBranched && (
            <div className="bg-slate-900/50 border-b border-slate-800 p-1 flex gap-2 overflow-x-auto custom-scrollbar justify-center">
                {paths.map((path, idx) => {
                    const node = path[path.length - 1]; 
                    const isActive = selectedBranchIdx === idx;
                    const iconSrc = imgError[node.speciesName + '_icon'] ? '/fallback.png' : (node.icon || node.sprite);

                    return (
                        <button
                            key={idx}
                            onClick={() => setSelectedBranchIdx(idx)}
                            className={cn(
                                "relative group rounded border transition-all duration-300 w-8 h-8 flex items-center justify-center overflow-hidden bg-slate-900",
                                isActive 
                                    ? "border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.2)]" 
                                    : "border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100"
                            )}
                            title={node.speciesName}
                        >
                            <Image 
                                src={iconSrc} alt={node.speciesName} fill 
                                className="object-contain p-0.5 rendering-pixelated" unoptimized
                                onError={() => setImgError(prev => ({...prev, [node.speciesName + '_icon']: true}))}
                            />
                        </button>
                    );
                })}
            </div>
          )}

          {/* CHART BODY */}
          <div className="px-4 py-12 flex justify-center items-center overflow-x-auto custom-scrollbar min-h-[160px]">
             <div className="flex items-center gap-0 w-full justify-center">
                {currentPath.map((node, i) => {
                    const isLast = i === currentPath.length - 1;
                    const nextNode = currentPath[i+1];
                    const imgSrc = imgError[node.speciesName] ? '/fallback.png' : node.sprite;
                    
                    const relevantDetails = nextNode 
                        ? getOptimizedEvolutionDetail(nextNode.speciesName, nextNode.details, currentGen)
                        : [];

                    return (
                        <div key={i} className="flex items-center">
                            <div className="flex flex-col items-center gap-2 relative group/node z-10 hover:z-40">
                                <div className="relative w-20 h-20 md:w-24 md:h-24 bg-slate-900/80 border border-slate-700 rounded-lg flex items-center justify-center shadow-lg transition-all duration-500 backdrop-blur-md group-hover/node:border-cyan-500/50 group-hover/node:shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.03),transparent)] rounded-lg" />
                                    <Image 
                                        src={imgSrc} alt={node.speciesName} width={96} height={96}
                                        className="object-contain z-10 drop-shadow-xl transition-transform duration-300 group-hover/node:scale-110 p-2"
                                        unoptimized onError={() => setImgError(prev => ({...prev, [node.speciesName]: true}))}
                                    />
                                    {isSensitive && GEN_CONSTRAINTS[node.speciesName.toLowerCase()] && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-950 border border-cyan-500 rounded-full flex items-center justify-center z-20" title="Evolution mechanics change">
                                            <History size={6} className="text-cyan-400" />
                                        </div>
                                    )}
                                </div>
                                
                                <div className="text-center">
                                    <h4 className="text-[10px] md:text-xs font-display font-bold uppercase tracking-wider text-slate-300 group-hover/node:text-cyan-400 transition-colors">
                                        {node.speciesName}
                                    </h4>
                                </div>
                            </div>

                            {!isLast && nextNode && (
                                <div className="flex flex-col items-center px-1 md:px-2 relative z-30">
                                    <div className="w-full absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[1px] bg-slate-800 -z-10">
                                        <div className="w-full h-full bg-gradient-to-r from-transparent via-cyan-900 to-transparent" />
                                    </div>
                                    <div className="bg-slate-950 border border-slate-800 rounded shadow-lg relative transition-transform hover:scale-105 hover:border-cyan-500/30">
                                        <EvolutionTriggerDisplay details={relevantDetails} lang={lang} gen={currentGen} />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
             </div>
          </div>
      </div>
    </div>
  );
}