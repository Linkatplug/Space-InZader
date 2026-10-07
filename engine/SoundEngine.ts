
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

// --- Musique : playlist MP3 (public/music), repli sur la musique procédurale ---
export const MUSIC_TRACKS = [
  '575907_Space-Dumka-8bit.mp3',
  '770175_Outer-Space-Adventure-Agen.mp3',
  '888921_8-Bit-Flight-Loop.mp3',
  '1263681_8-Bit-Flight.mp3',
  '290077_spacecake.mp3',
  '19583_newgrounds_robot_.mp3',
];
let music: HTMLAudioElement | null = null;
let trackIndex = Math.floor(Math.random() * MUSIC_TRACKS.length);
let musicFailed = false;

const musicUrl = (file: string) => `${(import.meta as any).env?.BASE_URL ?? '/'}music/${file}`;

const playTrack = () => {
  if (!music) return;
  music.src = musicUrl(MUSIC_TRACKS[trackIndex % MUSIC_TRACKS.length]);
  music.volume = audioSettings.muted ? 0 : audioSettings.musicVolume;
  music.play().catch(() => { /* lecture bloquée avant interaction : on réessaiera */ });
};

const startMusic = (): boolean => {
  if (typeof window === 'undefined' || typeof Audio === 'undefined' || musicFailed) return false;
  if (!music) {
    music = new Audio();
    music.preload = 'auto';
    music.addEventListener('ended', () => { trackIndex++; playTrack(); });
    music.addEventListener('error', () => {
      // Fichier manquant : on passe au procédural
      musicFailed = true;
      music = null;
      startProceduralBGM();
    });
    playTrack();
  } else {
    music.volume = audioSettings.muted ? 0 : audioSettings.musicVolume;
    music.play().catch(() => {});
  }
  return true;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const setMusicVolume = (v: number) => {
  audioSettings.musicVolume = clamp01(v);
  if (music) music.volume = audioSettings.muted ? 0 : audioSettings.musicVolume;
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
  if (music) music.volume = muted ? 0 : audioSettings.musicVolume;
  if (sfxGain) sfxGain.gain.value = muted ? 0 : audioSettings.sfxVolume;
};

export const nextTrack = () => {
  trackIndex++;
  if (music) playTrack();
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
