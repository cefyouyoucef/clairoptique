import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translate } from "../i18n/translations.js";

const LANGUAGE_STORAGE_KEY = "clair-optique-language";
const LanguageContext = createContext(null);

function getInitialLanguage() {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return savedLanguage === "ar" ? "ar" : "fr";
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage) => {
    const supportedLanguage = nextLanguage === "ar" ? "ar" : "fr";
    setLanguageState(supportedLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, supportedLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "fr" ? "ar" : "fr");
  }, [language, setLanguage]);

  const t = useCallback(
    (key, values) => translate(language, key, values),
    [language]
  );

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === "ar" ? "rtl" : "ltr";
    document.body.classList.remove("language-fr", "language-ar");
    document.body.classList.add(`language-${language}`);
  }, [language]);

  const contextValue = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, t, toggleLanguage]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}
