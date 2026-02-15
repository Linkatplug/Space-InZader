
import { DamageType } from '../types';

let audioCtx: AudioContext | null = null;
let bgmOscillators: { osc: OscillatorNode, gain: GainNode }[] = [];
let bgmInterval: any = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

/**
 * Musique de fond procédurale 8-bit
 */
export const startBGM = () => {
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
    if (!audioCtx || audioCtx.state === 'suspended') return;
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
      gain.connect(audioCtx.destination);
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
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(now + noteDuration);
    }

    step++;
  }, noteDuration * 1000);
};

export const stopBGM = () => {
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
};

export const playCollectXPSound = () => {
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(now + 0.15);
};

export const playShotSound = (type: DamageType) => {
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const masterGain = audioCtx.createGain();
  masterGain.connect(audioCtx.destination);
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
