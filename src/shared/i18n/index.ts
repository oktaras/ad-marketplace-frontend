import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import enCommon from '@/shared/i18n/locales/en/common.json';
import ruCommon from '@/shared/i18n/locales/ru/common.json';
import ukCommon from '@/shared/i18n/locales/uk/common.json';
import { getTelegramLanguageCode } from '@/shared/lib/telegram';

const telegramLanguage = getTelegramLanguageCode();

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { common: enCommon },
        ru: { common: ruCommon },
        uk: { common: ukCommon },
      },
      fallbackLng: 'en',
      lng: telegramLanguage,
      load: 'languageOnly',
      ns: ['common'],
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
      },
    });
}

export default i18n;
