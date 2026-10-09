
import { DamageType } from '../types';

let audioCtx: AudioContext | null = null;
let bgmOscillators: { osc: OscillatorNode, gain: GainNode }[] = [];
let bgmInterval: any = null;
let sfxGain: GainNode | null = null;

/** Réglages audio (mute global, volumes). */
export const audioSettings = { muted: false, musicVolume: 0.35, sfxVolume: 1 };

const sfxOut = (): AudioNode => {
  if (!sfxGain && audioCtx) {
    sfxGain = audioCtx.createGain();
    sfxGain.connect(audioCtx.destination);
  }
  if (sfxGain) sfxGain.gain.value = audioSettings.muted ? 0 : audioSettings.sfxVolume;
  return sfxGain!;
};

// --- Musique : MP3 (public/music) par contexte, repli sur la playlist puis sur le procédural ---

/** Playlist historique (V1) : repli quand un contexte n'a pas de piste dédiée. */
export const MUSIC_TRACKS = [
  '575907_Space-Dumka-8bit.mp3',
  '770175_Outer-Space-Adventure-Agen.mp3',
  '888921_8-Bit-Flight-Loop.mp3',
  '1263681_8-Bit-Flight.mp3',
  '290077_spacecake.mp3',
  '19583_newgrounds_robot_.mp3',
];

/** Situations de jeu qui peuvent avoir leur propre musique. */
export type MusicContext = 'menu' | 'combat' | 'boss' | 'event' | 'gameover';

/** Palier de musique : actif à partir de `minWave` (défaut 1). Le palier le plus élevé atteint gagne. */
export interface MusicTier { minWave?: number; files: string[] }

/**
 * Registre des musiques par contexte (piloté par les données).
 * Pour ajouter une piste : déposer le MP3 dans public/music/ et l'ajouter ici.
 * Liste vide = pas de piste dédiée : menu/combat/boss prennent la playlist historique,
 * event/gameover laissent la musique en cours.
 * Fichiers prévus (à produire) : menu.mp3, combat-1/2/3.mp3, boss.mp3, event.mp3, gameover.mp3.
 */
export const MUSIC_CONTEXTS: Record<MusicContext, MusicTier[]> = {
  menu: [{ files: ['575907_Space-Dumka-8bit.mp3'] }],
  combat: [
    { minWave: 1, files: ['888921_8-Bit-Flight-Loop.mp3', '1263681_8-Bit-Flight.mp3'] },
    { minWave: 5, files: ['290077_spacecake.mp3', '770175_Outer-Space-Adventure-Agen.mp3'] },
    { minWave: 11, files: ['19583_newgrounds_robot_.mp3', '290077_spacecake.mp3'] },
  ],
  boss: [{ files: ['19583_newgrounds_robot_.mp3'] }],
  event: [],
  gameover: [],
};

/** Contextes joués une seule fois (les autres bouclent). */
export const MUSIC_ONE_SHOT: ReadonlySet<MusicContext> = new Set<MusicContext>(['gameover']);

/** Pur : pistes d'un contexte pour une vague donnée ([] = aucune piste dédiée). */
export const musicFilesFor = (ctx: MusicContext, wave = 1): string[] => {
  wave = Math.max(1, wave);
  let best: MusicTier | null = null;
  for (const tier of MUSIC_CONTEXTS[ctx] ?? []) {
    if (!tier.files.length || (tier.minWave ?? 1) > wave) continue;
    if (!best || (tier.minWave ?? 1) >= (best.minWave ?? 1)) best = tier;
  }
  return best ? [...best.files] : [];
};

/** Pur : index de la première piste non défaillante à partir de `from` (circulaire), -1 si aucune. */
export const nextPlayable = (files: readonly string[], failed: ReadonlySet<string>, from: number): number => {
  const n = files.length;
  for (let i = 0; i < n; i++) {
    const idx = (((from + i) % n) + n) % n;
    if (!failed.has(files[idx])) return idx;
  }
  return -1;
};

const FADE_OUT_MS = 500;
const FADE_IN_MS = 1000;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

let music: HTMLAudioElement | null = null;
let playlist: string[] = MUSIC_TRACKS;
let playlistKey = '';          // identifie (pistes + boucle) pour ignorer les changements inutiles
let loopPlaylist = true;
let trackIndex = Math.floor(Math.random() * MUSIC_TRACKS.length);
let currentFile = '';
let musicFailed = false;
let musicWanted = false;       // startBGM appelé et pas de stopBGM depuis
const failedFiles = new Set<string>();
let fadeMul = 1;
let fadeTimer: any = null;

