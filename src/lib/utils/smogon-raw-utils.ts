// Archivo: src/lib/utils/smogon-raw-utils.ts

import { IRawStatData, CompetitiveResponse } from '@/types/smogon';
import { toSlug } from './pokemon-normalizer';

const formatUsageValue = (val: number) => val.toFixed(2);

export const parseSmogonChaosData = (
  pokemonId: string | number, // AHORA RECIBE EL ID
  rawData: IRawStatData,
  format: string,
  gen: number
): CompetitiveResponse => {
  // Búsqueda directa O(1) usando el ID numérico
  const pkmData = rawData.data[pokemonId.toString()];

  if (!pkmData) {
    throw new Error(`Pokemon ID ${pokemonId} not found in data`);
  }

  const rawCount = pkmData['Raw count'];
  const totalBattles = rawData.info['number of battles'];
  const usagePercent = rawCount && totalBattles ? (rawCount / totalBattles) * 100 : 0;

  const mapStats = (record: Record<string, number> = {}) => {
    return Object.entries(record)
      .map(([name, count]) => ({
        name,
        value: (count / rawCount) * 100,
        displayValue: formatUsageValue((count / rawCount) * 100),
        slug: toSlug(name)
      }))
      .sort((a, b) => b.value - a.value);
  };

  // NUEVO: Mapeo específico para Teammates (Extrae IDs)
  const teammates = Object.entries(pkmData.Teammates || {})
    .map(([mateIdStr, count]) => ({
      id: parseInt(mateIdStr, 10) || 0,
      value: (count / rawCount) * 100,
      displayValue: formatUsageValue((count / rawCount) * 100)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  // NUEVO: Mapeo específico para Counters (Extrae IDs)
  const counters = Object.entries(pkmData.Counters || {})
    .map(([mateIdStr, scores]) => {
      const score1 = scores[0]; 
      const score2 = scores[1]; 
      const rawScore = score1 - 4 * score2;
      return {
        id: parseInt(mateIdStr, 10) || 0,
        score: formatUsageValue((rawScore / rawCount) * 100)
      };
    })
    .filter(c => parseFloat(c.score) > 0)
    .sort((a, b) => parseFloat(b.score) - parseFloat(a.score))
    .slice(0, 10);

  // Spreads y EVs se mantienen igual (son dependientes de las naturalezas)
  const spreads = Object.entries(pkmData.Spreads || {})
    .map(([spreadStr, count]) => {
      const [nature, evsStr] = spreadStr.split(':');
      const evsArr = evsStr ? evsStr.split('/').map(Number) : [0,0,0,0,0,0];
      return {
        nature,
        usage: formatUsageValue((count / rawCount) * 100),
        evs: {
          HP: evsArr[0] || 0,
          Atk: evsArr[1] || 0,
          Def: evsArr[2] || 0,
          SpA: evsArr[3] || 0,
          SpD: evsArr[4] || 0,
          Spe: evsArr[5] || 0,
        }
      };
    })
    .sort((a, b) => parseFloat(b.usage) - parseFloat(a.usage))
    .slice(0, 10);

  return {
    meta: { pokemon: pokemonId.toString(), format, gen },
    general: { usage: formatUsageValue(usagePercent), rawCount },
    stats: {
      moves: mapStats(pkmData.Moves).slice(0, 15),
      items: mapStats(pkmData.Items).slice(0, 10),
      abilities: mapStats(pkmData.Abilities).slice(0, 10),
      teammates,
      natureSpread: spreads,
    },
    matchups: { counters },
  };
};