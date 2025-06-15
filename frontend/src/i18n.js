// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(HttpBackend) // ✅ load JSON files
    .use(LanguageDetector) // ✅ detect browser language
    .use(initReactI18next) // ✅ connect to react-i18next
    .init({
        fallbackLng: 'en',
        load: 'languageOnly', // avoid 'en-US' mismatch
        debug: true,
        interpolation: {
            escapeValue: false,
        },
        backend: {
            // ✅ must match your working URL
            loadPath: '/tourism-analytics/locales/{{lng}}/translation.json'
        }
    });

export default i18n;
