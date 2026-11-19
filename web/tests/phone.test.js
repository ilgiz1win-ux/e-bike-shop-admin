import { describe, it, expect } from 'vitest';
import { normalizePhone, formatPhone } from '../src/lib/phone.js';

describe('normalizePhone', () => {
  it.each(['+996 555 12 34 56', '0555123456', '555123456', '996555123456'])('accepts %s', (input) => {
    expect(normalizePhone(input)).toBe('996555123456');
  });
  it.each(['12345', '+79001234567', '', '99655512345'])('rejects %s', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe('formatPhone', () => {
  it('formats 996 numbers for display', () => {
    expect(formatPhone('996555123456')).toBe('+996 555 12 34 56');
  });
});
