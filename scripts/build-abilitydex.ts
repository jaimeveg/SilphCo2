// scripts/build-abilitydex.ts
// EJECUTAR CON: npx tsx scripts/build-abilitydex.ts

import fs from 'fs/promises';
import path from 'path';
import { IAbilityIndex, IAbilityLearner, IAbilityDetail } from '../src/types/abilitydex';

const POKEAPI_GQL = 'https://beta.pokeapi.co/graphql/v1beta';
const DATA_DIR = path.join(process.cwd(), 'public', 'data');
const SMOGON_DIR = path.join(DATA_DIR, 'smogon');
const ABILITIES_DIR = path.join(DATA_DIR, 'abilities');
const CHUNK_SIZE = 100;
const MAX_RETRIES = 3;

// ─── Types ───────────────────────────────────────────────────────────────────

type CompetitiveTier = 'S' | 'A' | 'B' | 'C' | 'D' | 'Niche' | null;

interface AbilityCompetitiveData {
  /** Weighted VGC usage rate (0-1) */
  usage_rate: number;
  /** Normalized by opportunity: rate / max_rate across all abilities */
  normalized_score: number;
  tier: CompetitiveTier;
  /** How many distinct Pokémon carried this ability in VGC Gen9 data */
  carrier_count: number;
  /** Human-readable format name */
  format: string;
}

// ─── GraphQL Query ────────────────────────────────────────────────────────────

