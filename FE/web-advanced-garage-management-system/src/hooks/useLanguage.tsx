import LocalStorage from "@/apis/LocalStorage";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
export type LanguageType = "vi" | "en" ;

export const useLanguage = (): {
  language: LanguageType;
  setLanguage: (locale: LanguageType) => Promise<void>;
} => {
  const { i18n } = useTranslation();

  const handleChangeLanguage = useCallback(
    async (locale: LanguageType) => {
      LocalStorage.saveLanguage(locale);
      await i18n.changeLanguage(locale);
    },
    [i18n]
  );

  useEffect(() => {
    if (!i18n.language || i18n.language === "en") {
      const localLanguage =
        (LocalStorage.getLanguage() as LanguageType) || "vi";
      if (localLanguage) {
        handleChangeLanguage(localLanguage);
      }
    }
  }, [handleChangeLanguage, i18n.language]);

  return useMemo(
    () => ({
      language: i18n.language as LanguageType,
      setLanguage: handleChangeLanguage,
    }),
    [i18n.language, handleChangeLanguage]
  );
};
