import { describe, it, expect } from 'vitest';
import { t, tp, setLang, getLang } from '../src/i18n/index.js';

describe('i18n', () => {
  it('defaults to Kyrgyz', () => {
    expect(getLang()).toBe('ky');
    expect(t('login')).toBe('Кирүү');
  });
  it('switches to Russian', () => {
    setLang('ru');
    expect(t('login')).toBe('Вход');
    expect(tp(3, 'seat')).toBe('места');
    setLang('ky');
    expect(tp(3, 'seat')).toBe('орун');
  });
  it('interpolates variables', () => {
    expect(t('seatsFree', { n: 2 })).toBe('Бош орун: 2');
  });
});
