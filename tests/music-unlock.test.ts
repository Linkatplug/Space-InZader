import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/** Lecture bloquée par le navigateur avant le premier geste : réessai unique au premier clic/touche. */

class FakeAudio {
  static all: FakeAudio[] = [];
  static blocked = true;
  src = '';
  currentTime = 0;
  duration = 180;
  paused = true;
  volume = 1;
  preload = '';
  playCalls = 0;
  constructor() { FakeAudio.all.push(this); }
  addEventListener() {}
  play() {
    this.playCalls++;
    if (FakeAudio.blocked) return Promise.reject(new Error('NotAllowedError'));
    this.paused = false;
    return Promise.resolve();
  }
  pause() { this.paused = true; }
  load() {}
  removeAttribute() {}
}

/** Faux window : enregistre les écouteurs et permet de simuler un geste. */
const fakeWindow = () => {
  const listeners = new Map<string, Set<(...a: any[]) => void>>();
  return {
    listeners,
    addEventListener: (t: string, fn: any) => { if (!listeners.has(t)) listeners.set(t, new Set()); listeners.get(t)!.add(fn); },
    removeEventListener: (t: string, fn: any) => { listeners.get(t)?.delete(fn); },
    count: () => [...listeners.values()].reduce((n, set) => n + set.size, 0),
    fire: (t: string) => [...(listeners.get(t) ?? [])].forEach(f => f()),
  };
};

type Engine = typeof import('../engine/SoundEngine');
let se: Engine;
let win: ReturnType<typeof fakeWindow>;
const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

beforeEach(async () => {
  FakeAudio.all = [];
  FakeAudio.blocked = true;
  win = fakeWindow();
  (globalThis as any).window = win;
  (globalThis as any).Audio = FakeAudio;
  vi.resetModules();
  se = await import('../engine/SoundEngine');
});
afterEach(() => {
  se.stopBGM();
  delete (globalThis as any).window;
  delete (globalThis as any).Audio;
});

describe('démarrage de la musique au premier geste', () => {
  it('lecture refusée : écouteurs installés une seule fois, sans doublon', async () => {
    se.setMusicContext('menu');
    se.startBGM();
    await flush();
    const n = win.count();
    expect(n).toBeGreaterThan(0);
    se.startBGM();
    se.startBGM();
    await flush();
    expect(win.count()).toBe(n);
  });

  it('le premier geste relance la lecture puis retire les écouteurs', async () => {
    se.setMusicContext('menu');
    se.startBGM();
    await flush();
    const audio = FakeAudio.all[0];
    expect(audio.paused).toBe(true);
    expect(audio.src).toContain('menu.mp3');
    FakeAudio.blocked = false;
    win.fire('pointerdown');
    await flush();
    expect(audio.paused).toBe(false);
    expect(win.count()).toBe(0);
  });

  it('geste encore refusé : on réessaie au geste suivant', async () => {
    se.startBGM();
    await flush();
    const audio = FakeAudio.all[0];
    win.fire('keydown'); // toujours bloqué
    await flush();
    expect(audio.paused).toBe(true);
    expect(win.count()).toBeGreaterThan(0);
    FakeAudio.blocked = false;
    win.fire('click');
    await flush();
    expect(audio.paused).toBe(false);
    expect(win.count()).toBe(0);
  });

  it('après stopBGM, un geste ne relance pas la musique', async () => {
    se.startBGM();
    await flush();
    se.stopBGM();
    FakeAudio.blocked = false;
    win.fire('pointerdown');
    await flush();
    expect(FakeAudio.all[0].paused).toBe(true);
  });

  it('muet : la lecture démarre mais le volume reste à 0', async () => {
    se.applyAudioSettings({ muted: true, musicVolume: 0.5, sfxVolume: 1 });
    se.startBGM();
    await flush();
    FakeAudio.blocked = false;
    win.fire('pointerdown');
    await flush();
    expect(FakeAudio.all[0].volume).toBe(0);
  });

  it('lecture autorisée d\'emblée : aucun écouteur', async () => {
    FakeAudio.blocked = false;
    se.startBGM();
    await flush();
    expect(win.count()).toBe(0);
  });
});
