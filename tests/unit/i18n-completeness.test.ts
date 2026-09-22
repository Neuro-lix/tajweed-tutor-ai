import { describe, it, expect } from 'vitest';
import translations, { LANGUAGE_LIST, getTranslations } from '../../src/i18n/translations';

type Dict = Record<string, unknown>;

const REFERENCE = 'fr';
const refKeys = Object.keys(translations[REFERENCE] as Dict).sort();

describe('i18n completeness', () => {
  it('declares every language of LANGUAGE_LIST in the translations map', () => {
    for (const lang of LANGUAGE_LIST) {
      expect(translations[lang.code], `missing dictionary for ${lang.code}`).toBeDefined();
    }
  });

  for (const lang of LANGUAGE_LIST.map((l) => l.code)) {
    it(`"${lang}" covers every French key`, () => {
      const dict = translations[lang] as Dict;
      const missing = refKeys.filter((k) => !(k in dict));
      expect(missing, `missing keys in ${lang}: ${missing.slice(0, 20).join(', ')}`).toEqual([]);
    });

    it(`"${lang}" has no empty or untranslated-placeholder value`, () => {
      const dict = translations[lang] as Dict;
      const bad = refKeys.filter((k) => {
        const v = dict[k];
        return typeof v === 'string' && (v.trim() === '' || v.trim().toUpperCase() === 'TODO');
      });
      expect(bad, `empty values in ${lang}: ${bad.slice(0, 20).join(', ')}`).toEqual([]);
    });

    it(`getTranslations("${lang}") returns the localized dictionary`, () => {
      expect(Object.keys(getTranslations(lang)).length).toBeGreaterThanOrEqual(refKeys.length);
    });
  }
});
