// src/app/api/formats/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// --- INTERFACES INTERNAS ---
export interface SmogonFormatParser {
    id: string; // Ej: gen9ou-1500.json
    gen: string;
    mode: 'singles' | 'doubles';
    formatName: string;
    regulation: string;
    elo: string;
}

// --- PARSER DE NOMBRES DE ARCHIVO (Autónomo) ---
function parseChaosFilename(filename: string): SmogonFormatParser | null {
    if (!filename.endsWith('.json') || filename === 'meta.json') return null;

    const base = filename.replace('.json', '');
    const parts = base.split('-');
    if (parts.length < 2) return null;

    const elo = parts.pop() || '0';
    const formatId = parts.join('-');

    const genMatch = formatId.match(/^gen([1-9]|1\d)/i);
    if (!genMatch) return null;

    const genNum = genMatch[1];
    const gen = `gen${genNum}`;

    let mode: 'singles' | 'doubles' = 'singles';
    let formatName = formatId.replace(gen, '');
    let regulation = '-';

    // 1. VGC
    if (formatName.includes('vgc')) {
        mode = 'doubles';
        const vgcMatch = formatName.match(/vgc(\d{4})(?:reg([a-z0-9]+))?/i);
        if (vgcMatch) {
            const year = vgcMatch[1];
            const regCode = vgcMatch[2];
            formatName = `VGC ${year}`;
            regulation = regCode ? `Reg ${regCode.toUpperCase()}` : 'Standard';
        } else {
            formatName = 'VGC (Legacy)';
        }
    } 
    // 2. Doubles General
    else if (formatName.includes('doubles')) {
        mode = 'doubles';
        formatName = formatName.replace('doubles', '').toUpperCase();
        if (formatName === '' || formatName === 'OU') formatName = 'Doubles OU';
        if (formatName === 'NATIONALDEX') formatName = 'National Dex';
    } 
    // 3. Singles General
    else {
        if (formatName === 'ou') formatName = 'OU';
        else if (formatName === 'uu') formatName = 'UU';
        else if (formatName === 'ru') formatName = 'RU';
        else if (formatName === 'nu') formatName = 'NU';
        else if (formatName === 'pu') formatName = 'PU';
        else if (formatName === 'ubers') formatName = 'Ubers';
        else if (formatName === 'lc') formatName = 'LC';
        else if (formatName === 'monotype') formatName = 'Monotype';
        else if (formatName === 'nationaldex') formatName = 'National Dex';
        else if (formatName === 'nationaldexou') formatName = 'National Dex OU';
        else if (formatName === 'nationaldexubers') formatName = 'National Dex Ubers';
        else if (formatName === 'nationaldexuu') formatName = 'National Dex UU';
        else if (formatName === 'anythinggoes') formatName = 'AG';
        else formatName = formatName.toUpperCase(); // Fallback seguro
    }

    return {
        id: filename,
        gen,
        mode,
        formatName,
        regulation,
        elo
    };
}

export async function GET() {
    try {
        const dataDir = path.join(process.cwd(), 'public/data/smogon');
        const metaPath = path.join(dataDir, 'meta.json');

        // Leer fecha de los metadatos guardados por el script
        let date = 'Unknown';
        try {
            const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
            date = meta.date;
        } catch (e) {
            console.warn("No meta.json found");
        }

        // Leer todos los archivos del directorio
        let files: string[] = [];
        try {
            files = await fs.readdir(dataDir);
        } catch (e) {
            return NextResponse.json({ date: 'No Data', structure: {} });
        }
        
        const parsedFormats: SmogonFormatParser[] = [];

        files.forEach(file => {
            const parsed = parseChaosFilename(file);
            if (parsed) parsedFormats.push(parsed);
        });

        // Construir árbol de menús
        const structure: any = {};
        parsedFormats.forEach(p => {
            if (!structure[p.gen]) structure[p.gen] = { singles: {}, doubles: {} };
            const modeGroup = structure[p.gen][p.mode];
            if (!modeGroup[p.formatName]) modeGroup[p.formatName] = { regs: {} };
            const formatGroup = modeGroup[p.formatName];
            if (!formatGroup.regs[p.regulation]) formatGroup.regs[p.regulation] = [];
            formatGroup.regs[p.regulation].push({ elo: p.elo, fileId: p.id });
        });

        // Ordenar ELOs de menor a mayor + limpiar modos vacíos
        Object.keys(structure).forEach(gen => {
            ['singles', 'doubles'].forEach(mode => {
                const formats = structure[gen][mode];
                if (!formats || Object.keys(formats).length === 0) {
                    // No hay formatos reales para este modo en esta gen → eliminar del árbol
                    delete structure[gen][mode];
                    return;
                }
                Object.keys(formats).forEach(format => {
                    const regs = formats[format].regs;
                    Object.keys(regs).forEach(reg => {
                        regs[reg].sort((a: any, b: any) => parseInt(a.elo) - parseInt(b.elo));
                    });
                });
            });
        });

        return NextResponse.json({ date, structure });
    } catch (error) {
        console.error('Error generating format index:', error);
        return NextResponse.json({ error: 'Failed to read formats' }, { status: 500 });
    }
}