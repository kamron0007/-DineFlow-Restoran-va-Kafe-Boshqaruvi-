export type AppLanguage = 'uz' | 'en' | 'ru';

export interface LanguageOption {
  code: AppLanguage;
  nativeLabel: string;
  shortCode: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', nativeLabel: 'English', shortCode: 'EN' },
  { code: 'ru', nativeLabel: 'Русский', shortCode: 'RU' },
  { code: 'uz', nativeLabel: "O'zbek", shortCode: 'UZ' },
];
