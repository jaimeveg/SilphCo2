// src/app/api/formats/route.ts
import { NextResponse } from 'next/server';
import { fetchValidChaosFiles, parseChaosFilename, SmogonFormatParser } from '@/lib/utils/smogon-raw-utils';

let CACHE: any = null;
let CACHE_TIMESTAMP = 0;
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 Horas

// Lista negra 
const IGNORED = [
    'custom', '1v1', '2v2', 'purehackmons', 'almostanyability', 
    'pokebilities', 'mixandmega', 'godlygift', 'stabmons', 'nfe', 'zu'
];

export async function GET() {
    // Si quieres forzar la prueba, comenta el chequeo de caché temporalmente
    if (CACHE && Date.now() - CACHE_TIMESTAMP < CACHE_TTL) {
        console.log("[API/Formats] Sirviendo desde Cache");
        return NextResponse.json(CACHE);
    }

    try {
        console.log("[API/Formats] Iniciando Proceso de Fechas Deterministas...");
        
        const { date, files } = await fetchValidChaosFiles();
        
        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No chaos files found', testedDate: date }, { status: 404 });
        }

        const parsedFormats: SmogonFormatParser[] = [];

        files.forEach(file => {
            const parsed = parseChaosFilename(file);
            if (parsed && !IGNORED.some(ig => parsed.formatName.toLowerCase().includes(ig))) {
                parsedFormats.push(parsed);
            }
        });

        // Construcción del Árbol
        const structure: any = {};

        parsedFormats.forEach(p => {
            if (!structure[p.gen]) structure[p.gen] = { singles: {}, doubles: {} };
            const modeGroup = structure[p.gen][p.mode];
            
            if (!modeGroup[p.formatName]) modeGroup[p.formatName] = { regs: {} };
            const formatGroup = modeGroup[p.formatName];
            
            if (!formatGroup.regs[p.regulation]) formatGroup.regs[p.regulation] = [];

            formatGroup.regs[p.regulation].push({ elo: p.elo, fileId: p.id });
        });

        // Sort ELOs
        Object.keys(structure).forEach(gen => {
            ['singles', 'doubles'].forEach(mode => {
                const formats = structure[gen][mode];
                Object.keys(formats).forEach(fmt => {
                    const regs = formats[fmt].regs;
                    Object.keys(regs).forEach(reg => {
                        regs[reg].sort((a: any, b: any) => parseInt(a.elo) - parseInt(b.elo));
                    });
                });
            });
        });

        const responsePayload = { date, structure };
        CACHE = responsePayload;
        CACHE_TIMESTAMP = Date.now();

        return NextResponse.json(responsePayload);

    } catch (error) {
        console.error("[API/Formats] Error Crítico:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}