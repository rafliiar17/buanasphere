import { describe, it, expect } from 'bun:test';
import { isAllowedCorsOrigin } from '../src/index';

describe('Domain & CORS Hardening Suite (ADR 0028 / TDD)', () => {
  it('allows primary production domain globe.arafz.id and subdomains', () => {
    expect(isAllowedCorsOrigin('https://globe.arafz.id')).toBe(true);
    expect(isAllowedCorsOrigin('http://globe.arafz.id')).toBe(true);
    expect(isAllowedCorsOrigin('https://app.globe.arafz.id')).toBe(true);
  });

  it('allows alias production domain kurs.arafz.id and subdomains', () => {
    expect(isAllowedCorsOrigin('https://kurs.arafz.id')).toBe(true);
    expect(isAllowedCorsOrigin('http://kurs.arafz.id')).toBe(true);
    expect(isAllowedCorsOrigin('https://preview.kurs.arafz.id')).toBe(true);
  });

  it('allows Cloudflare Pages deployment domains', () => {
    expect(isAllowedCorsOrigin('https://buanasphere-frontend.pages.dev')).toBe(true);
    expect(isAllowedCorsOrigin('https://feat-branch.buanasphere-frontend.pages.dev')).toBe(true);
    expect(isAllowedCorsOrigin('https://kurs-world-frontend.pages.dev')).toBe(true);
    expect(isAllowedCorsOrigin('https://feat-branch.kurs-world-frontend.pages.dev')).toBe(true);
  });

  it('allows localhost and loopback in development', () => {
    expect(isAllowedCorsOrigin('http://localhost:5173')).toBe(true);
    expect(isAllowedCorsOrigin('http://localhost:3000')).toBe(true);
    expect(isAllowedCorsOrigin('http://127.0.0.1:5173')).toBe(true);
  });

  it('rejects unauthorized or malicious external domains', () => {
    expect(isAllowedCorsOrigin('https://evil-hacker.com')).toBe(false);
    expect(isAllowedCorsOrigin('https://globe.arafz.id.attacker.com')).toBe(false);
    expect(isAllowedCorsOrigin('https://fakeglobe.com')).toBe(false);
  });

  it('allows empty origin (direct server-to-server or curl requests)', () => {
    expect(isAllowedCorsOrigin('')).toBe(true);
  });
});
