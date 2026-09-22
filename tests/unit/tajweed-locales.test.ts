import { describe, it, expect } from 'vitest';
import { LOCALES, TAJWEED_CONTENT, TOPIC_SLUGS, LOCALE_HREFLANG, LOCALE_LABELS } from '../../src/content/tajweed';
import { TAJWEED_EXTRA } from '../../src/content/tajweedExtra';

describe('Tajwid SEO locales', () => {
  it('exposes Indonesian and Malay', () => {
    expect(LOCALES).toContain('id');
    expect(LOCALES).toContain('ms');
  });

  for (const locale of LOCALES) {
    it(`"${locale}" has a complete hub, every topic and its metadata`, () => {
      const dict = TAJWEED_CONTENT[locale];
      expect(dict).toBeDefined();
      expect(dict.hub.metaTitle.length).toBeGreaterThan(10);
      expect(dict.hub.metaDescription.length).toBeGreaterThan(50);
      for (const slug of TOPIC_SLUGS) {
        const topic = dict.topics[slug];
        expect(topic, `${locale}/${slug} missing`).toBeDefined();
        expect(topic.metaTitle.trim()).not.toBe('');
        expect(topic.metaDescription.trim()).not.toBe('');
        expect(topic.items.length).toBeGreaterThan(0);
        expect(topic.faq.length).toBeGreaterThan(0);
      }
      expect(LOCALE_HREFLANG[locale]).toBeTruthy();
      expect(LOCALE_LABELS[locale]).toBeTruthy();
    });

    it(`"${locale}" has the FAQ page, quizzes and link-block strings`, () => {
      const extra = TAJWEED_EXTRA[locale];
      expect(extra.faqPage.h1.trim()).not.toBe('');
      expect(extra.linkBlock.heading.trim()).not.toBe('');
      expect(Object.keys(extra.quizzes).length).toBeGreaterThan(0);
      for (const [slug, questions] of Object.entries(extra.quizzes)) {
        for (const q of questions) {
          expect(q.options.length, `${locale}/${slug}`).toBeGreaterThan(1);
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(q.options.length);
        }
      }
    });
  }
});
