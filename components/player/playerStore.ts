import { PLAYER_NAME, PLAYER_STORAGE_KEY, PLAYER_TEXT } from './text';

/** Joueur local : identifiant aléatoire stable + pseudo, gardés dans localStorage (`si.player`). */
export interface Player { id: string; name: string }

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

/** Pseudo propre : caractères de contrôle retirés, espaces compactés/rognés, ≤ 16 ; trop court ou vide → « Pilote ». */
export const sanitizeName = (raw: unknown): string => {
  const text = typeof raw === 'string' ? raw : '';
  // eslint-disable-next-line no-control-regex
  const cleaned = text.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').replace(/\s+/g, ' ').trim();
  const cut = Array.from(cleaned).slice(0, PLAYER_NAME.max).join('').trim();
  return Array.from(cut).length >= PLAYER_NAME.min ? cut : PLAYER_TEXT.defaultName;
};

/** Identifiant aléatoire : crypto.randomUUID, sinon repli (anciens navigateurs, contexte non sécurisé). */
export const makeId = (): string => {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`;
};

const defaultStorage = (): StorageLike | null => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
};

// Mémoire de repli quand localStorage est bloqué : l'identifiant reste stable pendant la session.
let fallback: Player | null = null;

const write = (storage: StorageLike | null, player: Player) => {
  fallback = player;
  try { storage?.setItem(PLAYER_STORAGE_KEY, JSON.stringify(player)); } catch { /* stockage bloqué */ }
};

/** Lit le joueur ; le crée (id aléatoire, pseudo « Pilote ») s'il n'existe pas ou si les données sont abîmées. */
export const loadPlayer = (storage: StorageLike | null = defaultStorage()): Player => {
  try {
    const raw = storage?.getItem(PLAYER_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data.id === 'string' && data.id.length >= 8) {
        const player = { id: data.id, name: sanitizeName(data.name) };
        fallback = player;
        return player;
      }
    }
  } catch { /* JSON invalide ou stockage bloqué */ }
  if (fallback) return fallback;
  const player = { id: makeId(), name: PLAYER_TEXT.defaultName };
  write(storage, player);
  return player;
};

/** Enregistre un nouveau pseudo (nettoyé) et renvoie le joueur à jour. */
export const savePlayerName = (name: string, storage: StorageLike | null = defaultStorage()): Player => {
  const current = loadPlayer(storage);
  const player = { id: current.id, name: sanitizeName(name) };
  write(storage, player);
  return player;
};

/** Pour les tests : oublie la mémoire de repli. */
export const resetPlayerFallback = () => { fallback = null; };
