// src/app/api/formats/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
// Reutilizamos tu parser, pero ahora le pasaremos nombres de archivo locales
import { parseChaosFilename, SmogonFormatParser } from '@/lib/utils/smogon-raw-utils';

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
        const files = await fs.readdir(dataDir);
        
        const parsedFormats: SmogonFormatParser[] = [];

        files.forEach(file => {
            if (!file.endsWith('.json') || file === 'meta.json') return;
            
            const parsed = parseChaosFilename(file);
            if (parsed) parsedFormats.push(parsed);
        });

        // Construir árbol (Igual que antes)
        const structure: any = {};
        parsedFormats.forEach(p => {
            if (!structure[p.gen]) structure[p.gen] = { singles: {}, doubles: {} };
            const modeGroup = structure[p.gen][p.mode];
            if (!modeGroup[p.formatName]) modeGroup[p.formatName] = { regs: {} };
            const formatGroup = modeGroup[p.formatName];
            if (!formatGroup.regs[p.regulation]) formatGroup.regs[p.regulation] = [];
            formatGroup.regs[p.regulation].push({ elo: p.elo, fileId: p.id });
        });

        // Sort ELOs... (código de ordenación igual que antes)

        return NextResponse.json({ date, structure });

    } catch (error) {
        return NextResponse.json({ error: 'Local data not found' }, { status: 500 });
    }
}