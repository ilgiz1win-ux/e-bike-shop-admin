import { describe, it, expect } from 'vitest';
import { smsText, buildNikitaXml, parseNikitaResponse, isAllowedPhone } from '../../supabase/functions/send-sms/nikita.js';

describe('smsText', () => {
  it('uses the exact copy from the plan', () => {
    expect(smsText('4821')).toBe('Жолдош: кирүү кодуңуз 4821. Эч кимге айтпаңыз.');
  });
});

describe('buildNikitaXml', () => {
  const xml = buildNikitaXml({ login: 'user&co', pwd: 'p<w', sender: 'SMSPRO.KG', id: 'abc123', phone: '996555123456', text: smsText('1234') });
  it('contains all fields', () => {
    expect(xml).toContain('<sender>SMSPRO.KG</sender>');
    expect(xml).toContain('<phone>996555123456</phone>');
    expect(xml).toContain('<id>abc123</id>');
    expect(xml).toContain('<text>Жолдош: кирүү кодуңуз 1234. Эч кимге айтпаңыз.</text>');
  });
  it('escapes XML special characters', () => {
    expect(xml).toContain('<login>user&amp;co</login>');
    expect(xml).toContain('<pwd>p&lt;w</pwd>');
  });
});

describe('parseNikitaResponse', () => {
  it('status 0 is success', () => {
    expect(parseNikitaResponse('<?xml version="1.0"?><response><id>abc</id><status>0</status><phones>1</phones></response>')).toEqual({ ok: true, status: 0 });
  });
  it('non-zero status is a failure', () => {
    const r = parseNikitaResponse('<response><status>3</status></response>');
    expect(r.ok).toBe(false);
    expect(r.status).toBe(3);
  });
  it('garbage is a failure', () => {
    expect(parseNikitaResponse('Internal error').ok).toBe(false);
  });
});

describe('isAllowedPhone', () => {
  it('allows Kyrgyz numbers only', () => {
    expect(isAllowedPhone('996555123456')).toBe(true);
    expect(isAllowedPhone('+996555123456')).toBe(true);
    expect(isAllowedPhone('447911123456')).toBe(false);
    expect(isAllowedPhone('79001234567')).toBe(false);
    expect(isAllowedPhone('')).toBe(false);
  });
});