const musicUrl = (file: string) => `${(import.meta as any).env?.BASE_URL ?? '/'}music/${file}`;

const applyMusicVolume = () => {
  if (music) music.volume = audioSettings.muted ? 0 : clamp01(audioSettings.musicVolume * fadeMul);
};

const fadeTo = (target: number, ms: number, done?: () => void) => {
  if (fadeTimer) clearInterval(fadeTimer);
  fadeTimer = null;
  const from = fadeMul;
  const t0 = Date.now();
  fadeTimer = setInterval(() => {
    const k = Math.min(1, (Date.now() - t0) / ms);
    fadeMul = from + (target - from) * k;
    applyMusicVolume();
    if (k >= 1) {
      clearInterval(fadeTimer);
      fadeTimer = null;
      done?.();
    }
  }, 50);
};

const playTrack = () => {
  if (!music) return;
  let idx = nextPlayable(playlist, failedFiles, trackIndex);
  if (idx < 0 && playlist !== MUSIC_TRACKS) {
    // Plus aucune piste du contexte : repli sur la playlist historique
    playlist = MUSIC_TRACKS;
    playlistKey = '';
    loopPlaylist = true;
    idx = nextPlayable(playlist, failedFiles, trackIndex);
  }
  if (idx < 0) {
    // Aucun MP3 disponible : musique procédurale
    musicFailed = true;
    music = null;
    startProceduralBGM();
    return;
  }
  trackIndex = idx;
  currentFile = playlist[idx];
  music.src = musicUrl(currentFile);
  applyMusicVolume();
  music.play().catch(() => { /* lecture bloquée avant interaction : on réessaiera */ });
};

const startMusic = (): boolean => {
  if (typeof window === 'undefined' || typeof Audio === 'undefined' || musicFailed) return false;
  musicWanted = true;
  if (!music) {
    music = new Audio();
    music.preload = 'auto';
    music.addEventListener('ended', () => {
      if (!loopPlaylist) return; // piste unique (game over) : silence ensuite
      trackIndex++;
      playTrack();
    });
    music.addEventListener('error', () => {
      // Fichier manquant : on le marque et on passe au suivant (pas de 404 en boucle)
      if (currentFile) failedFiles.add(currentFile);
      trackIndex++;
      playTrack();
    });
    playTrack();
  } else {
    applyMusicVolume();
    music.play().catch(() => {});
  }
  return true;
};

export const setMusicVolume = (v: number) => {
  audioSettings.musicVolume = clamp01(v);
  applyMusicVolume();
};

export const setSfxVolume = (v: number) => {
  audioSettings.sfxVolume = clamp01(v);
  if (sfxGain) sfxGain.gain.value = audioSettings.muted ? 0 : audioSettings.sfxVolume;
};

/** Applique en une fois les réglages audio sauvegardés. */
export const applyAudioSettings = (s: { muted: boolean; musicVolume: number; sfxVolume: number }) => {
  setMusicVolume(s.musicVolume);
  setSfxVolume(s.sfxVolume);
  setMuted(s.muted);
};

export const setMuted = (muted: boolean) => {
  audioSettings.muted = muted;
  applyMusicVolume();
  if (sfxGain) sfxGain.gain.value = muted ? 0 : audioSettings.sfxVolume;
};

export const nextTrack = () => {
  trackIndex++;
  if (music) { fadeMul = 1; playTrack(); }
};

/**
 * Change la musique selon la situation de jeu. Sans effet si les pistes (et la boucle) sont
 * déjà celles en cours. Fondu sortant puis entrant au changement ; si la musique n'est pas
 * démarrée (startBGM pas encore appelé), le choix est retenu pour le prochain startBGM.
 * Sans aucun appel, le jeu joue la playlist historique en boucle aléatoire.
 */
