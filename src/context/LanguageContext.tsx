import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppLanguage } from '../i18n/types';
import { Category, MenuItem, RestaurantTable } from '../types';
import {
  localizeCategory as localizeCatFn,
  localizeDish as localizeDishFn,
  localizeOrderItemName as localizeOrderItemFn,
  localizeTableLabel as localizeTableFn,
} from '../i18n/dataTranslations';
import { DomAutoTranslator, translateUiText } from '../i18n/autoTranslator';

const STORAGE_LANG_KEY = 'dineflow_app_language_v1';
const STORAGE_CHOSEN_KEY = 'dineflow_lang_chosen_v1';

interface LanguageContextType {
  language: AppLanguage;
  hasSelectedLanguage: boolean;
  setLanguage: (lang: AppLanguage) => void;
  confirmInitialLanguage: (lang: AppLanguage) => void;
  localizeDish: (dish: MenuItem) => MenuItem;
  localizeCategory: (cat: Category) => Category;
  localizeTable: (table: RestaurantTable | null, tableNumber: number) => string;
  localizeOrderItem: (itemName: string, menuItemId: string | undefined, menuItems: MenuItem[]) => string;
  tr: (uzText: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function loadStoredLanguage(): AppLanguage {
  try {
    const raw = localStorage.getItem(STORAGE_LANG_KEY);
    if (raw === 'uz' || raw === 'en' || raw === 'ru') return raw;
  } catch {
    // ignore storage errors
  }
  return 'uz';
}

function loadHasSelectedLanguage(): boolean {
  try {
    return localStorage.getItem(STORAGE_CHOSEN_KEY) === '1';
  } catch {
    return false;
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(loadStoredLanguage);
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState<boolean>(loadHasSelectedLanguage);
  const translatorRef = useRef<DomAutoTranslator | null>(null);

  useEffect(() => {
    if (!translatorRef.current) {
      translatorRef.current = new DomAutoTranslator();
    }
    document.documentElement.lang = language;

    // Defer slightly so React commits current render pass before DOM walk
    const raf = requestAnimationFrame(() => {
      translatorRef.current?.setLanguage(language);
    });
    return () => cancelAnimationFrame(raf);
  }, [language]);

  useEffect(() => {
    return () => {
      translatorRef.current?.destroy();
    };
  }, []);

  const setLanguage = useCallback((nextLang: AppLanguage) => {
    setLanguageState(nextLang);
    setHasSelectedLanguage(true);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, nextLang);
      localStorage.setItem(STORAGE_CHOSEN_KEY, '1');
    } catch {
      // ignore storage errors
    }
  }, []);

  const confirmInitialLanguage = useCallback(
    (chosenLang: AppLanguage) => {
      setLanguage(chosenLang);
    },
    [setLanguage]
  );

  const localizeDish = useCallback((dish: MenuItem) => localizeDishFn(dish, language), [language]);
  const localizeCategory = useCallback((cat: Category) => localizeCatFn(cat, language), [language]);
  const localizeTable = useCallback(
    (table: RestaurantTable | null, tableNumber: number) => localizeTableFn(table, tableNumber, language),
    [language]
  );
  const localizeOrderItem = useCallback(
    (itemName: string, menuItemId: string | undefined, menuItems: MenuItem[]) =>
      localizeOrderItemFn(itemName, menuItemId, menuItems, language),
    [language]
  );
  const tr = useCallback((uzText: string) => translateUiText(uzText, language), [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        hasSelectedLanguage,
        setLanguage,
        confirmInitialLanguage,
        localizeDish,
        localizeCategory,
        localizeTable,
        localizeOrderItem,
        tr,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
