import React, { useState, useRef, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_CONFIG,
  type SupportedLanguage,
  changeAppLanguage,
} from '@/i18n';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'header' | 'compact' | 'light';
}

export function LanguageSwitcher({
  className = '',
  variant = 'header',
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listboxId = useId();

  const currentLang = (SUPPORTED_LANGUAGES.includes(i18n.language as SupportedLanguage)
    ? i18n.language
    : 'en') as SupportedLanguage;

  const currentConfig = LANGUAGE_CONFIG[currentLang] || LANGUAGE_CONFIG.en;

  const handleSelect = async (langCode: SupportedLanguage) => {
    await changeAppLanguage(langCode);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation within dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        const currentIndex = SUPPORTED_LANGUAGES.indexOf(currentLang);
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
      return;
    }

    if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
      if (e.key === 'Escape') {
        e.preventDefault();
        buttonRef.current?.focus();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % SUPPORTED_LANGUAGES.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev <= 0 ? SUPPORTED_LANGUAGES.length - 1 : prev - 1
      );
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < SUPPORTED_LANGUAGES.length) {
        handleSelect(SUPPORTED_LANGUAGES[focusedIndex]);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      const idx = SUPPORTED_LANGUAGES.indexOf(currentLang);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, currentLang]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={t('language.selectLanguage', 'Select language')}
        data-testid="language-switcher-button"
        className={`group flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
          variant === 'light'
            ? 'border-slate-200/80 bg-white/90 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
            : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <Globe
          className="h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0"
          aria-hidden="true"
        />
        <span className="font-medium tracking-tight whitespace-nowrap">
          {currentConfig.nativeName}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-1.5 w-44 origin-top-right rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            {t('language.selectLanguage', 'Select language')}
          </div>
          <ul
            id={listboxId}
            ref={listboxRef}
            role="listbox"
            aria-label={t('language.selectLanguage', 'Select language')}
            className="space-y-0.5"
          >
            {SUPPORTED_LANGUAGES.map((langCode, index) => {
              const config = LANGUAGE_CONFIG[langCode];
              const isSelected = currentLang === langCode;
              const isFocused = focusedIndex === index;

              return (
                <li
                  key={langCode}
                  id={`lang-option-${langCode}`}
                  role="option"
                  aria-selected={isSelected}
                  data-testid={`language-option-${langCode}`}
                  onClick={() => handleSelect(langCode)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs font-medium cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : isFocused
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{config.nativeName}</span>
                    {config.label !== config.nativeName && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({config.label})
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check
                      className="h-3.5 w-3.5 text-emerald-600 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
