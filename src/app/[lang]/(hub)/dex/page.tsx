import { getDictionary } from '@/i18n/get-dictionary';
import DexLanding from './DexLanding';

interface DexPageProps {
  params: { lang: string };
}

export default async function DexPage({ params }: DexPageProps) {
  const dict = await getDictionary(params.lang as any);
  return <DexLanding lang={params.lang} dict={dict} />;
}
