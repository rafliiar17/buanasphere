export type SupportedLocale = 'id' | 'en';

export interface LocaleDefinition {
  code: SupportedLocale;
  name: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleDefinition[] = [
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export type TranslationParams = Record<string, string | number>;
