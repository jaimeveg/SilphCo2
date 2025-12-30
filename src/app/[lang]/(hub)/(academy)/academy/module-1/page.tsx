import content from '@/data/module_1_content_v2.json';
import { NarrativeSceneData } from '@/types/silph';
import { getDictionary } from "@/i18n/get-dictionary";
// ELIMINADO: import { getModule1Sections } from "@/data/navigation"; 
import Module1View from './Module1View';

interface ModulePageProps {
  params: {
    lang: string;
  };
}

export default async function Module1Page({ params }: ModulePageProps) {
  // Data Fetching (Server Side)
  const scenes = (content as any).module_1_narrative.scenes as NarrativeSceneData[];
  const dict = await getDictionary(params.lang as any);
  
  // ELIMINADO: const navigationSections = getModule1Sections(dict);
  // No podemos pasar iconos (funciones) por la frontera Server-Client

  return (
    <Module1View 
      scenes={scenes} 
      // navigationSections={navigationSections} <--- ELIMINADO
      dict={dict} 
    />
  );
}