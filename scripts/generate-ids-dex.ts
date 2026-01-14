import fs from 'fs';
import path from 'path';

// Endpoint GraphQL Beta de PokeAPI
const POKEAPI_GQL = 'https://beta.pokeapi.co/graphql/v1beta';

const QUERY = `
  query GetPokemonIds {
    pokemon_v2_pokemon {
      id
      name
    }
  }
`;

async function generateIdsDex() {
  console.log('🚀 Iniciando generación de Mapa de IDs (Slug -> ID)...');

  try {
    const response = await fetch(POKEAPI_GQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query: QUERY })
    });

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    const json = await response.json();
    if (json.errors) throw new Error(`Errores GraphQL: ${JSON.stringify(json.errors)}`);

    const pokemonList = json.data.pokemon_v2_pokemon;
    const idsMap: Record<string, number> = {};

    console.log(`📦 Procesando ${pokemonList.length} Pokémon...`);

    pokemonList.forEach((p: any) => {
      // El 'name' en PokeAPI ya suele ser un slug válido (ej: "flutter-mane")
      idsMap[p.name] = p.id;
    });

    // Guardar en public/data/pokedex_ids.json
    const outputDir = path.join(process.cwd(), 'public', 'data');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'pokedex_ids.json');
    
    fs.writeFileSync(outputPath, JSON.stringify(idsMap), 'utf-8');

    console.log(`✅ Mapa de IDs guardado en: ${outputPath}`);

  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

generateIdsDex();