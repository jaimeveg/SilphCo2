import fs from 'fs';
import path from 'path';

const POKEAPI_GQL = 'https://beta.pokeapi.co/graphql/v1beta';

const QUERY = `
  query GetTraits {
    moves: pokemon_v2_move { name }
    abilities: pokemon_v2_ability { name }
    items: pokemon_v2_item { name }
  }
`;

async function generateTraitsMap() {
    console.log('=== GENERANDO DICCIONARIO DE RASGOS (MOVES, ITEMS, ABILITIES) ===');

    try {
        const response = await fetch(POKEAPI_GQL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: QUERY })
        });

        const { data } = await response.json();
        const traitsMap: Record<string, string> = {};

        // Función que coge el slug oficial ("close-combat") y guarda como llave su versión aplastada ("closecombat")
        const processList = (list: { name: string }[]) => {
            list.forEach(item => {
                const officialSlug = item.name;
                // Aplastamos: quitamos guiones y todo lo que no sea letra/número
                const squashed = officialSlug.toLowerCase().replace(/[^a-z0-9]/g, '');
                traitsMap[squashed] = officialSlug;
            });
        };

        processList(data.moves);
        processList(data.abilities);
        processList(data.items);

        // Excepciones conocidas de Smogon que varían ligeramente
        traitsMap['heavydutyboots'] = 'heavy-duty-boots';

        const outputPath = path.join(process.cwd(), 'public', 'data', 'traits_map.json');
        fs.writeFileSync(outputPath, JSON.stringify(traitsMap, null, 2));

        console.log(`[ÉXITO] Diccionario generado con ${Object.keys(traitsMap).length} términos unificados.`);
        
    } catch (e) {
        console.error('Error generando traits map:', e);
    }
}

generateTraitsMap();