import { Language } from './types';

export async function loadTranslations(language: Language): Promise<Record<string, string>> {
  try {
    console.log(`Loading translations for ${language}`);
    const translations = await import(`./translations/${language}`);
    return translations.default;
  } catch (error) {
    console.error(`Failed to load translations for ${language}`, error);
    if (language !== 'en') {
      console.log('Falling back to English translations');
      return loadTranslations('en');
    }
    return {};
  }
} 