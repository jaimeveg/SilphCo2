import { Lang } from "@/lib/pokedexDictionary";

export const nuzlockeDict = {
  en: {
    loading: "Analyzing Timeline...",
    noData: "No tactical data found for this region.",
    selectGame: "Select a supported game to view analysis.",
    gameRegion: "GAME REGION:",
    tierTitle: "Tactical Assessment",
    tierDesc: (tier: string) => `Solid ${tier}-Tier pick based on matchups and stats.`,
    phases: {
      early: "Early Game",
      mid: "Mid Game",
      late: "Late Game"
    },
    tags: {
      earlyCarry: "Early Carry",
      lateScaler: "Late Scaler",
      reTyped: "Re-Typed",
      buffedStats: "Buffed Stats"
    },
    headers: {
      encounters: "Encounter Availability",
      changes: "ROM Hack Balance Changes",
      threats: "Enemy Threat Analysis"
    },
    labels: {
      repelTrick: "⚡ Repel Trick",
      appearsIn: (count: number) => `Appears in ${count} Battles`
    }
  },
  es: {
    loading: "Analizando Línea Temporal...",
    noData: "No hay datos tácticos para esta región.",
    selectGame: "Selecciona un juego compatible para ver el análisis.",
    gameRegion: "REGIÓN DEL JUEGO:",
    tierTitle: "Evaluación Táctica",
    tierDesc: (tier: string) => `Opción sólida de Tier ${tier} basada en matchups y estadísticas.`,
    phases: {
      early: "Juego Temprano",
      mid: "Mitad de Juego",
      late: "Juego Tardío"
    },
    tags: {
      earlyCarry: "Carry Inicial",
      lateScaler: "Escalado Tardío",
      reTyped: "Cambio de Tipo",
      buffedStats: "Stats Mejorados"
    },
    headers: {
      encounters: "Disponibilidad de Encuentros",
      changes: "Cambios de Balance (ROM Hack)",
      threats: "Análisis de Amenazas Enemigas"
    },
    labels: {
      repelTrick: "⚡ Truco Repelente",
      appearsIn: (count: number) => `Aparece en ${count} Batallas`
    }
  }
};

export const getNuzlockeDict = (lang: Lang) => nuzlockeDict[lang];