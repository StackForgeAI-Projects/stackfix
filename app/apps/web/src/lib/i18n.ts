import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { AppLanguage } from "@stackfix/utils";
import en from "../locales/en.json";
import fr from "../locales/fr.json";
import rw from "../locales/rw.json";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      rw: { translation: rw },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export default i18n;

export function setAppLanguage(lang: AppLanguage): void {
  localStorage.setItem("stackfix_lang", lang);
  document.documentElement.lang = lang === "rw" ? "rw" : lang === "fr" ? "fr" : "en";
  void i18n.changeLanguage(lang);
}