export const setMusicContext = (ctx: MusicContext, wave = 1) => {
  let files = musicFilesFor(ctx, wave);
  if (!files.length) {
    // Pas de piste dédiée : événement et game over laissent la musique en cours
    if (ctx === 'event' || ctx === 'gameover') return;
    files = MUSIC_TRACKS;
  }
  const loop = !MUSIC_ONE_SHOT.has(ctx);
  const key = `${loop ? 'loop' : 'once'}:${files.join(',')}`;
  if (key === playlistKey) return;
  playlist = files;
  playlistKey = key;
  loopPlaylist = loop;
  trackIndex = Math.floor(Math.random() * files.length);
  if (!music || !musicWanted) return;
  if (music.paused) { fadeMul = 1; playTrack(); return; }
  fadeTo(0, FADE_OUT_MS, () => {
    playTrack();
    fadeTo(1, FADE_IN_MS);
  });
};

const initAudio = () => {
  // Hors navigateur (tests Node) : pas d'audio
  if (typeof window === 'undefined') return;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

/** Démarre (ou reprend) la musique. */
export const startBGM = () => {
  initAudio();
  if (startMusic()) return;
  startProceduralBGM();
};

/**
 * Musique de fond procédurale 8-bit (repli si les MP3 sont indisponibles)
 */
const startProceduralBGM = () => {
  initAudio();
  if (!audioCtx || bgmInterval) return;

  const tempo = 130;
  const noteDuration = 60 / tempo / 2; // Croche
  let step = 0;

  const progression = [
    { bass: 110, chord: [220, 261.63, 329.63] }, // A2, A3, C4, E4
    { bass: 87.31, chord: [174.61, 220, 261.63] }, // F2, F3, A3, C4
    { bass: 130.81, chord: [261.63, 329.63, 392] }, // C3, C4, E4, G4
    { bass: 98, chord: [196, 246.94, 293.66] }     // G2, G3, B3, D4
  ];

  bgmInterval = setInterval(() => {
    if (!audioCtx || audioCtx.state === 'suspended' || audioSettings.muted) return;
    const now = audioCtx.currentTime;
    const measure = Math.floor(step / 16) % progression.length;
    const beatInMeasure = step % 16;
    const current = progression[measure];

    if (beatInMeasure % 4 === 0) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(current.bass, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + noteDuration * 2);
      osc.connect(gain);
      gain.connect(sfxOut());
      osc.start();
      osc.stop(now + noteDuration * 2);
    }

    if (beatInMeasure % 2 === 0) {
      const noteIdx = (beatInMeasure / 2) % current.chord.length;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(current.chord[noteIdx], now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + noteDuration);
      osc.connect(gain);
      gain.connect(sfxOut());
      osc.start();
      osc.stop(now + noteDuration);
    }

    step++;
  }, noteDuration * 1000);
};

export const stopBGM = () => {
  musicWanted = false;
  if (music) music.pause();
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
};

let lastXPSound = 0;
export const playCollectXPSound = () => {
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  if (now - lastXPSound < 0.03) return;
  lastXPSound = now;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  osc.connect(gain);
  gain.connect(sfxOut());
  osc.start();
  osc.stop(now + 0.15);
};

let lastShotSound = 0;
export const playShotSound = (type: DamageType) => {
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  if (now - lastShotSound < 0.045) return;
  lastShotSound = now;
  const masterGain = audioCtx.createGain();
  masterGain.connect(sfxOut());
  masterGain.gain.setValueAtTime(0.08, now);
  masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

  switch (type) {
    case DamageType.EM: {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      osc.connect(masterGain);
      osc.start(); osc.stop(now + 0.1);
      break;
    }
    case DamageType.KINETIC: {
      const bufferSize = audioCtx.sampleRate * 0.05;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      break;
    }
    case DamageType.THERMAL: {
      const osc = audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.15);
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2000, now);
      osc.connect(filter);
      filter.connect(masterGain);
      osc.start(); osc.stop(now + 0.15);
      break;
    }
    case DamageType.EXPLOSIVE: {
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
      masterGain.gain.setValueAtTime(0.12, now);
      masterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(masterGain);
      osc.start(); osc.stop(now + 0.4);
      break;
    }
  }
};

let lastExplosionSound = 0;
export const playExplosionSound = (radius: number) => {
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  // Limite : pas plus d'une explosion toutes les 60ms pour éviter la saturation
  if (now - lastExplosionSound < 0.06) return;
  lastExplosionSound = now;
  const dur = 0.2 + Math.min(0.4, radius / 400);
  const bufferSize = Math.floor(audioCtx.sampleRate * dur);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(900, now);
  filter.frequency.exponentialRampToValueAtTime(80, now + dur);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(Math.min(0.18, 0.05 + radius / 1500), now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(sfxOut());
  noise.start();
};
