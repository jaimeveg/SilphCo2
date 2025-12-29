import 'server-only';
import type { Locale } from './settings';

// Mapeo de diccionarios para Code-Splitting eficiente
const dictionaries = {
  es: () => import('./dictionaries/es.json').then((module) => module.default),
  en: () => import('./dictionaries/en.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => 
  dictionaries[locale]?.() ?? dictionaries.es();