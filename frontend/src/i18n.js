import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files for development
const loadDevTranslations = async (language, namespace) => {
  if (process.env.NODE_ENV === 'development') {
    try {
      return await import(`./locales/${language}/${namespace}.json`);
    } catch (err) {
      console.error(`Failed to load translation: ${language}/${namespace}`, err);
      return null;
    }
  }
  return null;
};

// Helper function to set the direction (RTL or LTR)
const setDirection = (lang) => {
  const rtlLanguages = ['ar']; // List of RTL languages
  const isRtl = rtlLanguages.includes(lang);
  const dir = isRtl ? 'rtl' : 'ltr'; // RTL for Arabic, LTR for others

  document.documentElement.setAttribute('dir', dir); // Set the dir attribute
  document.documentElement.setAttribute('lang', lang); // Set the lang attribute
};

// Detect the language from the device if no language is chosen yet
const getInitialLanguage = () => {
  const storedLanguage = localStorage.getItem('language');
  if (storedLanguage) {
    return storedLanguage; // Return stored language if available
  }
  // If no stored language, use the device or browser language
  const deviceLanguage = window.navigator.language || 'en'; // Default to 'en' if detection fails
  return deviceLanguage.split('-')[0]; // Use the language part (e.g., 'en' from 'en-US')
};

i18n
  .use(Backend) // Load translations using http (default public/assets/locales)
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass the i18n instance to react-i18next
  .init({
    fallbackLng: 'en', // Fallback to English if no language is detected
    debug: true,
    lng: getInitialLanguage(), // Use the initial language from the device or stored value
    interpolation: {
      escapeValue: false, // React already handles XSS protection
    },
    backend: {
      loadPath: '/static/locales/{{lng}}/{{ns}}.json',  // Production path
      load: async (languages, namespaces) => {
        if (process.env.NODE_ENV === 'development') {
          const translations = {};
          for (const lng of languages) {
            translations[lng] = {};
            for (const ns of namespaces) {
              const data = await loadDevTranslations(lng, ns);
              if (data) {
                translations[lng][ns] = data.default;
              }
            }
          }
          return translations;
        }
      }
    },
    detection: {
      // Detection order (use localStorage first, then navigator)
      order: ['localStorage', 'navigator'],
      // Keys or params to lookup language from
      lookupLocalStorage: 'language',
      // Cache user language
      caches: ['localStorage'],
      // Specify custom lookup function for language detection from navigator if necessary
      lookupNavigator: true, // Use device/browser language as a fallback if no stored language
    },
    fallbackLng: 'en', // Set a fallback language in case the detection fails
  });

// Listen to language change and adjust the direction
i18n.on('languageChanged', (lang) => {
  setDirection(lang);
  localStorage.setItem('language', lang); // Store the chosen language in localStorage
});

// On initial load, check the detected language and set the direction
const detectedLanguage = getInitialLanguage();
setDirection(detectedLanguage);

export default i18n;
