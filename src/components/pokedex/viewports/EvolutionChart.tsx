'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, Zap, Heart, Sun, Moon, RefreshCw, 
  Smartphone, CloudRain, BoxSelect,
  CircleHelp, History, MapPin, ChevronDown, ChevronRight, Users, Scale, Lock, Dna, Package
} from 'lucide-react';
import { IEvolutionNode, IEvolutionDetail } from '@/types/interfaces';
import { Lang, POKEDEX_DICTIONARY } from '@/lib/pokedexDictionary';
import { cn } from '@/lib/utils';

// --- CONFIGURACIÓN: DATA GENERACIONAL ---
const GEN_CONSTRAINTS: Record<string, number> = {
  'magnezone': 4, 'probopass': 4, 'leafeon': 4, 'glaceon': 4,
  'vikavolt': 7, 'crabominable': 7, 'sylveon': 6, 'milotic': 3,
  'runerigus': 8, 'sirfetchd': 8, 'overqwil': 8, 'sneasler': 8,
  'basculegion': 8, 'kleavor': 8, 'ursaluna': 8, 'wyrdeer': 8,
  'annihilape': 9, 'kingambit': 9, 'dudunsparce': 9, 'farigiraf': 9
};

const GEN_ROMAN: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX'
};

// --- ESTRATEGIA 1: AISLAMIENTO ESTRICTO ---
// Define qué variantes pueden ver a quién.
const STRICT_ISOLATION: Record<string, string[]> = {
  'rattata-alola': ['raticate-alola'],
  'sandshrew-alola': ['sandslash-alola'],
  'vulpix-alola': ['ninetales-alola'],
  'diglett-alola': ['dugtrio-alola'],
  'meowth-alola': ['persian-alola'],
  'geodude-alola': ['graveler-alola', 'golem-alola'],
  'grimer-alola': ['muk-alola'],
  'meowth-galar': ['perrserker'],
  'ponyta-galar': ['rapidash-galar'],
  'slowpoke-galar': ['slowbro-galar', 'slowking-galar'], 
  'farfetchd-galar': ['sirfetchd'],
  'mr-mime-galar': ['mr-rime'],
  'corsola-galar': ['cursola'],
  'zigzagoon-galar': ['linoone-galar', 'obstagoon'],
  'darumaka-galar': ['darmanitan-galar'],
  'yamask-galar': ['runerigus'],
  'growlithe-hisui': ['arcanine-hisui'],
  'voltorb-hisui': ['electrode-hisui'],
  'qwilfish-hisui': ['overqwil'],
  'sneasel-hisui': ['sneasler'],
  'zorua-hisui': ['zoroark-hisui'],
  'basculin-white-striped': ['basculegion'],
  'sliggoo-hisui': ['goodra-hisui'], // CLAVE: Aquí definimos la rama Hisui de Sliggoo
  'wooper-paldea': ['clodsire'],
  
  // Clean Bases (Evitan contaminación cruzada)
  'meowth': ['persian'],
  'slowpoke': ['slowbro', 'slowking'],
  'wooper': ['quagsire'],
  'sneasel': ['weavile'],
  'zigzagoon': ['linoone'],
  'yamask': ['cofagrigus'],
  'mr-mime': [] 
};

// --- ESTRATEGIA 2: RAMIFICACIÓN ARTIFICIAL ---
// Inyecta opciones de evolución donde no existen naturalmente en la API base
const REGIONAL_BRANCHING: Record<string, string[]> = {
  'pikachu': ['raichu', 'raichu-alola'],
  'exeggcute': ['exeggutor', 'exeggutor-alola'],
  'cubone': ['marowak', 'marowak-alola'],
  'koffing': ['weezing', 'weezing-galar'],
  'mime-jr': ['mr-mime', 'mr-mime-galar'],
  'quilava': ['typhlosion', 'typhlosion-hisui'],
  'dewott': ['samurott', 'samurott-hisui'],
  'petilil': ['lilligant', 'lilligant-hisui'],
  'rufflet': ['braviary', 'braviary-hisui'],
  'goomy': ['sliggoo'], 
  'sliggoo': ['goodra', 'goodra-hisui'], // CLAVE: Sliggoo se divide en Goodra y Goodra Hisui
  'bergmite': ['avalugg', 'avalugg-hisui'],
  'dartrix': ['decidueye', 'decidueye-hisui'],
  'kubfu': ['urshifu-single-strike', 'urshifu-rapid-strike'],
  'rockruff': ['lycanroc-midday', 'lycanroc-midnight', 'lycanroc-dusk']
};

// --- FUENTE DE VERDAD DE IDs ---
interface RegionData { id: number; base?: number; }

