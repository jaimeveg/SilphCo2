import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

// --- CONFIGURACIÓN BASE ---
const args = process.argv.slice(2);
const TOURNAMENT_URL = args[0];
const TOURNAMENTS_DIR = path.join(process.cwd(), 'public', 'data', 'tournaments');
const INDEX_PATH = path.join(TOURNAMENTS_DIR, 'rk9_index.json');

if (!TOURNAMENT_URL) {
    console.error('[ERROR] Debes proporcionar una URL. Uso: npx tsx scripts/rk9-scraper.ts <URL>');
    process.exit(1);
}

// Utilidades
const toSlug = (name: string) => name.toLowerCase().replace(/['’\.]/g, '').replace(/[\s:]+/g, '-').replace(/[^a-z0-9-]/g, '');
const cleanName = (str: string) => str.replace(/[^a-zA-Z0-9- ]/g, '').trim();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(Math.floor(Math.random() * 1000) + 500);

// --- ESTRUCTURAS DE MEMORIA ---
interface CounterMap { [key: string]: number }
interface AggregatedPokemon { 
    name: string;
    count: number; 
    moves: CounterMap; 
    abilities: CounterMap; 
    items: CounterMap; 
    teras: CounterMap; 
    teammates: CounterMap; 
}

const runScraper = async () => {
    await fs.mkdir(TOURNAMENTS_DIR, { recursive: true });

    const urlParts = TOURNAMENT_URL.split('/').filter(Boolean);
    const tournamentId = urlParts[urlParts.length - 1];
    console.log(`\n=== INICIANDO ETL: RK9 TOURNAMENT [${tournamentId}] ===\n`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        locale: 'en-US', // Forzamos RK9 a mostrar solo la variante inglesa
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    let teamUrls: string[] = [];
    let tournamentName = `Torneo RK9 ${tournamentId}`; 

    try {
        console.log('[1/5] Accediendo a la tabla principal del torneo...');
        await page.goto(TOURNAMENT_URL, { waitUntil: 'networkidle' });

        try {
            const extractedName = await page.$eval('h4.mb-0', el => el.textContent?.trim());
            if (extractedName) tournamentName = extractedName;
            console.log(`  -> Torneo detectado: ${tournamentName}`);
        } catch (e) { }

        try {
            const lengthSelect = await page.$('select[name$="length"]');
            if (lengthSelect) await lengthSelect.selectOption('-1'); 
            await page.waitForTimeout(2000);
        } catch (e) { }

        console.log('[2/5] Filtrando "Master Division" y extrayendo enlaces...');
        const hrefs = await page.$$eval('tr', rows => {
            return rows
                .filter(row => row.textContent?.includes('Master'))
                .map(row => row.querySelector('a[href*="/teamlist/public/"]')?.getAttribute('href'))
                .filter(href => href != null) as string[];
        });

        teamUrls = hrefs.map(href => href.startsWith('http') ? href : `https://rk9.gg${href}`);
        console.log(`  -> Detectados ${teamUrls.length} equipos en Master Division.`);
    } catch (error: any) {
        console.error('[CRÍTICO] Falló el acceso a la tabla principal:', error.message);
        await browser.close();
        process.exit(1);
    }

    if (teamUrls.length === 0) {
        await browser.close();
        return;
    }

    console.log('\n[3/5] Parseando equipos individuales (Modo Extracción Quirúrgica)...');
    
    // MEMORIA GLOBAL
    const aggregatedData: Record<string, AggregatedPokemon> = {};
    let successfulTeams = 0;

    for (let i = 0; i < teamUrls.length; i++) {
        const teamUrl = teamUrls[i];
        
        try {
            process.stdout.write(`  -> [${i + 1}/${teamUrls.length}] Procesando equipo... `);
            await page.goto(teamUrl, { waitUntil: 'domcontentloaded' });
            
            const html = await page.content();
            const $ = cheerio.load(html);
            
            // FILTRO CRÍTICO: Buscar SOLO dentro del contenedor de idioma Inglés
            const pokemonBlocks = $('#lang-EN .pokemon');
            
            if (pokemonBlocks.length === 0) {
                console.log('VACÍO (DOM distinto o equipo privado)');
                continue;
            }

            // Memoria Temporal del Equipo actual
            const currentTeamData: { name: string, item: string, ability: string, tera: string, moves: string[] }[] = [];

            pokemonBlocks.each((_, el) => {
                const extractAfterTag = (tagText: string) => {
                    const bTag = $(el).find(`b:contains("${tagText}")`);
                    if (bTag.length > 0 && bTag[0].nextSibling) {
                        const siblingNode = bTag[0].nextSibling as any;
                        return (siblingNode.nodeValue || '').replace(/\u00A0/g, ' ').trim();
                    }
                    return 'Unknown';
                };

                const tera = extractAfterTag('Tera Type:');
                const ability = extractAfterTag('Ability:');
                let item = extractAfterTag('Held Item:');
                if (!item || item === 'Unknown') item = 'No Item';

                const moves = $(el).find('.badge').map((i, badge) => $(badge).text().replace(/\u00A0/g, ' ').trim()).get();

                const clone = $(el).clone();
                clone.children().remove(); 
                
                const rawText = clone.text().replace(/\u00A0/g, ' ');
                const nameLines = rawText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
                
                let name = nameLines.length > 0 ? nameLines[0] : '';
                
                // 1. Limpieza de género
                name = name.replace(/\([MF]\)/i, ''); 
                
                // 2. FILTRO MORFOLÓGICO: Elimina sufijos basura de RK9
                name = name.replace(/\b(Style|Forme|Form|Mask|Rider|Mode|Cloak|Incarnate|Teal)\b/ig, '');
                
                // 3. Limpieza de brackets y caracteres extraños
                name = cleanName(name);

                if (name) {
                    currentTeamData.push({ name, item, ability, tera, moves });
                }
            });

            if (currentTeamData.length > 0) {
                successfulTeams++;
                const teamSlugs = currentTeamData.map(p => toSlug(p.name));

                for (const pkm of currentTeamData) {
                    const slug = toSlug(pkm.name);
                    
                    if (!aggregatedData[slug]) {
                        aggregatedData[slug] = { name: pkm.name, count: 0, moves: {}, abilities: {}, items: {}, teras: {}, teammates: {} };
                    }

                    const ref = aggregatedData[slug];
                    ref.count++; 

                    if (pkm.item !== 'No Item') ref.items[pkm.item] = (ref.items[pkm.item] || 0) + 1;
                    if (pkm.ability !== 'Unknown') ref.abilities[pkm.ability] = (ref.abilities[pkm.ability] || 0) + 1;
                    if (pkm.tera !== 'Unknown') ref.teras[pkm.tera] = (ref.teras[pkm.tera] || 0) + 1;
                    
                    for (const m of pkm.moves) {
                        if (m) ref.moves[m] = (ref.moves[m] || 0) + 1;
                    }

                    for (const mateSlug of teamSlugs) {
                        if (mateSlug !== slug) {
                            ref.teammates[mateSlug] = (ref.teammates[mateSlug] || 0) + 1;
                        }
                    }
                }
                console.log('OK');
            } else {
                console.log('ERROR (No se pudieron extraer datos del DOM)');
            }

        } catch (err: any) {
            console.log(`ERROR (${err.message}) - Saltando...`);
        }

        await randomDelay();
    }

    await browser.close();

    console.log('\n[4/5] Formateando datos (IRawStatData)...');
    const finalOutput: any = {
        info: { tournament_id: tournamentId, tournament_name: tournamentName, source: 'rk9_vgc', date: new Date().toISOString() },
        battles: successfulTeams, 
        pokemon: {}
    };

    const sortedPokemonKeys = Object.keys(aggregatedData).sort((a, b) => aggregatedData[b].count - aggregatedData[a].count);

    for (const slug of sortedPokemonKeys) {
        const data = aggregatedData[slug];
        finalOutput.pokemon[slug] = {
            usage: { raw: data.count, real: data.count, weighted: data.count },
            moves: data.moves,
            abilities: data.abilities,
            items: data.items,
            teammates: data.teammates,
            spreads: {}, 
            teras: data.teras 
        };
    }

    const outputPath = path.join(TOURNAMENTS_DIR, `rk9_${tournamentId}.json`);
    await fs.writeFile(outputPath, JSON.stringify(finalOutput, null, 2), 'utf8');
    console.log(`  -> Guardado: ${outputPath}`);

    // --- SISTEMA DE ÍNDICE (MAX 5) ---
    console.log('\n[5/5] Actualizando Índice de Torneos (Máx 5)...');
    let indexData: any[] = [];
    try { indexData = JSON.parse(await fs.readFile(INDEX_PATH, 'utf8')); } catch (e) { }

    indexData = indexData.filter((t: any) => t.id !== tournamentId);
    indexData.unshift({ id: tournamentId, name: tournamentName, date: new Date().toISOString() });

    if (indexData.length > 5) {
        const removed = indexData.splice(5);
        for (const rm of removed) {
            try {
                await fs.unlink(path.join(TOURNAMENTS_DIR, `rk9_${rm.id}.json`));
                console.log(`  -> [GC] Borrado torneo antiguo: ${rm.id}`);
            } catch (err) { }
        }
    }

    await fs.writeFile(INDEX_PATH, JSON.stringify(indexData, null, 2), 'utf8');
    console.log(`  -> Índice actualizado: ${INDEX_PATH}`);

    console.log(`\n[ÉXITO] ETL Finalizado. Total Equipos Procesados: ${successfulTeams}`);
};

runScraper().catch(e => {
    console.error('Fatal Scraper Error:', e);
    process.exit(1);
});