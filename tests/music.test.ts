import { describe, it, expect } from 'vitest';
// @ts-expect-error pas de @types/node dans ce projet (tests exécutés sous Node par Vitest)
import { existsSync } from 'node:fs';
// @ts-expect-error idem
import { join } from 'node:path';

const MUSIC_DIR = join((globalThis as any).process.cwd(), 'public', 'music');
import {
  MUSIC_CONTEXTS, MUSIC_TRACKS, MUSIC_ONE_SHOT, MusicContext,
  musicFilesFor, nextPlayable, trackInPlaylist, setMusicContext, startBGM, stopBGM, nextTrack,
} from '../engine/SoundEngine';

const CONTEXTS = Object.keys(MUSIC_CONTEXTS) as MusicContext[];

describe('musique par contexte', () => {
  it('le combat change de pistes selon la vague (palier le plus élevé atteint)', () => {
    const w1 = musicFilesFor('combat', 1);
    const w5 = musicFilesFor('combat', 5);
    const w11 = musicFilesFor('combat', 11);
    expect(w1).toEqual(MUSIC_CONTEXTS.combat[0].files);
    expect(w5).toEqual(MUSIC_CONTEXTS.combat[1].files);
    expect(w11).toEqual(MUSIC_CONTEXTS.combat[2].files);
    expect(musicFilesFor('combat', 4)).toEqual(w1);
    expect(musicFilesFor('combat', 10)).toEqual(w5);
    expect(musicFilesFor('combat', 999)).toEqual(w11);
  });

  it('vague absente ou nulle : premier palier', () => {
    expect(musicFilesFor('combat')).toEqual(MUSIC_CONTEXTS.combat[0].files);
    expect(musicFilesFor('combat', 0)).toEqual(MUSIC_CONTEXTS.combat[0].files);
  });

  it('chaque contexte a au moins une piste dédiée', () => {
    for (const ctx of CONTEXTS) expect(musicFilesFor(ctx, 1).length).toBeGreaterThan(0);
  });

  it('renvoie une copie (pas le tableau du registre)', () => {
    const files = musicFilesFor('menu');
    files.push('x.mp3');
    expect(musicFilesFor('menu')).not.toContain('x.mp3');
  });

  it('tous les fichiers du registre existent dans public/music', () => {
    for (const ctx of CONTEXTS) {
      for (const tier of MUSIC_CONTEXTS[ctx]) {
        expect(tier.files.length).toBeGreaterThan(0);
        for (const f of tier.files) expect(existsSync(join(MUSIC_DIR, f)), f).toBe(true);
      }
    }
  });

  it('la playlist de repli existe aussi', () => {
    for (const f of MUSIC_TRACKS) expect(existsSync(join(MUSIC_DIR, f)), f).toBe(true);
  });

  it('les paliers de combat sont triés et commencent à la vague 1', () => {
    const waves = MUSIC_CONTEXTS.combat.map(t => t.minWave ?? 1);
    expect(waves[0]).toBe(1);
    expect([...waves].sort((a, b) => a - b)).toEqual(waves);
  });

  it('game over et record sont joués une fois', () => {
    expect([...MUSIC_ONE_SHOT].sort()).toEqual(['gameover', 'record']);
  });
});

describe('repli quand un fichier manque', () => {
  const files = ['a.mp3', 'b.mp3', 'c.mp3'];
  it('saute les pistes défaillantes en circulaire', () => {
    expect(nextPlayable(files, new Set(), 1)).toBe(1);
    expect(nextPlayable(files, new Set(['b.mp3']), 1)).toBe(2);
    expect(nextPlayable(files, new Set(['b.mp3', 'c.mp3']), 1)).toBe(0);
  });
  it('index hors bornes ou négatif : ramené dans la liste', () => {
    expect(nextPlayable(files, new Set(), 4)).toBe(1);
    expect(nextPlayable(files, new Set(), -1)).toBe(2);
  });
  it('-1 si tout est défaillant ou liste vide', () => {
    expect(nextPlayable(files, new Set(files), 0)).toBe(-1);
    expect(nextPlayable([], new Set(), 0)).toBe(-1);
  });
});

describe('reprise après arrêt', () => {
  it('reprend la piste courante si elle est dans la playlist, sinon change', () => {
    const combat = musicFilesFor('combat', 1);
    expect(trackInPlaylist(combat[0], combat)).toBe(true);
    expect(trackInPlaylist(musicFilesFor('menu')[0], combat)).toBe(false);
    expect(trackInPlaylist('', combat)).toBe(false);
  });
});

describe('API sous Node (sans navigateur)', () => {
  it('ne plante pas hors navigateur', () => {
    expect(() => {
      setMusicContext('menu');
      setMusicContext('combat', 7);
      setMusicContext('boss', 10);
      setMusicContext('event');
      setMusicContext('gameover');
      setMusicContext('record');
      startBGM();
      nextTrack();
      stopBGM();
    }).not.toThrow();
  });
});
