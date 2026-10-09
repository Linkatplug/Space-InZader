import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { musicTransition } from '../engine/SoundEngine';

/**
 * Enchaînements de musique avec un faux lecteur audio (le moteur est un singleton :
 * module rechargé à chaque test).
 */

class FakeAudio {
  static all: FakeAudio[] = [];
  private _src = '';
  currentTime = 0;
  get src() { return this._src; }
  set src(v: string) { this._src = v; this.currentTime = 0; } // comme un vrai lecteur
  duration = 180;
  paused = true;
  volume = 1;
  preload = '';
  private listeners: Record<string, ((...a: any[]) => void)[]> = {};
  constructor() { FakeAudio.all.push(this); }
  addEventListener(type: string, fn: () => void) { (this.listeners[type] ??= []).push(fn); }
  emit(type: string) {
    const fns = this.listeners[type] ?? [];
    if (type === 'loadedmetadata') this.listeners[type] = [];
    fns.forEach(f => f());
  }
  play() { this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  load() {}
  removeAttribute() {}
}

type Engine = typeof import('../engine/SoundEngine');
let se: Engine;
const file = () => FakeAudio.all[0]?.src.split('/').pop();
const audio = () => FakeAudio.all[0];
/** Laisse passer les fondus puis charge la piste (métadonnées). */
const settle = () => { vi.advanceTimersByTime(2000); audio()?.emit('loadedmetadata'); };

beforeEach(async () => {
  vi.useFakeTimers();
  FakeAudio.all = [];
  (globalThis as any).window = globalThis;
  (globalThis as any).Audio = FakeAudio;
  vi.resetModules();
  se = await import('../engine/SoundEngine');
});
afterEach(() => {
  se.stopBGM();
  vi.useRealTimers();
  delete (globalThis as any).window;
  delete (globalThis as any).Audio;
});

describe('transitions de musique', () => {
  it('règle pure : seul un changement de palier de combat attend la fin du morceau', () => {
    expect(musicTransition('combat', 'combat')).toBe('afterTrack');
    expect(musicTransition('combat', 'boss')).toBe('now');
    expect(musicTransition('boss', 'combat')).toBe('now');
    expect(musicTransition('combat', 'event')).toBe('now');
    expect(musicTransition(null, 'combat')).toBe('now');
  });

  it('changement de palier : le morceau en cours va jusqu\'au bout, puis le palier suivant', () => {
    se.setMusicContext('combat', 1);
    se.startBGM();
    settle();
    expect(file()).toBe('combat-1.mp3');
    se.setMusicContext('combat', 5);
    settle();
    expect(file()).toBe('combat-1.mp3');
    audio().emit('ended');
    expect(file()).toBe('combat-2.mp3');
  });

  it('boss : coupe tout de suite', () => {
    se.setMusicContext('combat', 1);
    se.startBGM();
    settle();
    se.setMusicContext('boss', 10);
    settle();
    expect(file()).toBe('boss.mp3');
  });

  it('anomalie : la musique de combat reprend là où elle en était', () => {
    se.setMusicContext('combat', 1);
    se.startBGM();
    settle();
    audio().currentTime = 73;
    se.setMusicContext('event', 1);
    settle();
    expect(file()).toBe('event.mp3');
    audio().currentTime = 12;
    se.setMusicContext('combat', 1);
    settle();
    expect(file()).toBe('combat-1.mp3');
    expect(audio().currentTime).toBe(73);
  });

  it('anomalie pendant un changement de palier : reprise du morceau, palier suivant à sa fin', () => {
    se.setMusicContext('combat', 4);
    se.startBGM();
    settle();
    audio().currentTime = 40;
    se.setMusicContext('event', 4);
    settle();
    se.setMusicContext('combat', 5);
    settle();
    expect(file()).toBe('combat-1.mp3');
    expect(audio().currentTime).toBe(40);
    audio().emit('ended');
    expect(file()).toBe('combat-2.mp3');
  });

  it('fin d\'anomalie pendant un arrêt (level-up) : reprise à la bonne position au redémarrage', () => {
    se.setMusicContext('combat', 1);
    se.startBGM();
    settle();
    audio().currentTime = 50;
    se.setMusicContext('event', 1);
    settle();
    se.stopBGM();
    se.setMusicContext('combat', 1);
    se.startBGM();
    settle();
    expect(file()).toBe('combat-1.mp3');
    expect(audio().currentTime).toBe(50);
  });

  it('game over après une anomalie : pas de reprise', () => {
    se.setMusicContext('combat', 1);
    se.startBGM();
    settle();
    se.setMusicContext('event', 1);
    settle();
    se.setMusicContext('gameover');
    settle();
    expect(file()).toBe('gameover.mp3');
    expect(audio().currentTime).toBe(0);
  });
});
