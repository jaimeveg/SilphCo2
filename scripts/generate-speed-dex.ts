import fs from 'fs';
import path from 'path';

// Endpoint GraphQL Beta de PokeAPI (Muy rápido para descargas masivas)
const POKEAPI_GQL = 'https://graphql.pokeapi.co/v1beta2/v1/graphql';

const QUERY = `
  query GetPokemonSpeeds {
    pokemon {
      id
      name
      pokemonstats(where: {stat: {name: {_eq: "speed"}}}) {
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

    const pokemonList = json.data.pokemon;
    const speedMap: Record<number, number> = {};

    console.log(`📦 Procesando ${pokemonList.length} Pokémon...`);

    pokemonList.forEach((p: any) => {
      // El ID de PokeAPI es la clave universal
      const id = p.id;
      const speedStats = p.pokemonstats;
      
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