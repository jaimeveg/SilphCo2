// src/lib/utils/pokemon-normalizer.ts

/**
 * UTILS: Pokemon Name Normalizer & Sprite Resolver
 * Centraliza la lógica para convertir nombres de Smogon/Showdown a:
 * 1. Slugs compatibles con URLs.
 * 2. URLs de imágenes estilo "HOME".
 */

// Diccionario de Excepciones (Smogon Human-Readable -> API Slug)
const EXCEPTION_MAP: Record<string, string> = {
    // Formas Regionales y Variantes
    'nidoranm': 'nidoran-m',
    'nidoranf': 'nidoran-f',
    'mr. mime': 'mr-mime',
    'mr. rime': 'mr-rime',
    'farfetch’d': 'farfetchd',
    'sirfetch’d': 'sirfetchd',
    'type: null': 'type-null',
    
    // Tapus
    'tapu koko': 'tapu-koko',
    'tapu lele': 'tapu-lele',
    'tapu bulu': 'tapu-bulu',
    'tapu fini': 'tapu-fini',
    
    // Paradox (Gen 9)
    'great tusk': 'great-tusk',
    'scream tail': 'scream-tail',
    'brute bonnet': 'brute-bonnet',
    'flutter mane': 'flutter-mane',
    'slither wing': 'slither-wing',
    'sandy shocks': 'sandy-shocks',
    'roaring moon': 'roaring-moon',
    'iron treads': 'iron-treads',
    'iron bundle': 'iron-bundle',
    'iron hands': 'iron-hands',
    'iron jugulis': 'iron-jugulis',
    'iron moth': 'iron-moth',
    'iron thorns': 'iron-thorns',
    'iron valiant': 'iron-valiant',
    'walking wake': 'walking-wake',
    'iron leaves': 'iron-leaves',
    'gouging fire': 'gouging-fire',
    'raging bolt': 'raging-bolt',
    'iron boulder': 'iron-boulder',
    'iron crown': 'iron-crown',
    
    // Legendarios Gen 9
    'wo-chien': 'wo-chien',
    'chien-pao': 'chien-pao',
    'ting-lu': 'ting-lu',
    'chi-yu': 'chi-yu',
    
    // Otras formas
    'urshifu-rapid-strike': 'urshifu-rapid-strike',
    'necrozma-dusk-mane': 'necrozma-dusk',
    'necrozma-dawn-wings': 'necrozma-dawn',
    'calyrex-ice': 'calyrex-ice',
    'calyrex-shadow': 'calyrex-shadow',
    'basculegion-f': 'basculegion-female'
  };
  
  export const toSlug = (name: string): string => {
    if (!name) return 'substitute';
    const lower = name.toLowerCase().trim();
  
    // 1. Chequeo directo en excepciones
    if (EXCEPTION_MAP[lower]) return EXCEPTION_MAP[lower];
  
    // 2. Limpieza estándar
    return lower
      .replace(/['’\.]/g, '') // Quita apóstrofes y puntos
      .replace(/[:]/g, '')    // Quita dos puntos
      .replace(/%/g, '')      // Quita porcentajes (raro pero posible)
      .replace(/\s+/g, '-');  // Espacios a guiones
  };
  
  /**
   * Obtiene la URL del Sprite estilo HOME.
   * - Si recibe NUMBER: Usa el repo oficial de PokeAPI (SSOT).
   * - Si recibe STRING: Usa PokemonDB como fallback visual (mismo estilo 3D) para teammates sin ID.
   */
  export const getSpriteUrl = (identifier: string | number) => {
      // ESTRATEGIA A: Tenemos el ID (Prioridad Absoluta - PokeAPI)
      if (typeof identifier === 'number') {
          return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${identifier}.png`;
      }
  
      // ESTRATEGIA B: Solo tenemos nombre (Teammates de Smogon) -> Fallback Visual
      const slug = toSlug(identifier);
      return `https://img.pokemondb.net/sprites/home/normal/${slug}.png`;
  };