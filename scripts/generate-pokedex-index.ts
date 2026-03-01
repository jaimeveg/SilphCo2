import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const BASE_STATS_PATH = path.join(DATA_DIR, 'pokedex_base_stats.json');
const GAMES_INDEX_PATH = path.join(DATA_DIR, 'games_index.json');
const OUTPUT_PATH = path.join(DATA_DIR, 'pokedex_index.json');

interface BaseStatEntry { id: number; name: string; types?: string[]; stats?: any; bst?: number; gen?: number; evolution?: any; speciesId?: number; }
interface GameIndexEntry { id: string; name: string; type: string; path: string; }

const getGeneration = (id: number): number => {
  if (id <= 151) return 1; if (id <= 251) return 2; if (id <= 386) return 3;
  if (id <= 493) return 4; if (id <= 649) return 5; if (id <= 721) return 6;
  if (id <= 809) return 7; if (id <= 905) return 8; return 9;
};

const runIndexerETL = async () => {
  console.log('=== INICIANDO INDEXACIÓN DEL POKEDEX (CON AGRUPACIÓN DE VARIANTES) ===\n');

  try {
    const baseStatsRaw = await fs.readFile(BASE_STATS_PATH, 'utf8');
    const baseStats: Record<string, BaseStatEntry> = JSON.parse(baseStatsRaw);
    const gamesIndexRaw = await fs.readFile(GAMES_INDEX_PATH, 'utf8');
    const gamesIndex: GameIndexEntry[] = JSON.parse(gamesIndexRaw);

    const gameTiers: Record<string, any> = {};
    for (const game of gamesIndex) {
      try { gameTiers[game.id] = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'games', game.path, 'tiering.json'), 'utf8')); } 
      catch (err) { gameTiers[game.id] = {}; }
    }

    // 1. Crear todas las tarjetas crudas
    const allCards = Object.keys(baseStats).map(pokemonId => {
      const p = baseStats[pokemonId];
      const numericId = p.id || parseInt(pokemonId, 10);
      const safeId = p.name.toLowerCase().replace(/['\s_.:]/g, '-').replace(/--+/g, '-');
      const st = p.stats || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      const bst = p.bst || (st.hp + st.atk + st.def + st.spa + st.spd + st.spe);

      const pokemonTiers: Record<string, any> = {};
      for (const game of gamesIndex) {
        const tierRecord = gameTiers[game.id]?.[pokemonId];
        const globalAvail = tierRecord?.isAvailable;
        const getTier = (phase: any) => (globalAvail === false || phase?.available === false) ? 'N/A' : (phase?.tier || 'N/A');
        
        pokemonTiers[game.id] = { early: getTier(tierRecord?.phases?.early), mid: getTier(tierRecord?.phases?.mid), late: getTier(tierRecord?.phases?.late) };
      }

      return {
        id: safeId,
        dex_number: numericId,
        name: p.name,
        types: p.types || ['normal'],
        base_stats: { hp: st.hp, atk: st.atk, def: st.def, spa: st.spa, spd: st.spd, spe: st.spe, bst },
        tiers: pokemonTiers,
        generation: p.gen || getGeneration(numericId),
        is_fully_evolved: !p.evolution?.to || p.evolution.to.length === 0,
        _rawSource: p
      };
    });

    // 2. Agrupación O(N^2) robusta
    const baseCardsMap = new Map<number, any>();
    const variantsList: any[] = [];

    // Separamos bases de variantes (PokeAPI designa >= 10000 para variantes)
    allCards.forEach(card => {
      if (card.dex_number < 10000) baseCardsMap.set(card.dex_number, card);
      else variantsList.push(card);
    });

    let grouped = 0; let orphans = 0;

    variantsList.forEach(v => {
      let targetBaseId = v._rawSource.speciesId;
      
      // Motor de coincidencia por prefijo léxico (ej: 'tauros-paldea' encaja con 'tauros')
      if (!targetBaseId) {
        let bestLen = 0;
        for (const [bId, bCard] of baseCardsMap.entries()) {
          if (v.name.startsWith(bCard.name + '-') && bCard.name.length > bestLen) {
            targetBaseId = bId;
            bestLen = bCard.name.length;
          }
        }
      }

      delete v._rawSource;

      if (targetBaseId && baseCardsMap.has(targetBaseId)) {
        const base = baseCardsMap.get(targetBaseId);
        if (!base.varieties) base.varieties = [];
        base.varieties.push(v);
        grouped++;
      } else {
        baseCardsMap.set(v.dex_number, v); 
        orphans++;
      }
    });

    const finalIndex = Array.from(baseCardsMap.values()).map(c => { delete c._rawSource; return c; });

    console.log(`\n>> RESUMEN DE ENSAMBLAJE:`);
    console.log(`   - Tarjetas Base: ${baseCardsMap.size - orphans}`);
    console.log(`   - Variantes Agrupadas Exitosamente: ${grouped}`);
    console.log(`   - Variantes Huérfanas (Sin padre detectado): ${orphans}`);

    await fs.writeFile(OUTPUT_PATH, JSON.stringify(finalIndex, null, 2), 'utf8');
    console.log('\n[OK] ETL DE INDEXACIÓN COMPLETADO CON ÉXITO.');

  } catch (error: any) {
    console.error('\n[CRÍTICO] Fallo general:', error.message);
  }
};

runIndexerETL();