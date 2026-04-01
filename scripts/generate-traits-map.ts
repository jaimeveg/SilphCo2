import fs from 'fs';
import path from 'path';

const POKEAPI_GQL = 'https://graphql.pokeapi.co/v1beta2/v1/graphql';

const MANUAL_OVERRIDES: Record<string, string> = {
    // Casos con diferencias de espaciado, puntuación o abreviaturas que no se atrapan con el "squash"
    'heavydutyboots': 'heavy-duty-boots',
    // Habilidades fusionadas o genéricas en plataformas competitivas (ej. Pikalytics)
    'asone': 'as-one-glastrier',
    "absolitez": "absolite-z",
    "aloraichiumz": "alolaraichum-z",
    "barbaracite": "barbaracite",
    "baxcalibrite": "baxcalibrite",
    "buginiumz": "buginium-z",
    "chandelurite": "chandelurite",
    "chesnaughtite": "chesnaughtite",
    "chimechite": "chimechite",
    "clefablite": "clefablite",
    "crabominite": "crabominite",
    "darkiniumz": "darkinium-z",
    "darkranite": "darkranite",
    "decidiumz": "decidium-z",
    "delphoxite": "delphoxite",
    "dragalgite": "dragalgite",
    "dragoninite": "dragoninite",
    "dragoniumz": "dragonium-z",
    "drampanite": "drampanite",
    "eelektrossite": "eelektrossite",
    "eeviumz": "eevium-z",
    "electriumz": "electrium-z",
    "emboarite": "emboarite",
    "embodyaspectcornerstone": "embodyaspect-cornerstone",
    "embodyaspecthearthflame": "embodyaspect-hearthflame",
    "embodyaspectteal": "embodyaspect-teal",
    "embodyaspectwellspring": "embodyaspect-wellspring",
    "excadrite": "excadrite",
    "fairiumz": "fairium-z",
    "falinksite": "falinksite",
    "feraligite": "feraligite",
    "fightiniumz": "fightinium-z",
    "firiumz": "firium-z",
    "floettite": "floettite",
    "flyiniumz": "flyinium-z",
    "froslassite": "froslassite",
    "garchompitez": "garchompite-z",
    "ghostiumz": "ghostium-z",
    "glimmoranite": "glimmoranite",
    "golisopite": "golisopite",
    "golurkite": "golurkite",
    "grassiumz": "grassium-z",
    "greninjite": "greninjite",
    "groundiumz": "groundium-z",
    "hawluchanite": "hawluchanite",
    "heatranite": "heatranite",
    "hiddenpowerbug": "hidden-power-bug",
    "hiddenpowerdark": "hidden-power-dark",
    "hiddenpowerdragon": "hidden-power-dragon",
    "hiddenpowerelectric": "hidden-power-electric",
    "hiddenpowerfighting": "hidden-power-fighting",
    "hiddenpowerfire": "hidden-power-fire",
    "hiddenpowerflying": "hidden-power-flying",
    "hiddenpowerghost": "hidden-power-ghost",
    "hiddenpowergrass": "hidden-power-grass",
    "hiddenpowerground": "hidden-power-ground",
    "hiddenpowerice": "hidden-power-ice",
    "hiddenpowerpoison": "hidden-power-poison",
    "hiddenpowerpsychic": "hidden-power-psychic",
    "hiddenpowerrock": "hidden-power-rock",
    "hiddenpowersteel": "hidden-power-steel",
    "hiddenpowerwater": "hidden-power-water",
    "iciumz": "icium-z",
    "inciniumz": "incinium-z",
    "kommoniumz": "kommonium-z",
    "leek": "leek",
    "lucarionitez": "lucarionite-z",
    "lunaliumz": "lunalium-z",
    "lycaniumz": "lycanium-z",
    "magearnite": "magearnite",
    "mail": "mail",
    "malamarite": "malamarite",
    "marshadiumz": "marshadium-z",
    "meganiumite": "meganiumite",
    "meowsticite": "meowsticite",
    "metalalloy": "metal-alloy",
    "mewniumz": "mewnium-z",
    "mimikiumz": "mimikium-z",
    "noability": "no-ability",
    "normaliumz": "normalium-z",
    "nothing": "nothing",
    "pikaniumz": "pikanium-z",
    "pikashuniumz": "pikashunium-z",
    "poisoniumz": "poisonium-z",
    "prettyfeather": "pretty-feather",
    "primariumz": "primarium-z",
    "psychiumz": "psychium-z",
    "pyroarite": "pyroarite",
    "raichunitex": "raichunite-x",
    "raichunitey": "raichunite-y",
    "rockiumz": "rockium-z",
    "scolipite": "scolipite",
    "scovillainite": "scovillainite",
    "scraftinite": "scraftinite",
    "skarmorite": "skarmorite",
    "snorliumz": "snorlium-z",
    "solganiumz": "solganium-z",
    "staraptite": "staraptite",
    "starminite": "starminite",
    "steeliumz": "steelium-z",
    "tapuniumz": "tapunium-z",
    "tatsugirinite": "tatsugirinite",
    "ultranecroziumz": "ultranecrozium-z",
    "victreebelite": "victreebelite",
    "visegrip": "visegrip",
    "wateriumz": "waterium-z",
    "zeraorite": "zeraorite"
};

const QUERY = `
  query GetTraits {
    moves: move { name }
    abilities: ability { name }
    items: item { name }
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

        // Ingestar y sobrescribir con las excepciones manuales
        for (const [squashed, officialSlug] of Object.entries(MANUAL_OVERRIDES)) {
            traitsMap[squashed] = officialSlug;
        }

        const outputPath = path.join(process.cwd(), 'public', 'data', 'traits_map.json');
        fs.writeFileSync(outputPath, JSON.stringify(traitsMap, null, 2));

        console.log(`[ÉXITO] Diccionario generado con ${Object.keys(traitsMap).length} términos unificados.`);

    } catch (e) {
        console.error('Error generando traits map:', e);
    }
}

generateTraitsMap();