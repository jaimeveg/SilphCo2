import fs from 'fs';
import path from 'path';

// Endpoint GraphQL Beta de PokeAPI (Muy rápido para descargas masivas)
const POKEAPI_GQL = 'https://beta.pokeapi.co/graphql/v1beta';

const QUERY = `
  query GetPokemonSpeeds {
    pokemon_v2_pokemon {
      id
      name
      pokemon_v2_pokemonstats(where: {pokemon_v2_stat: {name: {_eq: "speed"}}}) {
        base_stat
      }
    }
  }
`;

async function generateSpeedDex() {
  console.log('🚀 Iniciando generación de Mapa de Velocidades...');

  try {
    const response = await fetch(POKEAPI_GQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query: QUERY })
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const json = await response.json();
    
    if (json.errors) {
      throw new Error(`Errores GraphQL: ${JSON.stringify(json.errors)}`);
    }

    const pokemonList = json.data.pokemon_v2_pokemon;
    const speedMap: Record<number, number> = {};

    console.log(`📦 Procesando ${pokemonList.length} Pokémon...`);

    pokemonList.forEach((p: any) => {
      // El ID de PokeAPI es la clave universal
      const id = p.id;
      const speedStats = p.pokemon_v2_pokemonstats;
      
      if (speedStats && speedStats.length > 0) {
        speedMap[id] = speedStats[0].base_stat;
      }
    });

    // Guardar en public/data/pokedex_speed_map.json
    const outputDir = path.join(process.cwd(), 'public', 'data');
    
    // Asegurar que el directorio existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'pokedex_speed_map.json');
    
    fs.writeFileSync(outputPath, JSON.stringify(speedMap), 'utf-8'); // Minificado para ahorrar espacio

    console.log(`✅ Mapa guardado en: ${outputPath}`);
    console.log(`📊 Total entradas: ${Object.keys(speedMap).length}`);

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

generateSpeedDex();