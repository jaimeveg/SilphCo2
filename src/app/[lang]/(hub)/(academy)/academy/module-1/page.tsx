import { getDictionary } from "@/i18n/get-dictionary";
import Module1View from './Module1View';

interface ModulePageProps {
  params: {
    lang: string;
  };
}

export default async function Module1Page({ params }: ModulePageProps) {
  const moduleData = await import(`@/data/modules/module_1/${params.lang}.json`);
  const dict = await getDictionary(params.lang as any);
  
  const scenes = moduleData.module_1_narrative.scenes;

  return (
    <Module1View 
      scenes={scenes} 
      dict={dict} 
      lang={params.lang} // INYECCIÓN DE IDIOMA
    />
  );
}