const REGIONAL_DATA: Record<string, RegionData> = {
  // ALOLA
  'rattata-alola': { id: 10091, base: 19 }, 'raticate-alola': { id: 10092, base: 20 },
  'sandshrew-alola': { id: 10101, base: 27 }, 'sandslash-alola': { id: 10102, base: 28 },
  'vulpix-alola': { id: 10103, base: 37 }, 'ninetales-alola': { id: 10104, base: 38 },
  'diglett-alola': { id: 10105, base: 50 }, 'dugtrio-alola': { id: 10106, base: 51 },
  'meowth-alola': { id: 10107, base: 52 }, 'persian-alola': { id: 10108, base: 53 },
  'geodude-alola': { id: 10109, base: 74 }, 'graveler-alola': { id: 10110, base: 75 }, 'golem-alola': { id: 10111, base: 76 },
  'grimer-alola': { id: 10112, base: 88 }, 'muk-alola': { id: 10113, base: 89 },
  'raichu-alola': { id: 10100, base: 26 }, 'marowak-alola': { id: 10115, base: 105 }, 'exeggutor-alola': { id: 10114, base: 103 },
  
  // GALAR
  'meowth-galar': { id: 10161, base: 52 }, 'perrserker': { id: 863 }, 
  'ponyta-galar': { id: 10162, base: 77 }, 'rapidash-galar': { id: 10163, base: 78 },
  'slowpoke-galar': { id: 10164, base: 79 }, 'slowbro-galar': { id: 10165, base: 80 }, 'slowking-galar': { id: 10172, base: 199 },
  'farfetchd-galar': { id: 10166, base: 83 }, 'sirfetchd': { id: 865 },
  'weezing-galar': { id: 10167, base: 110 },
  'mr-mime-galar': { id: 10168, base: 122 }, 'mr-rime': { id: 866 },
  'corsola-galar': { id: 10173, base: 222 }, 'cursola': { id: 864 },
  'zigzagoon-galar': { id: 10174, base: 263 }, 'linoone-galar': { id: 10175, base: 264 }, 'obstagoon': { id: 862 },
  'darumaka-galar': { id: 10176, base: 554 }, 'darmanitan-galar': { id: 10177, base: 555 },
  'yamask-galar': { id: 10179, base: 562 }, 'runerigus': { id: 867 },
  'stunfisk-galar': { id: 10180, base: 618 },

  // HISUI
  'growlithe-hisui': { id: 10229, base: 58 }, 'arcanine-hisui': { id: 10230, base: 59 },
  'voltorb-hisui': { id: 10231, base: 100 }, 'electrode-hisui': { id: 10232, base: 101 },
  'typhlosion-hisui': { id: 10233, base: 157 }, 
  'qwilfish-hisui': { id: 10234, base: 211 }, 'overqwil': { id: 904 },
  'sneasel-hisui': { id: 10235, base: 215 }, 'sneasler': { id: 903 },
  'samurott-hisui': { id: 10236, base: 503 },
  'lilligant-hisui': { id: 10237, base: 549 },
  'zorua-hisui': { id: 10238, base: 570 }, 'zoroark-hisui': { id: 10239, base: 571 },
  'braviary-hisui': { id: 10240, base: 628 },
  'sliggoo-hisui': { id: 10241, base: 705 }, 'goodra-hisui': { id: 10242, base: 706 },
  'avalugg-hisui': { id: 10243, base: 713 },
  'decidueye-hisui': { id: 10244, base: 724 },
  'basculin-white-striped': { id: 10247, base: 550 }, 'basculegion': { id: 902 },
  'wyrdeer': { id: 899 }, 'kleavor': { id: 900 }, 'ursaluna': { id: 901 },

  // PALDEA
  'wooper-paldea': { id: 10253, base: 194 }, 'clodsire': { id: 980 }, 'tauros-paldea': { id: 10254, base: 128 },

  // SPECIALS
  'urshifu-single-strike': { id: 892 }, 'urshifu-rapid-strike': { id: 10191, base: 892 },
  'lycanroc-midday': { id: 745 }, 
  'lycanroc-midnight': { id: 10126, base: 745 }, 
  'lycanroc-dusk': { id: 10152, base: 745 }, 
  'rockruff-own-tempo': { id: 10151, base: 744 }
};

type LocType = 'magnetic' | 'moss' | 'ice' | 'coronet' | null;
const detectLocationType = (locId: string): LocType => {
    const id = locId.toLowerCase();
    if (id.includes('magnetic') || id.includes('chargestone') || id.includes('new-mauville') || id.includes('kalos-route-13') || id.includes('vast-poni') || id.includes('coronet')) return 'magnetic';
    if (id.includes('moss') || id.includes('eterna') || id.includes('pinwheel') || id.includes('kalos-route-20') || id.includes('petalburg') || id.includes('lush-jungle') || id.includes('heartwood')) return 'moss';
    if (id.includes('ice') || id.includes('twist') || id.includes('frost') || id.includes('shoal') || id.includes('lanakila') || id.includes('route-217') || id.includes('avalugg') || id.includes('icepeak')) return 'ice';
    return null;
};

interface Props {
  chain?: IEvolutionNode;
  lang: Lang;
  activeSpecies?: string; 
}

// --- MOTOR LÓGICO DE URLS ---
const getPokemonUrl = (node: IEvolutionNode, lang: Lang) => {
    if (node.variantId) {
        if (node.variantId >= 10000) {
             const base = node.speciesId; 
             return `/${lang}/pokedex/${base}?variant=${node.variantId}`;
        }
        else {
            return `/${lang}/pokedex/${node.variantId}`;
        }
    }

    if (node.speciesId) {
        return `/${lang}/pokedex/${node.speciesId}`;
    }

    if (node.url) {
        const urlParts = node.url.split('/').filter(Boolean);
        const id = urlParts[urlParts.length - 1];
        return `/${lang}/pokedex/${id}`;
    }

    return '#';
};

