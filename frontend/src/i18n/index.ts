import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import te from './locales/te';
import hi from './locales/hi';

export const LANGUAGE_STORAGE_KEY = 'gigcircle-language';

export const SUPPORTED_LANGUAGES = ['en', 'te', 'hi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_CONFIG: Record<
  SupportedLanguage,
  { code: SupportedLanguage; label: string; nativeName: string }
> = {
  en: {
    code: 'en',
    label: 'English',
    nativeName: 'English',
  },
  te: {
    code: 'te',
    label: 'Telugu',
    nativeName: 'తెలుగు',
  },
  hi: {
    code: 'hi',
    label: 'Hindi',
    nativeName: 'हिन्दी',
  },
};

export function normalizeLanguageCode(code?: string | null): SupportedLanguage | null {
  if (!code) return null;
  const cleanCode = code.trim().toLowerCase();
  
  if (cleanCode.startsWith('te')) {
    return 'te';
  }
  if (cleanCode.startsWith('hi')) {
    return 'hi';
  }
  if (cleanCode.startsWith('en')) {
    return 'en';
  }
  return null;
}

export function detectInitialLanguage(): SupportedLanguage {
  // 1. Previously selected language from localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      const normalizedStored = normalizeLanguageCode(stored);
      if (normalizedStored) {
        return normalizedStored;
      }
    } catch {
      // localStorage access failed (e.g. security sandboxing)
    }
  }

  // 2. Browser language if supported
  if (typeof navigator !== 'undefined' && navigator.language) {
    const normalizedBrowser = normalizeLanguageCode(navigator.language);
    if (normalizedBrowser) {
      return normalizedBrowser;
    }
  }

  // 3. Fallback to English
  return 'en';
}

const resources = {
  en: { translation: en },
  te: { translation: te },
  hi: { translation: hi },
};

const initialLanguage = detectInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    returnNull: false,
    returnEmptyString: false,
  });

// Keep localStorage in sync with language switches
i18n.on('languageChanged', (lng) => {
  const normalized = normalizeLanguageCode(lng) || 'en';
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
    }
  } catch {
    // Ignore storage errors
  }
});

export async function changeAppLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
}

export function getCategoryLabel(tOrCategory?: any, category?: string | null): string {
  const actualCategory = typeof tOrCategory === 'function' ? category : tOrCategory;
  const tFunc = typeof tOrCategory === 'function' ? tOrCategory : ((key: string, def?: string) => i18n.t(key, { defaultValue: def || '' }));
  if (!actualCategory) return '';
  return tFunc(`categories.${actualCategory}.label`, actualCategory);
}

export function getJobStatusLabel(tOrStatus?: any, status?: string | null): string {
  const actualStatus = typeof tOrStatus === 'function' ? status : tOrStatus;
  const tFunc = typeof tOrStatus === 'function' ? tOrStatus : ((key: string, def?: string) => i18n.t(key, { defaultValue: def || '' }));
  if (!actualStatus) return '';
  return tFunc(`status.job.${actualStatus}`, actualStatus);
}

export function getRequestStatusLabel(tOrStatus?: any, status?: string | null): string {
  const actualStatus = typeof tOrStatus === 'function' ? status : tOrStatus;
  const tFunc = typeof tOrStatus === 'function' ? tOrStatus : ((key: string, def?: string) => i18n.t(key, { defaultValue: def || '' }));
  if (!actualStatus) return '';
  return tFunc(`status.request.${actualStatus}`, actualStatus);
}

export function getPaymentStatusLabel(tOrStatus?: any, status?: string | null): string {
  const actualStatus = typeof tOrStatus === 'function' ? status : tOrStatus;
  const tFunc = typeof tOrStatus === 'function' ? tOrStatus : ((key: string, def?: string) => i18n.t(key, { defaultValue: def || '' }));
  if (!actualStatus) return '';
  return tFunc(`status.payment.${actualStatus}`, actualStatus);
}

export function getVerificationStatusLabel(tOrStatus?: any, status?: string | null): string {
  const actualStatus = typeof tOrStatus === 'function' ? status : tOrStatus;
  const tFunc = typeof tOrStatus === 'function' ? tOrStatus : ((key: string, def?: string) => i18n.t(key, { defaultValue: def || '' }));
  if (!actualStatus) return '';
  return tFunc(`status.verification.${actualStatus}`, actualStatus);
}

export default i18n;

