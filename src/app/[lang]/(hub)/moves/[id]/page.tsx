import { promises as fs } from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { IMoveDetail } from '@/types/movedex';
import MoveDetailClient from './MoveDetailClient'; // Importamos el cliente
import { Lang } from '@/lib/pokedexDictionary'; // <-- 1. IMPORTAMOS EL TIPO


export async function generateStaticParams() {
    try {
        const indexRaw = await fs.readFile(path.join(process.cwd(), 'public/data/movedex_index.json'), 'utf8');
        const moves = JSON.parse(indexRaw);
        return moves.map((m: any) => ({ id: m.id }));
    } catch { return []; }
}

export default async function MovePage({ params }: { params: { lang: string, id: string } }) {
    try {
        const filePath = path.join(process.cwd(), `public/data/moves/move_${params.id}.json`);
        const fileData = await fs.readFile(filePath, 'utf8');
        const moveDetail: IMoveDetail = JSON.parse(fileData);

        // Renderizamos el componente cliente y le pasamos los props correctos
        return <MoveDetailClient move={moveDetail} lang={params.lang as Lang} />;
    } catch (error) {
        notFound();
    }
}