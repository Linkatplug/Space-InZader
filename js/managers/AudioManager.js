/**
 * @file AudioManager.js
 * @description Manages game audio and sound effects using Web Audio API
 */

class AudioManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.initialized = false;
        this.sounds = {};
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
    }

    /**
     * Initialize Web Audio API (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.context.createGain();
            this.musicGain = this.context.createGain();
            this.sfxGain = this.context.createGain();

            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.context.destination);

            this.musicGain.gain.value = this.musicVolume;
            this.sfxGain.gain.value = this.sfxVolume;

            this.initialized = true;
            console.log('AudioManager initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    /**
     * Set music volume
     * @param {number} volume - Volume level 0-1
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }

    /**
     * Set SFX volume
     * @param {number} volume - Volume level 0-1
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }

    /**
     * Play a synthesized sound effect
     * @param {string} type - Sound type (laser, explosion, hit, etc.)
     * @param {number} pitch - Pitch multiplier (default 1)
     */
    playSFX(type, pitch = 1) {
        if (!this.initialized || !this.context) return;

        const now = this.context.currentTime;

        switch (type) {
            case 'laser':
                this.playLaser(now, pitch);
                break;
            case 'missile':
                this.playMissile(now, pitch);
                break;
            case 'explosion':
                this.playExplosion(now, pitch);
                break;
            case 'hit':
                this.playHit(now, pitch);
                break;
            case 'pickup':
                this.playPickup(now, pitch);
                break;
            case 'levelup':
                this.playLevelUp(now);
                break;
            case 'death':
                this.playDeath(now);
                break;
            case 'boss':
                this.playBossSpawn(now);
                break;
            case 'electric':
                this.playElectric(now, pitch);
                break;
            default:
                console.warn('Unknown sound type:', type);
        }
    }

    playLaser(time, pitch) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400 * pitch, time);
        osc.frequency.exponentialRampToValueAtTime(100 * pitch, time + 0.1);

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(time);
        osc.stop(time + 0.1);
    }

    playMissile(time, pitch) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(200 * pitch, time);
        osc.frequency.linearRampToValueAtTime(150 * pitch, time + 0.15);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(time);
        osc.stop(time + 0.15);
    }

    playExplosion(time, pitch) {
        const noise = this.context.createBufferSource();
        const buffer = this.context.createBuffer(1, this.context.sampleRate * 0.3, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        noise.buffer = buffer;

        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800 * pitch, time);
        filter.frequency.exponentialRampToValueAtTime(50 * pitch, time + 0.3);

        const gain = this.context.createGain();
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(time);
        noise.stop(time + 0.3);
    }

    playHit(time, pitch) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150 * pitch, time);
        osc.frequency.exponentialRampToValueAtTime(50 * pitch, time + 0.08);

        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(time);
        osc.stop(time + 0.08);
    }

    playPickup(time, pitch) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 * pitch, time);
        osc.frequency.exponentialRampToValueAtTime(1200 * pitch, time + 0.1);

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(time);
        osc.stop(time + 0.1);
    }

    playLevelUp(time) {
        for (let i = 0; i < 3; i++) {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            const startTime = time + i * 0.1;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(400 + i * 200, startTime);

            gain.gain.setValueAtTime(0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(startTime);
            osc.stop(startTime + 0.2);
        }
    }

    playDeath(time) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 0.5);

        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    playBossSpawn(time) {
        const osc1 = this.context.createOscillator();
        const osc2 = this.context.createOscillator();
        const gain = this.context.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        
        osc1.frequency.setValueAtTime(100, time);
        osc1.frequency.linearRampToValueAtTime(50, time + 1);
        
        osc2.frequency.setValueAtTime(150, time);
        osc2.frequency.linearRampToValueAtTime(75, time + 1);

        gain.gain.setValueAtTime(0.4, time);
        gain.gain.linearRampToValueAtTime(0.6, time + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 1);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 1);
        osc2.stop(time + 1);
    }

    playElectric(time, pitch) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(800 * pitch, time);
        osc.frequency.setValueAtTime(700 * pitch, time + 0.02);
        osc.frequency.setValueAtTime(850 * pitch, time + 0.04);

        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(time);
        osc.stop(time + 0.12);
    }

    /**
     * Start background music loop
     */
    startBackgroundMusic() {
        if (!this.initialized || this.musicPlaying) return;
        
        this.musicPlaying = true;
        this.playMusicLoop();
    }

    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        this.musicPlaying = false;
        if (this.musicOscillator) {
            try {
                this.musicOscillator.stop();
            } catch (e) {
                // Already stopped
            }
            this.musicOscillator = null;
        }
    }

    /**
     * Play continuous background music loop
     */
    playMusicLoop() {
        if (!this.musicPlaying || !this.initialized) return;

        const now = this.context.currentTime;
        const noteDuration = 0.2;
        
        // Simple 8-bit style arpeggio melody
        const melody = [
            { freq: 262, dur: noteDuration },      // C4
            { freq: 330, dur: noteDuration },      // E4
            { freq: 392, dur: noteDuration },      // G4
            { freq: 523, dur: noteDuration },      // C5
            { freq: 392, dur: noteDuration },      // G4
            { freq: 330, dur: noteDuration },      // E4
            { freq: 294, dur: noteDuration },      // D4
            { freq: 330, dur: noteDuration }       // E4
        ];

        let time = now;
        melody.forEach(note => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(note.freq, time);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.05, time + 0.01);
            gain.gain.linearRampToValueAtTime(0, time + note.dur);
            
            osc.connect(gain);
            gain.connect(this.musicGain);
            
            osc.start(time);
            osc.stop(time + note.dur);
            
            time += note.dur;
        });

        // Schedule next loop
        setTimeout(() => this.playMusicLoop(), melody.length * noteDuration * 1000);
    }

    /**
     * Stop all sounds
     */
    stopAll() {
        this.stopBackgroundMusic();
        if (this.context) {
            // Web Audio nodes are automatically garbage collected when done
            // No need to manually stop them
        }
    }
}
