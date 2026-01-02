import { getDictionary } from "@/i18n/get-dictionary";
import HubPageView from "./HubPageView";

interface HubPageProps {
  params: {
    lang: string;
  };
}

export default async function HubPage({ params }: HubPageProps) {
  const { lang } = params;
  const dict = await getDictionary(lang as any);

  // Renderizamos el cliente pasándole los datos necesarios
  return <HubPageView dict={dict} lang={lang} />;
}