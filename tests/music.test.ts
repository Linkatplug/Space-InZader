import { describe, it, expect } from 'vitest';
import {
  MUSIC_CONTEXTS, MUSIC_TRACKS, MUSIC_ONE_SHOT, MusicContext,
  musicFilesFor, nextPlayable, setMusicContext, startBGM, stopBGM, nextTrack,
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

  it('un contexte sans piste dédiée renvoie une liste vide', () => {
    const saved = MUSIC_CONTEXTS.event;
    expect(musicFilesFor('event', 3)).toEqual([]);
    expect(musicFilesFor('gameover')).toEqual([]);
    expect(saved).toEqual([]);
  });

  it('renvoie une copie (pas le tableau du registre)', () => {
    const files = musicFilesFor('menu');
    files.push('x.mp3');
    expect(musicFilesFor('menu')).not.toContain('x.mp3');
  });

  it('le registre ne référence que des MP3 connus tant que les nouveaux fichiers ne sont pas livrés', () => {
    for (const ctx of CONTEXTS) {
      for (const tier of MUSIC_CONTEXTS[ctx]) {
        expect(tier.files.length).toBeGreaterThan(0);
        for (const f of tier.files) expect(MUSIC_TRACKS).toContain(f);
      }
    }
  });

  it('les paliers de combat sont triés et commencent à la vague 1', () => {
    const waves = MUSIC_CONTEXTS.combat.map(t => t.minWave ?? 1);
    expect(waves[0]).toBe(1);
    expect([...waves].sort((a, b) => a - b)).toEqual(waves);
  });

  it('seul le game over est joué une fois', () => {
    expect([...MUSIC_ONE_SHOT]).toEqual(['gameover']);
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

describe('API sous Node (sans navigateur)', () => {
  it('ne plante pas hors navigateur', () => {
    expect(() => {
      setMusicContext('menu');
      setMusicContext('combat', 7);
      setMusicContext('boss', 10);
      setMusicContext('event');
      setMusicContext('gameover');
      startBGM();
      nextTrack();
      stopBGM();
    }).not.toThrow();
  });
});
