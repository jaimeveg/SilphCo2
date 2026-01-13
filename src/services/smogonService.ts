// src/services/smogonService.ts
import { CompetitiveResponse } from '@/components/pokedex/viewports/CompetitiveDashboard';

// --- TIPOS DEL ÁRBOL SMOGON (CHAOS) ---
export interface EloOption {
    elo: string;
    fileId: string; // El ID mágico: "gen9vgc2024regg-1760"
}

export interface FormatData {
    regs: Record<string, EloOption[]>; // "Reg G": [ {elo: "0", ...}, {elo: "1500", ...} ]
}

export interface SmogonTree {
    [gen: string]: {
        [mode: string]: {
            [formatName: string]: FormatData;
        };
    };
}

export interface SmogonIndexResponse {
    date: string; // "2024-11"
    structure: SmogonTree;
}

// --- FETCHERS ---

export const fetchFormatsIndex = async (): Promise<SmogonIndexResponse | null> => {
    try {
        // Llama a tu nueva API /api/formats que hace el scraping
        const res = await fetch('/api/formats', { next: { revalidate: 3600 } });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.error("[SmogonService] Error loading format tree:", e);
        return null;
    }
};

export const fetchSmogonData = async (
    pokemon: string, 
    date: string,
    fileId: string
): Promise<CompetitiveResponse | null> => {
    try {
        const params = new URLSearchParams({
            pokemon: pokemon,
            date: date,
            fileId: fileId
        });

        // Llama a tu nueva API /api/competitive con lógica Raw
        const res = await fetch(`/api/competitive?${params.toString()}`);
        if (!res.ok) return null;

        return await res.json();
    } catch (error) {
        console.error("[SmogonService] Network error:", error);
        return null;
    }
};