// --- PREPROCESADOR DEL ÁRBOL ---
const preprocessRegionalChain = (chain: IEvolutionNode, activeSpecies?: string): IEvolutionNode | null => {
    if (!activeSpecies) return chain;
    let active = activeSpecies.toLowerCase();
    
    if (active.includes('raticate-totem')) active = 'raticate-alola';
    if (active === 'phione') return { ...chain, speciesName: active, evolvesTo: [] };

    let processedChain = JSON.parse(JSON.stringify(chain));

    const traverseAndTransform = (node: IEvolutionNode, isRoot: boolean): IEvolutionNode => {
        let currentName = node.speciesName.toLowerCase();

        // 1. RAMIFICACIÓN ARTIFICIAL (Antes de cualquier cambio)
        // Crea las ramas Goodra / Goodra Hisui desde Sliggoo
        if (REGIONAL_BRANCHING[currentName]) {
            const targets = REGIONAL_BRANCHING[currentName];
            const originalChildren = node.evolvesTo || [];
            const newChildren: IEvolutionNode[] = [];

            targets.forEach(target => {
                let match = originalChildren.find(c => c.speciesName.toLowerCase() === target);
                if (!match) {
                    const baseMatch = originalChildren.find(c => target.includes(c.speciesName.toLowerCase()));
                    if (baseMatch) {
                        const cloned = JSON.parse(JSON.stringify(baseMatch));
                        cloned.speciesName = target;
                        match = cloned;
                    }
                }
                if (match) newChildren.push(match);
            });

            if (currentName === 'rockruff') {
                 if (active === 'rockruff-own-tempo' || active === 'lycanroc-dusk') {
                     node.evolvesTo = newChildren.filter(c => c.speciesName === 'lycanroc-dusk');
                 } else {
                     node.evolvesTo = newChildren.filter(c => c.speciesName !== 'lycanroc-dusk');
                 }
            } else if (newChildren.length > 0) {
                node.evolvesTo = newChildren;
            }
        }

        // 2. LÓGICA DE AISLAMIENTO Y TRANSFORMACIÓN (SOLUCIÓN SLIGGOO)
        // Eliminado "isRoot" para permitir que formas intermedias como Sliggoo
        // se transformen a Sliggoo-Hisui si el objetivo final lo requiere.
        let isolationKey: string | null = null;
        
        for (const [key, targets] of Object.entries(STRICT_ISOLATION)) {
            if (active === key || targets.includes(active)) {
                // Si la llave de aislamiento (ej. sliggoo-hisui) contiene el nombre actual (sliggoo)
                // y no son iguales, aplicamos la transformación.
                if (currentName !== key && key.includes(currentName)) {
                        currentName = key;
                        node.speciesName = key;
                        isolationKey = key;
                } else if (currentName === key) {
                    isolationKey = key;
                }
                break;
            }
        }

        // Fallback: Si no hay match específico, busca si la base tiene restricciones (para limpiar ramas cruzadas)
        if (!isolationKey && STRICT_ISOLATION[currentName]) {
            isolationKey = currentName;
        }

        if (isolationKey) {
            const allowedChildren = STRICT_ISOLATION[isolationKey];
            if (node.evolvesTo) {
                node.evolvesTo.forEach((child: IEvolutionNode) => {
                    const cBase = child.speciesName.toLowerCase();
                    const regionalMatch = allowedChildren.find(ac => ac.includes(cBase) && ac !== cBase);
                    if (regionalMatch) child.speciesName = regionalMatch;
                });
                node.evolvesTo = node.evolvesTo.filter((child: IEvolutionNode) => 
                    allowedChildren.includes(child.speciesName.toLowerCase()) || 
                    allowedChildren.some(ac => ac.includes(child.speciesName.toLowerCase()))
                );
            }
        }

        // 3. RECURSIÓN
        if (node.evolvesTo) {
            node.evolvesTo = node.evolvesTo.map((child: IEvolutionNode) => traverseAndTransform(child, false));
        }

        // 4. INYECCIÓN DE DATOS VISUALES (SPRITES + ICONOS)
        // Se ejecuta al final para aplicar la imagen correcta al nombre definitivo.
        if (REGIONAL_DATA[currentName]) {
            const data = REGIONAL_DATA[currentName];
            node.variantId = data.id; 
            if (data.base) {
                node.speciesId = data.base; 
            }
            node.sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`;
            // FIX: Actualizamos el icono para que las pestañas muestren la miniatura correcta
            node.icon = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${data.id}.png`;
        }

        return node;
    };

    return traverseAndTransform(processedChain, true);
};

// ... UI HELPERS ...

const getOptimizedEvolutionDetail = (speciesName: string, allDetails: IEvolutionDetail[], gen: number): IEvolutionDetail[] => {
  if (!allDetails || allDetails.length === 0) return [];
  const species = speciesName.toLowerCase();

  if (species === 'urshifu-single-strike') return [{ trigger: 'item', item: 'scroll-of-darkness' } as IEvolutionDetail];
  if (species === 'urshifu-rapid-strike') return [{ trigger: 'item', item: 'scroll-of-waters' } as IEvolutionDetail];

  if (species === 'persian-alola') return filterBy(allDetails, d => d.minHappiness !== null) || allDetails;
  if (species === 'raticate-alola') return filterBy(allDetails, d => d.timeOfDay === 'night' && d.minLevel === 20) || allDetails;
  if (species === 'sandslash-alola' || species === 'ninetales-alola') return filterBy(allDetails, d => d.item?.includes('ice-stone') ?? false) || allDetails;
  if (species === 'raichu-alola') return filterBy(allDetails, d => d.item?.includes('thunder-stone') ?? false) || allDetails;
  if (species === 'marowak-alola') return filterBy(allDetails, d => d.minLevel === 28 && d.timeOfDay === 'night') || allDetails;
  if (species === 'exeggutor-alola') return filterBy(allDetails, d => d.item?.includes('leaf-stone') ?? false) || allDetails;
  if (species === 'muk-alola') return filterBy(allDetails, d => d.minLevel === 38) || allDetails;
  if (species === 'golem-alola') return filterBy(allDetails, d => d.trigger === 'trade') || allDetails;
  if (species === 'graveler-alola') return filterBy(allDetails, d => d.minLevel === 25) || allDetails;

  if (species === 'rapidash-galar') return filterBy(allDetails, d => d.minLevel === 40) || allDetails;
  if (species === 'slowbro-galar') return filterBy(allDetails, d => d.item?.includes('galarica-cuff') ?? false) || allDetails;
  if (species === 'slowking-galar') return filterBy(allDetails, d => d.item?.includes('galarica-wreath') ?? false) || allDetails;
  if (species === 'darmanitan-galar') return filterBy(allDetails, d => d.item?.includes('ice-stone') ?? false) || allDetails;
  if (species === 'linoone-galar') return filterBy(allDetails, d => d.minLevel === 20) || allDetails;
  if (species === 'obstagoon') return filterBy(allDetails, d => d.timeOfDay === 'night' && d.minLevel === 35) || allDetails;
  if (species === 'mr-rime') return filterBy(allDetails, d => d.minLevel === 42) || allDetails;
  if (species === 'cursola') return filterBy(allDetails, d => d.minLevel === 38) || allDetails;
  if (species === 'perrserker') return filterBy(allDetails, d => d.minLevel === 28) || allDetails;

  if (species === 'electrode-hisui') return filterBy(allDetails, d => d.item?.includes('leaf-stone') ?? false) || allDetails;
  if (species === 'arcanine-hisui') return filterBy(allDetails, d => d.item?.includes('fire-stone') ?? false) || allDetails;
  if (species === 'avalugg-hisui') return filterBy(allDetails, d => d.item?.includes('ice-stone') ?? false) || allDetails;
  if (species === 'zoroark-hisui') return filterBy(allDetails, d => d.minLevel === 30) || allDetails;
  if (species === 'goodra-hisui') return filterBy(allDetails, d => d.minLevel === 50) || allDetails;
  if (species === 'braviary-hisui') return filterBy(allDetails, d => d.minLevel === 54) || allDetails;
  if (species === 'lilligant-hisui') return filterBy(allDetails, d => d.item?.includes('sun-stone') ?? false) || allDetails;
  if (species === 'overqwil') return filterBy(allDetails, d => d.knownMoveType === 'poison' || d.minLevel != null) || allDetails;
  if (species === 'sneasler') return filterBy(allDetails, d => d.item?.includes('razor-claw') ?? false) || allDetails;
  if (species === 'basculegion') return filterBy(allDetails, d => d.gender !== 3) || allDetails;

  if (species === 'lycanroc-dusk') return filterBy(allDetails, d => d.timeOfDay === 'dusk' || d.minLevel === 25) || allDetails;
  if (species === 'lycanroc-midday') return filterBy(allDetails, d => d.timeOfDay === 'day') || allDetails;
  if (species === 'lycanroc-midnight') return filterBy(allDetails, d => d.timeOfDay === 'night') || allDetails;

  if (['magnezone', 'probopass', 'vikavolt'].includes(species)) {
    if (gen >= 8) return filterBy(allDetails, d => d.item?.includes('thunder-stone') ?? false) || allDetails;
    return filterBy(allDetails, d => d.location !== null && d.location !== undefined) || allDetails;
  }
  if (species === 'leafeon') {
    if (gen >= 8) return filterBy(allDetails, d => d.item?.includes('leaf-stone') ?? false) || allDetails;
    return filterBy(allDetails, d => d.location !== null && d.location !== undefined) || allDetails;
  }
  if (species === 'glaceon') {
    if (gen >= 8) return filterBy(allDetails, d => d.item?.includes('ice-stone') ?? false) || allDetails;
    return filterBy(allDetails, d => d.location !== null && d.location !== undefined) || allDetails;
  }
  if (species === 'crabominable') {
    if (gen === 9) return filterBy(allDetails, d => d.item?.includes('ice-stone') ?? false) || allDetails;
    if (gen === 8) {
         const dualDetails = allDetails.filter(d => (d.item?.includes('ice-stone') ?? false) || (d.location !== null));
         return dualDetails.length > 0 ? dualDetails : allDetails;
    }
    return filterBy(allDetails, d => d.location !== null && d.location !== undefined) || allDetails;
  }
  if (species === 'milotic') {
    if (gen >= 5) return filterBy(allDetails, d => d.trigger === 'trade' && ((d.item?.includes('prism-scale') ?? false) || (d.heldItem?.includes('prism-scale') ?? false))) || allDetails;
    else return filterBy(allDetails, d => d.minBeauty != null) || allDetails;
  }
  
  return allDetails;
};

