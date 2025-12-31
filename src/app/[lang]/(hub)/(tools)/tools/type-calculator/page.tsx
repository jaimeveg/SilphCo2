import { getDictionary } from '@/i18n/get-dictionary';
import TypeCalculatorView from './TypeCalculatorView';

interface PageProps {
  params: {
    lang: string;
  };
}

export default async function TypeCalculatorPage({ params }: PageProps) {
  const dict = await getDictionary(params.lang as any);
  return <TypeCalculatorView dict={dict} />;
}