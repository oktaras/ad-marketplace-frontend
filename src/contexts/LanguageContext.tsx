import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type AppLanguage = "EN" | "RU" | "UK";

export const LANGUAGES: { value: AppLanguage; label: string; nativeLabel: string }[] = [
  { value: "EN", label: "English", nativeLabel: "English" },
  { value: "RU", label: "Russian", nativeLabel: "Русский" },
  { value: "UK", label: "Ukrainian", nativeLabel: "Українська" },
];

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLangState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem("tg-ads-language");
    if (saved === "EN" || saved === "RU" || saved === "UK") return saved;
    return "EN";
  });

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLangState(lang);
    localStorage.setItem("tg-ads-language", lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