const filterBy = (list: IEvolutionDetail[], predicate: (d: IEvolutionDetail) => boolean) => {
  const filtered = list.filter(predicate);
  return filtered.length > 0 ? filtered : null;
};

const getFormBranchBadge = (targetSpecies: string, lang: Lang): string | null => {
    const safeLang = lang as keyof typeof POKEDEX_DICTIONARY;
    const s = targetSpecies.toLowerCase();
    const cond = POKEDEX_DICTIONARY[safeLang].labels.evo_conditions;
    
    if (['runerigus', 'sirfetchd', 'perrserker', 'cursola', 'mrrime'].includes(s)) return cond.galar_only;
    if (['sneasler', 'overqwil', 'basculegion', 'wyrdeer', 'kleavor', 'ursaluna'].includes(s)) return cond.hisui_only;
    if (['clodsire'].includes(s)) return cond.paldea_only;
    
    if (s.includes('-alola')) return 'ALOLA';
    if (s.includes('-galar')) return 'GALAR';
    if (s.includes('-hisui')) return 'HISUI';
    if (s.includes('-paldea')) return 'PALDEA';
    if (s === 'lycanroc-dusk') return 'DUSK';
    if (s === 'lycanroc-midday') return 'DAY';
    if (s === 'lycanroc-midnight') return 'NIGHT';
    if (s.includes('urshifu')) return 'TOWER';

    return null;
};

const SimpleTooltip = ({ children, text }: { children: React.ReactNode; text: string }) => (
  <div className="relative group/tooltip inline-block z-50 hover:z-[100]">
    {children}
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-max max-w-[200px] bg-slate-900 text-cyan-50 text-[10px] font-mono px-3 py-2 rounded border border-cyan-500/30 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none shadow-[0_4px_20px_rgba(0,0,0,0.9)] whitespace-normal text-center z-[9999]">
      {text}
      <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-cyan-500/30" />
    </div>
  </div>
);