const ABILITIES_QUERY = `
query GetAbilities($limit: Int, $offset: Int) {
  pokemon_v2_ability(limit: $limit, offset: $offset, order_by: {id: asc}) {
    name
    generation_id
    pokemon_v2_abilityeffecttexts(where: {language_id: {_eq: 9}}, limit: 1) {
      effect
      short_effect
    }
    pokemon_v2_abilityflavortexts(where: {language_id: {_eq: 9}}, order_by: {version_group_id: desc}, limit: 1) {
      flavor_text
    }
    pokemon_v2_pokemonabilities(where: {pokemon_v2_pokemon: {is_default: {_eq: true}}}) {
      is_hidden
      slot
      pokemon_v2_pokemon {
        name
      }
    }
  }
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(query: string, variables: any, retries = 0): Promise<any> {
    try {
        const response = await fetch(POKEAPI_GQL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables })
        });
        const json = await response.json();
        if (json.errors) {
            console.error('GraphQL errors:', JSON.stringify(json.errors, null, 2));
            throw new Error('GraphQL Syntax Error');
        }
        return json;
    } catch (error: any) {
        if (retries < MAX_RETRIES) {
            const delay = 2000 * (retries + 1);
            console.warn(`⚠️  Reintentando en ${delay / 1000}s...`);
            await wait(delay);
            return fetchWithRetry(query, variables, retries + 1);
        } else throw error;
    }
}

async function fetchAllAbilities() {
    let allAbilities: any[] = [];
    let offset = 0;
    let fetchMore = true;
    console.log(`[1/4] Descargando habilidades desde PokeAPI GraphQL...`);
    while (fetchMore) {
        const json = await fetchWithRetry(ABILITIES_QUERY, { limit: CHUNK_SIZE, offset });
        const chunk = json.data?.pokemon_v2_ability || [];
        allAbilities = [...allAbilities, ...chunk];
        process.stdout.write(`   ↳ Progreso: ${allAbilities.length} habilidades...\r`);
        if (chunk.length < CHUNK_SIZE) fetchMore = false;
        else offset += CHUNK_SIZE;
    }
    console.log('\n');
    return allAbilities;
}

// ─── Competitive Data Loader ──────────────────────────────────────────────────
// 
// LOGIC EXPLAINED:
// ─────────────────
// For each ability, we need a competitive usage score.
// 
// From Smogon chaos files, each Pokémon has:
//   - "Raw count": total appearances
//   - "Abilities": { "ability-name": count_used_during_games }
// 
// Step 1: For each (pokemon, ability) pair, calculate the "choice rate":
//         choiceRate = pokemonAbilityCount / pokemonAbilityTotalCount
//         (= how often DID that Pokémon run this ability, when it could have run anything)
//         Multiply by pokemon's usage fraction to weight by how common the Pokémon is:
//         contribution = choiceRate * pokemon.usage
//
// Step 2: Sum contributions across all Pokémon that can have this ability:
//         rawScore = Σ(contribution_i)
//
// Step 3: Divide by the number of viable learners (Pokémon that actually appeared in data):
//         This penalizes niche abilities that only appear on one niche Pokémon.
//         normalizedScore = rawScore / Math.sqrt(carrierCount)  [sqrt dampens excess)
//
// Step 4: Assign tier via percentile rank of normalizedScore across all scored abilities.

async function loadCompetitiveData(aliasMap: Record<string, number>): Promise<Map<string, AbilityCompetitiveData>> {
    console.log(`[2/4] Cargando datos competitivos VGC Gen9 de Smogon...`);

    // Find the most recent VGC Gen9 file (prefer recent reg, high elo 0 for breadth)
    const smogonFiles = await fs.readdir(SMOGON_DIR);
    const gen9VgcFiles = smogonFiles.filter(f => f.match(/^gen9vgc.*-0\.json$/));
    
    if (gen9VgcFiles.length === 0) {
        console.warn('   ⚠️  No se encontraron archivos VGC Gen9. Saltando datos competitivos.');
        return new Map();
    }

    // Sort to get the latest regulation: gen9vgc2026regi > gen9vgc2026regf etc.
    gen9VgcFiles.sort((a, b) => b.localeCompare(a));
    const chosenFile = gen9VgcFiles[0];
    const formatName = chosenFile.replace('-0.json', '');
    console.log(`   ↳ Usando formato: ${formatName}`);

    const rawContent = await fs.readFile(path.join(SMOGON_DIR, chosenFile), 'utf-8');
    const smogonData = JSON.parse(rawContent) as { data: Record<string, any> };

    // Build reverse lookup: numeric pokemonId → ability usage counts
    // alias_map has slug → id, we need id → slug to match Pokemon names
    const idToSlug = new Map<number, string>();
    for (const [slug, id] of Object.entries(aliasMap)) {
        // Only keep base forms (prefer shortest slug for an ID to avoid mega/gmax issues)
        const existing = idToSlug.get(id as number);
        if (!existing || slug.length < existing.length) {
            idToSlug.set(id as number, slug);
        }
    }

    // Accumulate ability scores across all Pokémon
    // abilityScores[abilitySlug] = { totalContribution, carrierCount }
    const abilityScores = new Map<string, { totalContribution: number; carrierCount: number }>();

    let pokemonProcessed = 0;

    for (const [pokemonIdStr, pokemonStats] of Object.entries(smogonData.data)) {
        const pokemonId = parseInt(pokemonIdStr);
        const abilities = pokemonStats['Abilities'] as Record<string, number> | undefined;
        const usage = pokemonStats['usage'] as number | undefined;
        const rawCount = pokemonStats['Raw count'] as number | undefined;

        if (!abilities || !usage || !rawCount || rawCount === 0) continue;
        pokemonProcessed++;

        // Total ability usage counts for this Pokémon
        const abilityTotalCount = Object.values(abilities).reduce((sum, c) => sum + c, 0);
        if (abilityTotalCount === 0) continue;

        for (const [abilitySlug, abilityCount] of Object.entries(abilities)) {
            const choiceRate = abilityCount / abilityTotalCount;
            // Weight by the Pokémon's overall usage in the format
            const contribution = choiceRate * usage;

            const existing = abilityScores.get(abilitySlug);
            if (existing) {
                existing.totalContribution += contribution;
                existing.carrierCount += 1;
            } else {
                abilityScores.set(abilitySlug, { totalContribution: contribution, carrierCount: 1 });
            }
        }
    }
    
    console.log(`   ↳ ${pokemonProcessed} Pokémon procesados, ${abilityScores.size} habilidades encontradas.`);

    // Calculate normalized score: total contribution / sqrt(carriers) to account for opportunity
    const scoredAbilities = new Map<string, { rawScore: number; normalizedScore: number; carrierCount: number }>();
    for (const [slug, data] of abilityScores.entries()) {
        const rawScore = data.totalContribution;
        // sqrt dampens the bonus for abilities spread across many Pokémon
        const normalizedScore = rawScore / Math.sqrt(data.carrierCount);
        scoredAbilities.set(slug, { rawScore, normalizedScore, carrierCount: data.carrierCount });
    }

    // Determine tier thresholds from percentile distribution of normalizedScores
    const allNormalizedScores = [...scoredAbilities.values()].map(v => v.normalizedScore).sort((a, b) => b - a);
    const totalScored = allNormalizedScores.length;
    const p2 = allNormalizedScores[Math.floor(totalScored * 0.02)];   // top 2% → S
    const p10 = allNormalizedScores[Math.floor(totalScored * 0.10)];  // top 10% → A
    const p25 = allNormalizedScores[Math.floor(totalScored * 0.25)];  // top 25% → B
    const p50 = allNormalizedScores[Math.floor(totalScored * 0.50)];  // top 50% → C
    const p75 = allNormalizedScores[Math.floor(totalScored * 0.75)];  // top 75% → D

    console.log(`   ↳ Thresholds: S≥${p2.toFixed(4)}, A≥${p10.toFixed(4)}, B≥${p25.toFixed(4)}, C≥${p50.toFixed(4)}, D≥${p75.toFixed(4)}`);

    const getTier = (score: number): CompetitiveTier => {
        if (score >= p2) return 'S';
        if (score >= p10) return 'A';
        if (score >= p25) return 'B';
        if (score >= p50) return 'C';
        if (score >= p75) return 'D';
        return 'Niche';
    };

    // Normalize scores to 0-1 range using max score
    const maxScore = allNormalizedScores[0] || 1;

    const result = new Map<string, AbilityCompetitiveData>();
    for (const [slug, data] of scoredAbilities.entries()) {
        result.set(slug, {
            usage_rate: data.rawScore,
            normalized_score: data.normalizedScore / maxScore,
            tier: getTier(data.normalizedScore),
            carrier_count: data.carrierCount,
            format: formatName
        });
    }

    return result;
}

// ─── Main ETL ────────────────────────────────────────────────────────────────

const runETL = async () => {
    try {
        // Load alias_map for pokemon name → ID lookups
        const aliasMapRaw = await fs.readFile(path.join(DATA_DIR, 'alias_map.json'), 'utf-8');
        const aliasMap: Record<string, number> = JSON.parse(aliasMapRaw);

        // Build exact slug → id lookup (PokeAPI names use hyphens like alias_map keys)
        const slugToId = new Map<string, number>();
        for (const [slug, id] of Object.entries(aliasMap)) {
            slugToId.set(slug, id as number);
        }

        // Load competitive data from Smogon VGC Gen9
        const competitiveData = await loadCompetitiveData(aliasMap);

        // Fetch abilities from PokeAPI
        const rawAbilities = await fetchAllAbilities();
        console.log(`[3/4] Transformando ${rawAbilities.length} habilidades...`);

        await fs.mkdir(ABILITIES_DIR, { recursive: true });
        const indexList: IAbilityIndex[] = [];
        let skippedEmpty = 0;
        let withCompetitive = 0;

        for (const ability of rawAbilities) {
            const id = ability.name as string;
            const generation = ability.generation_id || 1;

            const effectTexts = ability.pokemon_v2_abilityeffecttexts?.[0];
            const effectText = (effectTexts?.effect || '').replace(/\n|\f|\r/g, ' ').trim();
            const shortEffect = (effectTexts?.short_effect || '').replace(/\n|\f|\r/g, ' ').trim();

            let flavorText = ability.pokemon_v2_abilityflavortexts?.[0]?.flavor_text || '';
            flavorText = flavorText.replace(/\n|\f|\r/g, ' ').trim();

            // ── FILTER: Skip abilities with no learners and no description ──
            // (These are typically Contest/cut abilities or internal placeholders)
            const pokemonAbilities = ability.pokemon_v2_pokemonabilities || [];
            if (pokemonAbilities.length === 0 && !effectText && !shortEffect) {
                skippedEmpty++;
                continue;
            }

            // Classify learners into slot_1, slot_2, hidden using alias_map IDs
            const slot1: IAbilityLearner[] = [];
            const slot2: IAbilityLearner[] = [];
            const hidden: IAbilityLearner[] = [];

            for (const pa of pokemonAbilities) {
                const pokemonName = pa.pokemon_v2_pokemon?.name as string | undefined;
                if (!pokemonName) continue;

                // Resolve numeric ID from alias_map
                const numericId = slugToId.get(pokemonName) ?? slugToId.get(pokemonName.replace(/-/g, ' '));
                
                const learner: IAbilityLearner = {
                    pokemon_id: numericId ? String(numericId) : pokemonName,
                    pokemon_name: pokemonName,
                    is_hidden: pa.is_hidden,
                    slot: pa.slot
                };

                if (pa.is_hidden) {
                    hidden.push(learner);
                } else if (pa.slot === 1) {
                    slot1.push(learner);
                } else {
                    slot2.push(learner);
                }
            }

            // Get competitive data for this ability
            const compData = competitiveData.get(id);
            if (compData) withCompetitive++;

            // Index entry (lightweight)
            const indexItem: IAbilityIndex = {
                id,
                name: id,
                generation,
                short_effect: shortEffect || 'No description available.',
                competitive_tier: compData?.tier ?? null,
                competitive_usage: compData?.usage_rate ?? null,
            };
            indexList.push(indexItem);

            // Detail entry (full)
            const detailItem: IAbilityDetail = {
                ...indexItem,
                effect_text: effectText || 'No detailed description available.',
                flavor_text: flavorText,
                learners: {
                    slot_1: slot1,
                    slot_2: slot2,
                    hidden
                },
                competitive: compData ? {
                    tier: compData.tier,
                    usage_rate: compData.usage_rate,
                    normalized_score: compData.normalized_score,
                    carrier_count: compData.carrier_count,
                    format: compData.format
                } : undefined,
            };

            await fs.writeFile(
                path.join(ABILITIES_DIR, `ability_${id}.json`),
                JSON.stringify(detailItem)
            );
        }

        console.log(`[4/4] Guardando abilitydex_index.json (${indexList.length} habilidades)...`);
        await fs.writeFile(
            path.join(DATA_DIR, 'abilitydex_index.json'),
            JSON.stringify(indexList)
        );
        console.log(`\n✅ [ÉXITO] AbilityDex ETL Finalizado.`);
        console.log(`   • ${indexList.length} habilidades guardadas`);
        console.log(`   • ${skippedEmpty} habilidades vacías omitidas`);
        console.log(`   • ${withCompetitive} habilidades con datos competitivos VGC`);
    } catch (error) {
        console.error('\n💥 FATAL ERROR en el Pipeline ETL de AbilityDex:', error);
        process.exit(1);
    }
};

runETL();
