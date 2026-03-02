// src/services/smogonService.ts
import { CompetitiveResponse } from '@/types/smogon';

// --- TIPOS DEL ÁRBOL SMOGON (CHAOS) ---
export interface EloOption {
    elo: string;
    fileId: string; // El ID mágico: "gen9vgc2024regg-1760.json"
}

export interface FormatData {
    regs: Record<string, EloOption[]>; 
}

export interface SmogonTree {
    [gen: string]: {
        [mode: string]: {
            [formatName: string]: FormatData;
        };
    };
}

export interface SmogonIndexResponse {
    date: string;
    structure: SmogonTree;
}

// --- FETCHERS ---

export const fetchFormatsIndex = async (): Promise<SmogonIndexResponse | null> => {
    try {
        // Cache-buster para asegurar que leemos el árbol más reciente
        const res = await fetch(`/api/formats?v=${Date.now()}`, { next: { revalidate: 0 } });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("[SmogonService] Error loading format tree:", e);
        return null;
    }
};

export const fetchSmogonData = async (
    pokemonId: string, // AHORA RECIBE EL ID
    date: string,
    fileId: string
): Promise<CompetitiveResponse | null> => {
    try {
        const params = new URLSearchParams({
            pokemon: pokemonId, // Se manda el ID a la API
            date: date,
            fileId: fileId,
            v: Date.now().toString() // ROMPEMOS LA CACHÉ AGRESIVA DE NEXT.JS
        });
        
        // Llamada a la API interna, que leerá el JSON gigante en el servidor y nos devolverá solo 1KB
        const response = await fetch(`/api/competitive?${params.toString()}`);
        if (!response.ok) return null;
        
        return await response.json();
    } catch (error) {
        console.error("Error fetching Smogon data:", error);
        return null;
    }
};