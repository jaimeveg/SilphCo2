import { getDictionary } from "@/i18n/get-dictionary";
import ItemDexFinderClient from "@/components/items/ItemDexFinderClient";

export default async function ItemDexFinderPage({ params }: { params: { lang: string } }) {
  const { lang } = params;
  const dict = await getDictionary(lang as any);
  const t = dict.itemdex;

  return <ItemDexFinderClient lang={lang} t={t} />;
}