const ItemDisplay = ({ itemName }: { itemName: string }) => {
  const [error, setError] = useState(false);
  const itemUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemName}.png`;
  if (error) return <div className="w-6 h-6 flex items-center justify-center bg-slate-800 rounded-full border border-slate-700"><Package size={12} className="text-slate-400" /></div>;
  return <div className="w-6 h-6 relative"><Image src={itemUrl} alt={itemName} fill className="object-contain drop-shadow-lg" unoptimized onError={() => setError(true)}/></div>;
};

const SpecialIcon = ({ icon: Icon, color, tooltip }: { icon: any, color: string, tooltip: string }) => (
    <SimpleTooltip text={tooltip}><div className={cn("p-1 rounded-full bg-slate-900 border border-slate-700", color)}><Icon size={12} /></div></SimpleTooltip>
);

const LocationBadge = ({ locId, gen, lang }: { locId: string, gen: number, lang: Lang }) => {
    const safeLang = lang as keyof typeof POKEDEX_DICTIONARY;
    const locations = POKEDEX_DICTIONARY[safeLang].labels.evo_locations;
    const locType = detectLocationType(locId);
    let tooltipText = `Location: ${locId.replace(/-/g, ' ').toUpperCase()}`;
    let displayLabel = locId.replace(/-/g, ' ').toUpperCase();
     
    if (locType === 'magnetic') {
        // @ts-ignore
        tooltipText = locations.magnetic_field.tooltip[gen] || "Not Available in this Gen"; displayLabel = locations.magnetic_field.label;
    } else if (locType === 'moss') {
        // @ts-ignore
        tooltipText = locations.moss_rock.tooltip[gen] || "Not Available in this Gen"; displayLabel = locations.moss_rock.label;
    } else if (locType === 'ice') {
        // @ts-ignore
        tooltipText = locations.ice_rock.tooltip[gen] || "Not Available in this Gen"; displayLabel = locations.ice_rock.label;
    } else if (locId.includes('coronet')) {
        // @ts-ignore
        tooltipText = locations.mt_coronet.tooltip[gen] || "Not Available in this Gen"; displayLabel = locations.mt_coronet.label;
    }

    return (
        <SimpleTooltip text={tooltipText}>
             <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 pl-1.5 pr-2 py-0.5 rounded cursor-help transition-colors hover:bg-emerald-950/60 hover:border-emerald-500/50 w-max max-w-[100px]">
                 <MapPin size={12} className="text-emerald-400 shrink-0" />
                 <span className="text-[8px] font-mono text-emerald-200 uppercase truncate leading-none pt-[1px]">{displayLabel}</span>
             </div>
        </SimpleTooltip>
    );
};

const EvolutionTriggerDisplay = ({ details, lang, gen, targetSpecies }: { details: IEvolutionDetail[]; lang: Lang; gen: number; targetSpecies: string }) => {
  const safeLang = lang as keyof typeof POKEDEX_DICTIONARY;
  const dict = POKEDEX_DICTIONARY[safeLang].labels;
  const conditions = POKEDEX_DICTIONARY[safeLang].labels.evo_conditions;
  const tooltips = POKEDEX_DICTIONARY[safeLang].labels.evo_tooltips;
  const overrides = POKEDEX_DICTIONARY[safeLang].labels.evo_overrides;
  
  if (!details || details.length === 0) return <ArrowRight size={16} className="text-slate-700" />;

  if (targetSpecies.toLowerCase() === 'crabominable' && gen === 8) {
      const hisuiDetail = details.find(d => d.location);
      const galarDetail = details.find(d => d.item?.includes('ice-stone'));
      return (
          <div className="flex flex-col gap-1.5 py-1 px-2 border-l-2 border-slate-700/50 my-1 relative transition-all hover:z-[50]">
              {hisuiDetail && <div className="flex items-center gap-2 group relative z-20"><span className="text-[7px] font-bold text-emerald-400 w-8 text-right tracking-tighter">HISUI</span><LocationBadge locId={hisuiDetail.location!} gen={gen} lang={lang} /></div>}
              {hisuiDetail && galarDetail && <div className="h-[1px] w-full bg-slate-800" />}
              {galarDetail && <div className="flex items-center gap-2 group relative z-10"><span className="text-[7px] font-bold text-cyan-400 w-8 text-right tracking-tighter">GALAR</span><SimpleTooltip text="Use: Ice Stone"><ItemDisplay itemName="ice-stone" /></SimpleTooltip></div>}
          </div>
      );
  }

  if (['polteageist', 'sinistcha'].includes(targetSpecies.toLowerCase())) {
      const teaItems = ['cracked-pot', 'chipped-pot', 'unremarkable-teacup', 'masterpiece-teacup'];
      const validTeaDetails = details.filter(d => d.item && teaItems.includes(d.item));
      const itemsToRender = validTeaDetails.length > 0 ? validTeaDetails.map(d => d.item!) : 
          (targetSpecies.toLowerCase() === 'polteageist' ? ['cracked-pot', 'chipped-pot'] : ['unremarkable-teacup', 'masterpiece-teacup']);

      return (
          <div className="flex flex-col gap-1 items-center py-1 hover:z-[100] relative">
              {itemsToRender.map((item, idx) => (
                  <div key={item} className="flex flex-col items-center group relative z-10 hover:z-50">
                      {idx > 0 && <span className="text-[6px] font-bold text-slate-500 my-0.5">OR</span>}
                      <SimpleTooltip text={(overrides as Record<string, string>)[item] || item}><ItemDisplay itemName={item} /></SimpleTooltip>
                  </div>
              ))}
          </div>
      );
  }

  const detail = details[0]; 
  const reqs = [];
  const formBadge = getFormBranchBadge(targetSpecies, lang);
  if (formBadge) reqs.push(<div key="badge" className="w-full flex justify-center mb-1"><span className="text-[7px] font-bold uppercase bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-900/50">{formBadge}</span></div>);

  const itemKey = detail.item || detail.heldItem;
  const overrideText = itemKey ? (overrides as Record<string, string>)[itemKey] : null;

  if (overrideText) {
      reqs.push(<SimpleTooltip key="override" text={overrideText}><ItemDisplay itemName={itemKey!} /></SimpleTooltip>);
  } else {
      if (detail.minLevel) {
        if (targetSpecies.toLowerCase() === 'goodra' && detail.minLevel === 50) {
            reqs.push(<SimpleTooltip key="goodra" text={overrides.goodra_hisui}><div className="flex flex-col items-center leading-none"><span className="text-[7px] font-mono text-slate-500 uppercase mb-0.5">{dict.evo_methods.level}</span><span className="text-lg font-display font-bold text-white">{detail.minLevel}</span><span className="text-[7px] text-cyan-400 mt-0.5 font-bold">HISUI</span></div></SimpleTooltip>);
        } else {
            reqs.push(<div key="lvl" className="flex flex-col items-center leading-none"><span className="text-[7px] font-mono text-slate-500 uppercase mb-0.5">{dict.evo_methods.level}</span><span className="text-lg font-display font-bold text-white">{detail.minLevel}</span></div>);
        }
      } else if (detail.trigger === 'level-up' && !detail.customReq && !detail.minHappiness && !detail.minBeauty && !detail.minAffection && !detail.location && !detail.relativePhysicalStats && !detail.partySpecies && !detail.partyType && !detail.knownMove) {
         reqs.push(<div key="lvl-up" className="flex flex-col items-center justify-center mr-0.5"><span className="text-[8px] font-bold text-slate-400 uppercase leading-none">Lvl</span><span className="text-[8px] font-bold text-slate-400 uppercase leading-none">Up</span></div>);
      }
      if (itemKey && !((overrides as Record<string, string>)[itemKey])) {
        reqs.push(<SimpleTooltip key="item" text={`${detail.item ? dict.evo_methods.item : tooltips.hold_item}: ${itemKey.replace(/-/g, ' ')}`}><ItemDisplay itemName={itemKey} /></SimpleTooltip>);
      }
  }

  if (detail.customReq) reqs.push(<SimpleTooltip key="custom" text={detail.customReq}><div className="p-1 rounded-sm bg-cyan-950/30 border border-cyan-500/50 hover:bg-cyan-900/80 transition-colors cursor-help group shadow-[0_0_8px_rgba(34,211,238,0.1)]"><CircleHelp size={14} className="text-cyan-400 group-hover:text-cyan-200" /></div></SimpleTooltip>);
  if (detail.location) reqs.push(<LocationBadge key="loc" locId={detail.location} gen={gen} lang={lang} />);
  if (detail.relativePhysicalStats !== undefined && detail.relativePhysicalStats !== null) {
      const statMap: Record<number, string> = { 1: conditions.atk_gt_def, [-1]: conditions.atk_lt_def, 0: conditions.atk_eq_def };
      reqs.push(<div key="stats" className="flex items-center gap-1 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded" title={statMap[detail.relativePhysicalStats]}><Scale size={12} className="text-amber-400" /><span className="text-[8px] font-bold text-amber-200 whitespace-nowrap">{statMap[detail.relativePhysicalStats]}</span></div>);
  }
  if (detail.partySpecies) reqs.push(<SimpleTooltip key="party-sp" text={`${conditions.party_remoraid} (${detail.partySpecies})`}><div className="flex flex-col items-center"><Users size={14} className="text-blue-400" /><div className="relative w-4 h-4 mt-0.5"><Image src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${detail.partySpecies === 'remoraid' ? 223 : 0}.png`} alt={detail.partySpecies} fill className="object-contain" unoptimized /></div></div></SimpleTooltip>);
  if (detail.partyType) reqs.push(<SimpleTooltip key="party-ty" text={conditions.party_dark}><div className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded flex items-center gap-1"><Users size={10} className="text-slate-400" /><span className="text-[8px] uppercase text-slate-200 font-bold">{detail.partyType}</span></div></SimpleTooltip>);
  
  if (detail.minHappiness || detail.minAffection || detail.minBeauty) {
    let label = lang === 'es' ? "AMISTAD" : "FRIEND";
    if (detail.minBeauty) label = lang === 'es' ? "BELLEZA" : "BEAUTY";
    else if (detail.minAffection) label = lang === 'es' ? "AFECTO" : "AFFECT";
    reqs.push(<SimpleTooltip key="happy" text={dict.evo_methods.happiness}><div className="flex flex-col items-center justify-center cursor-help group/happy min-w-[35px]"><span className="text-[7px] font-mono text-slate-500 uppercase mb-0.5">Lvl Up</span><Heart size={14} className={cn("fill-current mb-[2px] transition-transform group-hover/happy:scale-110", detail.minBeauty ? "text-blue-400" : (detail.minAffection ? "text-pink-400" : "text-rose-500"))} /><span className="text-[6px] font-display font-bold uppercase text-slate-300 leading-none tracking-wide text-center">{label}</span></div></SimpleTooltip>);
  }

  if (detail.timeOfDay) reqs.push(<SimpleTooltip key="time" text={detail.timeOfDay === 'day' ? tooltips.day : tooltips.night}><div className={cn("p-1 rounded-full bg-slate-900 border border-slate-700", detail.timeOfDay === 'day' ? "text-amber-400" : "text-indigo-400")}>{detail.timeOfDay === 'day' ? <Sun size={12} /> : <Moon size={12} />}</div></SimpleTooltip>);
  if (['solgaleo', 'lunala'].includes(targetSpecies.toLowerCase())) reqs.push(<SimpleTooltip key="cosmo" text={targetSpecies.toLowerCase() === 'solgaleo' ? overrides.cosmoem_sun : overrides.cosmoem_moon}><div className={cn("p-1 rounded bg-slate-800 border", targetSpecies.toLowerCase() === 'solgaleo' ? "border-orange-500 text-orange-400" : "border-indigo-500 text-indigo-400")}>{targetSpecies.toLowerCase() === 'solgaleo' ? <Sun size={12} /> : <Moon size={12} />}</div></SimpleTooltip>);
  if (detail.knownMove || detail.knownMoveType) reqs.push(<div key="move" className="flex flex-col items-center max-w-[60px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded"><span className="text-[7px] text-slate-400 uppercase text-center leading-none mb-0.5">{dict.evo_methods.move}</span><span className="text-[8px] text-cyan-200 text-center leading-tight font-bold truncate w-full">{detail.knownMove ? detail.knownMove.replace(/-/g, ' ') : detail.knownMoveType}</span></div>);
  
  if (detail.turnUpsideDown) reqs.push(<SpecialIcon key="upside" icon={Smartphone} color="text-amber-400" tooltip={tooltips.upside_down} />);
  if (detail.needsOverworldRain) reqs.push(<SpecialIcon key="rain" icon={CloudRain} color="text-blue-400" tooltip={tooltips.rain} />);
  if (detail.trigger === 'shed') reqs.push(<SpecialIcon key="shed" icon={BoxSelect} color="text-purple-300" tooltip={tooltips.shed} />);
  if (detail.gender === 1) reqs.push(<span key="gen-f" className="text-[9px] font-bold text-pink-400 border border-pink-500/30 bg-pink-900/20 px-1 rounded" title={conditions.female_only}>♀ Only</span>);
  if (detail.gender === 2) reqs.push(<span key="gen-m" className="text-[9px] font-bold text-blue-400 border border-blue-500/30 bg-blue-900/20 px-1 rounded" title={conditions.male_only}>♂ Only</span>);
  if (detail.trigger === 'trade') reqs.push(<div key="trade" className="flex flex-col items-center"><RefreshCw size={14} className="text-purple-400" />{detail.tradeSpecies && <span className="text-[7px] uppercase border border-purple-500/30 px-1 py-0.5 rounded bg-purple-900/20 text-purple-200 truncate max-w-[50px]">+ {detail.tradeSpecies}</span>}</div>);

  return <div className="flex flex-wrap justify-center items-center gap-1.5 px-2 py-1 min-w-[40px] hover:z-[100] relative">{reqs.length > 0 ? reqs : <ArrowRight size={16} className="text-slate-700" />}</div>;
};

