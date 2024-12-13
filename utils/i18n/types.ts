export type Language = 'en' | 'ja' | 'ko' | 'zh';

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
}

export const languages: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
];

export const defaultLanguage: Language = 'en'; 