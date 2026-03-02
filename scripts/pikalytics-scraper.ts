// scripts/pikalytics-scraper.ts
// EJECUTAR CON: npx tsx scripts/pikalytics-scraper.ts

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

// --- CONFIGURACIÓN ---
const FORMAT = 'homebsd'; 
const BASE_URL = 'https://www.pikalytics.com';
const INDEX_URL = `${BASE_URL}/ai/pokedex/${FORMAT}`;
const OUTPUT_FILE = path.join(process.cwd(), 'public', 'data', 'pikalytics_ladder.json');

const ALIAS_PATH = path.join(process.cwd(), 'public', 'data', 'alias_map.json');
const TRAITS_PATH = path.join(process.cwd(), 'public', 'data', 'traits_map.json');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/plain,text/markdown,text/html,*/*;q=0.8',
    'Referer': BASE_URL
};

// --- UTILIDADES ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const toSlug = (name: string) => name.toLowerCase().replace(/['’\.]/g, '').replace(/[\s:]+/g, '-').replace(/[^a-z0-9-]/g, '');

const formatDisplayName = (slug: string) => {
    if (!slug) return '';
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const runPikalyticsETL = async () => {
    console.log(`\n=== INICIANDO ETL: PIKALYTICS LADDER AI [MARKDOWN PARSER] ===\n`);

    // 1. CARGA DE DICCIONARIOS
    let aliasMap: Record<string, number> = {};
    let traitsMap: Record<string, string> = {};
    try {
        aliasMap = JSON.parse(await fs.readFile(ALIAS_PATH, 'utf8'));
        traitsMap = JSON.parse(await fs.readFile(TRAITS_PATH, 'utf8'));
    } catch (e) {
        console.error('🔥 ERROR: No se encontraron diccionarios. Ejecuta las tools de generación primero.');
        process.exit(1);
    }

    const unmappedAliases = new Set<string>();
    const unmappedTraits = new Set<string>();

    const resolveId = (name: string): string => {
        const slug = toSlug(name);
        const mappedId = aliasMap[slug] || aliasMap[slug.replace(/-/g, '')];
        if (!mappedId) {
            unmappedAliases.add(slug);
            return slug;
        }
        return mappedId.toString();
    };

    const normalizeTrait = (name: string): string => {
        const squashed = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (traitsMap[squashed]) return traitsMap[squashed];
        unmappedTraits.add(name);
        return toSlug(name);
    };

    // --- PARSERS DE MARKDOWN ---
    const extractMarkdownList = (markdown: string, sectionTitle: string) => {
        // Busca el bloque debajo de "## Common Moves" hasta el siguiente "##" o final del archivo
        const regex = new RegExp(`## ${sectionTitle}[\\s\\S]*?(?=\\n##|$)`);
        const match = markdown.match(regex);
        if (!match) return [];

        const lines = match[0].split('\n');
        const results = [];
        
        for (const line of lines) {
            // Extrae formato: "- **Ataque**: 98.7%" o "- **Amigo**: undefined%"
            const itemMatch = line.match(/- \*\*([^*]+)\*\*(?::\s*([\d.]+|undefined)%)?/);
            if (itemMatch) {
                const name = itemMatch[1].trim();
                const pctRaw = itemMatch[2];
                const pct = (pctRaw && pctRaw !== 'undefined') ? parseFloat(pctRaw) : 0;
                results.push({ name, percent: pct });
            }
        }
        return results;
    };

    const extractTeras = (markdown: string) => {
        const teraRegex = /most common Tera Types for .*? are ([^\n]+)/;
        const match = markdown.match(teraRegex);
        if (!match) return [];
        
        // Limpiamos la frase final y separamos por comas
        const rawTeras = match[1].replace('.', '').replace('and', ',').split(',');
        return rawTeras.map(t => ({ name: t.trim(), percent: 0 })).filter(t => t.name);
    };

    const extractNature = (markdown: string) => {
        const natureRegex = /most common nature for .*? is \*\*([^*]+)\*\*/;
        const match = markdown.match(natureRegex);
        return match ? match[1].trim() : null;
    };

    const axiosClient = axios.create({ headers: HEADERS });

    try {
        // 2. OBTENER ÍNDICE TOP 50 (TEXTO PLANO)
        console.log(`[1/3] Descargando índice de formato ${FORMAT}...`);
        const indexRes = await axiosClient.get(INDEX_URL);
        const indexMd = indexRes.data;

        // Extraer la tabla del Markdown: | 1 | **Incineroar** |
        const tableRegex = /\|\s*(\d+)\s*\|\s*\*\*([^*]+)\*\*\s*\|/g;
        const matches = [...indexMd.matchAll(tableRegex)];
        
        if (matches.length === 0) {
            throw new Error("No se pudo extraer la tabla de Pokémon del Markdown.");
        }

        // Cortamos en 50
        const top50Names = matches.slice(0, 50).map(m => m[2].trim());
        console.log(`  -> Detectados ${top50Names.length} Pokémon en el Ladder.`);

        // 3. DEEP FETCHING (DETALLES)
        console.log(`\n[2/3] Extrayendo estadísticas tácticas (Throttling de 1.5s activado)...`);
        
        const finalTop50 = [];
        let rank = 1;

        for (const rawName of top50Names) {
            process.stdout.write(`  -> [${rank}/50] Procesando #${rank} (${rawName})... `);

            try {
                // La URL del AI usa el nombre codificado (ej: Flutter%20Mane)
                const detailUrl = `${INDEX_URL}/${encodeURIComponent(rawName)}`;
                const detailRes = await axiosClient.get(detailUrl);
                const md = detailRes.data;

                const pkmId = resolveId(rawName);

                // --- MAPEO DE LISTAS ---
                const processList = (rawList: {name: string, percent: number}[]) => {
                    return rawList.map(item => {
                        const slug = normalizeTrait(item.name);
                        return {
                            name: formatDisplayName(slug),
                            slug: slug,
                            value: item.percent,
                            displayValue: item.percent > 0 ? item.percent.toFixed(2) : "0.00"
                        };
                    });
                };

                const moves = processList(extractMarkdownList(md, 'Common Moves'));
                const items = processList(extractMarkdownList(md, 'Common Items'));
                const abilities = processList(extractMarkdownList(md, 'Common Abilities'));

                // Teammates (Pikalytics AI dice "undefined%", asignamos Score)
                const rawTeammates = extractMarkdownList(md, 'Common Teammates');
                const teammates = rawTeammates.map((mate, idx) => {
                    const mateId = resolveId(mate.name);
                    return {
                        id: parseInt(mateId, 10) || 0,
                        value: 100 - (idx * (100 / Math.max(rawTeammates.length, 1))),
                        displayValue: `#${idx + 1}` // Texto visible "#1, #2"
                    };
                });
                
                finalTop50.push({
                    id: pkmId,
                    rank: rank,
                    usage: `Top #${rank}`, // El usage global es ordinal en AI
                    stats: {
                        moves, items, abilities, teammates
                    }
                });

                console.log('OK');

            } catch (err: any) {
                console.log(`❌ ERROR`);
                console.error(`     [!] Fallo al parsear ${rawName}: ${err.message}`);
                
                finalTop50.push({
                    id: resolveId(rawName), 
                    rank: rank, 
                    usage: `Top #${rank}`, 
                    stats: { moves: [], items: [], abilities: [], teras: [], teammates: [], natureSpread: [] }
                });
            }

            rank++;
            // Throttling vital para Cloudflare (1500ms)
            await delay(1500); 
        }

        // 4. GUARDADO DE DATOS
        console.log(`\n[3/3] Consolidando JSON...`);
        const outputData = {
            metadata: {
                format: FORMAT,
                source: 'pikalytics_ai_markdown',
                last_update: new Date().toISOString(),
                total_processed: finalTop50.length
            },
            data: finalTop50
        };

        await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf8');
        console.log(`✅ Ladder guardado en: ${OUTPUT_FILE}`);

        // --- REPORTES DE HUÉRFANOS ---
        console.log('\n--- REPORTE DE CALIDAD ---');
        if (unmappedAliases.size > 0) {
            console.warn(`⚠️ ${unmappedAliases.size} Pokémon no mapeados.`);
            await fs.writeFile(path.join(process.cwd(), 'public/data/unmapped_ladder_aliases.json'), JSON.stringify(Array.from(unmappedAliases).sort(), null, 2), 'utf8');
        } else { console.log(`✅ [POKEMON] 100% identificados.`); }

        if (unmappedTraits.size > 0) {
            console.warn(`⚠️ ${unmappedTraits.size} Rasgos sin estandarizar.`);
            await fs.writeFile(path.join(process.cwd(), 'public/data/unmapped_ladder_traits.json'), JSON.stringify(Array.from(unmappedTraits).sort(), null, 2), 'utf8');
        } else { console.log(`✅ [RASGOS] 100% mapeados a Slugs.`); }

        console.log('\n🚀 [ÉXITO] Script ETL de Pikalytics completado.');

    } catch (error: any) {
        console.error('\n💥 FATAL ERROR en el pipeline principal:', error.message);
        process.exit(1);
    }
};

runPikalyticsETL();