// --- MAIN COMPONENT ---
export default function EvolutionChart({ chain, lang, activeSpecies }: Props) {
  // FIX TS: Force typing
  const safeLang = lang as keyof typeof POKEDEX_DICTIONARY;
  const dict = POKEDEX_DICTIONARY[safeLang].labels;
  const [selectedBranchIdx, setSelectedBranchIdx] = useState(0);
  const [currentGen, setCurrentGen] = useState(9);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const processedChain = useMemo(() => {
      if (!chain) return null;
      return preprocessRegionalChain(chain, activeSpecies);
  }, [chain, activeSpecies]);

  const flatten = (node: IEvolutionNode): IEvolutionNode[][] => {
      if (!node.evolvesTo.length) return [[node]];
      return node.evolvesTo.flatMap(child => flatten(child).map(path => [node, ...path]));
  };

  const paths = useMemo(() => processedChain ? flatten(processedChain) : [], [processedChain]);

  useEffect(() => {
    if (activeSpecies && paths.length > 0) {
        let targetIndex = paths.findIndex(path => 
            path.some(node => node.speciesName.toLowerCase() === activeSpecies.toLowerCase())
        );
        if (targetIndex === -1 && activeSpecies.includes('-')) {
             if (activeSpecies.includes('hisui')) targetIndex = paths.findIndex(path => path.some(node => node.speciesName.includes('hisui') || ['kleavor', 'overqwil', 'sneasler', 'basculegion', 'wyrdeer', 'ursaluna', 'goodra'].includes(node.speciesName.toLowerCase())));
             else if (activeSpecies.includes('galar')) targetIndex = paths.findIndex(path => path.some(node => node.speciesName.includes('galar') || ['runerigus', 'perrserker', 'cursola', 'sirfetchd', 'mr-rime', 'obstagoon'].includes(node.speciesName.toLowerCase())));
        }
        if (targetIndex !== -1) setSelectedBranchIdx(targetIndex);
    }
  }, [activeSpecies, paths]);

  const { isSensitive, minGen } = useMemo(() => {
    if (!processedChain) return { isSensitive: false, minGen: 1 };
    let foundSensitive = false;
    let detectedMin = 9; 
    const checkRecursive = (node: IEvolutionNode) => {
        const species = node.speciesName.toLowerCase();
        if (GEN_CONSTRAINTS[species]) {
            foundSensitive = true;
            detectedMin = Math.min(detectedMin, GEN_CONSTRAINTS[species]);
        }
        node.evolvesTo.forEach(checkRecursive);
    };
    checkRecursive(processedChain);
    return { isSensitive: foundSensitive, minGen: foundSensitive ? detectedMin : 1 };
  }, [processedChain]);
  
  const availableGens = useMemo(() => isSensitive ? Array.from({ length: 9 - minGen + 1 }, (_, i) => 9 - i) : [], [isSensitive, minGen]);
  const isBranched = paths.length > 1;
  const currentPath = paths[selectedBranchIdx] || paths[0];
  const showHeader = isBranched || isSensitive; 

  const isSingleStage = processedChain && processedChain.evolvesTo.length === 0;

  if (!processedChain || paths.length === 0 || isSingleStage) {
    return (
        <div className="w-full h-full min-h-[200px] relative rounded-xl border border-red-500/20 bg-red-950/5 flex flex-col items-center justify-center p-6 overflow-hidden group">
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,rgba(220,38,38,0.1)_25%,transparent_25%,transparent_50%,rgba(220,38,38,0.1)_50%,rgba(220,38,38,0.1)_75%,transparent_75%,transparent)] bg-[length:24px_24px]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.8)_100%)]" />
            <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-950/50 border border-red-500/50 flex items-center justify-center relative">
                    <Dna size={20} className="text-red-500 opacity-50 absolute" />
                    <div className="absolute inset-0 border-t-2 border-red-500/80 rounded-full animate-spin [animation-duration:3s]" />
                </div>
                <div className="text-center space-y-1">
                    <h3 className="text-red-500 font-display font-bold tracking-[0.2em] text-sm animate-pulse">NO EVOLUTION DETECTED</h3>
                    <p className="text-red-400/60 font-mono text-[9px] uppercase tracking-wider">{dict.no_evo}</p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full relative rounded-xl shadow-2xl flex flex-col">
      <div className="absolute inset-0 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.9)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
      </div>

      <div className="relative z-10 flex flex-col">
          {showHeader && (
            <div className="bg-slate-900/90 border-b border-slate-800 p-2 backdrop-blur-sm flex items-center justify-between min-h-[42px] rounded-t-xl">
                <div className="flex items-center gap-2 pl-2">
                    <Zap size={12} className="text-cyan-500" />
                    <span className="text-[10px] font-mono font-bold text-cyan-500 uppercase tracking-widest">{dict.evo_target}</span>
                </div>
                <div className="flex items-center gap-3 pr-1">
                    {isSensitive && (
                        <div className="relative group flex items-center bg-slate-950 border border-slate-700 rounded-sm hover:border-cyan-500/50 transition-colors shadow-sm">
                            <div className="pl-2 flex items-center pointer-events-none"><History size={10} className="text-slate-400 mr-1.5" /><span className="text-[9px] text-slate-500 font-mono mr-1 uppercase font-bold">GEN</span></div>
                            <select id="gen-select" value={currentGen} onChange={(e) => setCurrentGen(Number(e.target.value))} className="appearance-none bg-transparent text-[10px] font-bold text-cyan-400 focus:outline-none cursor-pointer pl-1 pr-7 py-1 uppercase tracking-wide font-mono">
                                {availableGens.map(g => <option key={g} value={g} className="bg-slate-900 text-slate-300">Gen {GEN_ROMAN[g]}</option>)}
                            </select>
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-cyan-400 transition-colors"><ChevronDown size={12} strokeWidth={3} /></div>
                        </div>
                    )}
                    {isBranched && (
                        <div className="flex gap-1 border-l border-slate-700 pl-3">
                            <button disabled={selectedBranchIdx === 0} onClick={() => setSelectedBranchIdx(p => p - 1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 transition-colors group"><ChevronRight size={12} className="rotate-180 text-cyan-400 group-disabled:text-slate-600" /></button>
                            <button disabled={selectedBranchIdx === paths.length - 1} onClick={() => setSelectedBranchIdx(p => p + 1)} className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 transition-colors group"><ChevronRight size={12} className="text-cyan-400 group-disabled:text-slate-600" /></button>
                        </div>
                    )}
                </div>
            </div>
          )}
          
          {isBranched && (
            <div className="bg-slate-900/50 border-b border-slate-800 p-1 flex gap-2 overflow-x-auto custom-scrollbar justify-center">
                {paths.map((path, idx) => {
                    const node = path[path.length - 1]; 
                    const isActive = selectedBranchIdx === idx;
                    // FIX: Usar el icono que ahora está correctamente inyectado
                    const iconSrc = node.icon || node.sprite;
                    return <button key={idx} onClick={() => setSelectedBranchIdx(idx)} className={cn("relative group rounded border transition-all duration-300 w-8 h-8 flex items-center justify-center overflow-hidden bg-slate-900", isActive ? "border-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.2)]" : "border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100")} title={node.speciesName}><Image src={iconSrc} alt={node.speciesName} fill className="object-contain p-0.5 rendering-pixelated" unoptimized onError={() => setImgError(prev => ({...prev, [node.speciesName + '_icon']: true}))} /></button>;
                })}
            </div>
          )}

          <div className="px-4 py-12 flex justify-center items-center overflow-x-auto custom-scrollbar min-h-[160px]">
             <div className="flex items-center gap-0 w-full justify-center">
                {currentPath.map((node, i) => {
                    const isLast = i === currentPath.length - 1;
                    const nextNode = currentPath[i+1];
                    const imgSrc = imgError[node.speciesName] ? '/fallback.png' : node.sprite;
                    const speciesLower = node.speciesName.toLowerCase();
                    const requiredGen = GEN_CONSTRAINTS[speciesLower];
                    const isUnavailable = requiredGen && currentGen < requiredGen;
                    const relevantDetails = nextNode ? getOptimizedEvolutionDetail(nextNode.speciesName, nextNode.details, currentGen) : [];

                    // URL SEGURA
                    const destUrl = getPokemonUrl(node, lang);

                    return (
                        <div key={i} className="flex items-center">
                            <div className="flex flex-col items-center gap-2 relative group/node z-20 hover:z-40">
                                <Link 
                                    href={isUnavailable ? '#' : destUrl}
                                    className={cn("relative w-20 h-20 md:w-24 md:h-24 border rounded-lg flex items-center justify-center shadow-lg transition-all duration-500 backdrop-blur-md", isUnavailable ? "bg-slate-950/90 border-slate-800 opacity-50 cursor-not-allowed" : "bg-slate-900/80 border-slate-700 cursor-pointer group-hover/node:border-cyan-500/50 group-hover/node:shadow-[0_0_15px_rgba(34,211,238,0.1)]")}
                                >
                                    {!isUnavailable && <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.03),transparent)] rounded-lg" />}
                                    {isUnavailable ? (
                                        <div className="flex flex-col items-center justify-center text-slate-600 gap-1 p-2 text-center"><Lock size={16} /><span className="text-[8px] font-mono leading-tight uppercase font-bold text-red-900/70">{dict.unavailable}</span><span className="text-[7px] font-mono">GEN {GEN_ROMAN[requiredGen]}</span></div>
                                    ) : (
                                        <Image src={imgSrc} alt={node.speciesName} width={96} height={96} className="object-contain z-10 drop-shadow-xl transition-transform duration-300 group-hover/node:scale-110 p-2" unoptimized onError={() => setImgError(prev => ({...prev, [node.speciesName]: true}))} />
                                    )}
                                    {!isUnavailable && isSensitive && GEN_CONSTRAINTS[node.speciesName.toLowerCase()] && <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-950 border border-cyan-500 rounded-full flex items-center justify-center z-20" title="Evolution mechanics change"><History size={6} className="text-cyan-400" /></div>}
                                </Link>

                                <div className="text-center">
                                    <Link href={isUnavailable ? '#' : destUrl}>
                                        <h4 className={cn("text-[10px] md:text-xs font-display font-bold uppercase tracking-wider transition-colors", isUnavailable ? "text-slate-700" : "text-slate-300 group-hover/node:text-cyan-400 cursor-pointer")}>
                                            {node.speciesName.replace(/-/g, ' ')}
                                        </h4>
                                    </Link>
                                </div>
                            </div>
                            {!isLast && nextNode && (
                                <div className={cn("flex flex-col items-center px-1 md:px-2 relative z-10 hover:z-[100]", isUnavailable && "opacity-20 grayscale")}>
                                    <div className="w-[calc(100%+2rem)] absolute top-1/2 -translate-y-1/2 -left-4 h-[1px] bg-slate-800 -z-10"><div className="w-full h-full bg-gradient-to-r from-slate-800 via-cyan-900/50 to-slate-800" /></div>
                                    <div className="bg-slate-950 border border-slate-800 rounded shadow-lg relative transition-transform hover:scale-105 hover:border-cyan-500/30 hover:z-[50]">
                                        <EvolutionTriggerDisplay details={relevantDetails} lang={lang} gen={currentGen} targetSpecies={nextNode.speciesName} />
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