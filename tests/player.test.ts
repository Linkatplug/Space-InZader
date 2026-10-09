import { describe, it, expect, beforeEach } from 'vitest';
import { loadPlayer, makeId, resetPlayerFallback, sanitizeName, savePlayerName } from '../components/player/playerStore';
import { PLAYER_STORAGE_KEY } from '../components/player/text';

const memory = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); }, data };
};
const blocked = {
  getItem: () => { throw new Error('bloqué'); },
  setItem: () => { throw new Error('bloqué'); },
};

describe('pseudo', () => {
  it('nettoie : contrôle retiré, espaces rognés, 16 caractères max', () => {
    expect(sanitizeName('  Jean\u0000\n  Luc  ')).toBe('Jean Luc');
    expect(sanitizeName('a'.repeat(40))).toBe('a'.repeat(16));
    expect(sanitizeName('Zoé')).toBe('Zoé');
  });
  it('vide, trop court ou invalide → « Pilote »', () => {
    for (const v of ['', '   ', 'x', '\u0007\u0007', undefined, 42]) expect(sanitizeName(v)).toBe('Pilote');
  });
});

describe('joueur local', () => {
  beforeEach(() => resetPlayerFallback());

  it('crée un id puis le retrouve', () => {
    const s = memory();
    const a = loadPlayer(s);
    expect(a.name).toBe('Pilote');
    expect(a.id.length).toBeGreaterThanOrEqual(8);
    expect(loadPlayer(s).id).toBe(a.id);
    expect(JSON.parse(s.data.get(PLAYER_STORAGE_KEY)!).id).toBe(a.id);
  });
  it('changer le pseudo garde l’id et nettoie', () => {
    const s = memory();
    const a = loadPlayer(s);
    const b = savePlayerName('  Neo  ', s);
    expect(b).toEqual({ id: a.id, name: 'Neo' });
    expect(loadPlayer(s)).toEqual(b);
    expect(savePlayerName('x', s).name).toBe('Pilote');
  });
  it('données abîmées : nouveau joueur', () => {
    const s = memory();
    s.setItem(PLAYER_STORAGE_KEY, '{pas du json');
    expect(loadPlayer(s).name).toBe('Pilote');
  });
  it('localStorage bloqué : pas de crash, id stable pendant la session', () => {
    const a = loadPlayer(blocked);
    expect(loadPlayer(blocked).id).toBe(a.id);
    expect(savePlayerName('Neo', blocked).name).toBe('Neo');
    expect(loadPlayer(null).name).toBe('Neo');
  });
  it('makeId : repli sans crypto.randomUUID', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true });
    try {
      expect(makeId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
    } finally {
      if (original) Object.defineProperty(globalThis, 'crypto', original);
    }
  });
});
