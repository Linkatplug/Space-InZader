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
        this.muted = false;
        this.previousMasterVolume = 1.0;
        
        // MP3 Music system
        this.musicTracks = [
            'music/19583_newgrounds_robot_.mp3',
            'music/575907_Space-Dumka-8bit.mp3',
            'music/770175_Outer-Space-Adventure-Agen.mp3',
            'music/888921_8-Bit-Flight-Loop.mp3'
        ];
        this.currentAudio = null;
        this.musicSource = null;
        this.musicPlaying = false;
        this.lastPlayedIndex = -1;
        this.errorCount = 0;
        this.onTrackEnded = null;
        this.onTrackError = null;
        
        // Kept for backward compatibility
        this.currentTheme = 'calm';
        this.currentMelodyIndex = 0;
        this.crossfading = false;
        
        // Load settings from localStorage
        this.loadSettings();
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
        if (this.musicGain && !this.muted) {
            this.musicGain.gain.value = this.musicVolume;
        }
        // Also update HTML5 audio element if playing MP3
        if (this.currentAudio && !this.muted) {
            this.currentAudio.volume = this.musicVolume;
        }
        this.saveSettings();
    }

    /**
     * Set SFX volume
     * @param {number} volume - Volume level 0-1
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain && !this.muted) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
        this.saveSettings();
    }

    /**
     * Mute or unmute all audio
     * @param {boolean} muted - Whether to mute
     */
    setMute(muted) {
        this.muted = muted;
        if (this.masterGain) {
            if (muted) {
                this.previousMasterVolume = this.masterGain.gain.value;
                this.masterGain.gain.value = 0;
            } else {
                this.masterGain.gain.value = this.previousMasterVolume;
                // Restore individual volumes
                if (this.musicGain) this.musicGain.gain.value = this.musicVolume;
                if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
            }
        }
        // Also mute/unmute HTML5 audio element
        if (this.currentAudio) {
            this.currentAudio.volume = muted ? 0 : this.musicVolume;
        }
        this.saveSettings();
    }

    /**
     * Alias for setMute (backward compatibility)
     * @param {boolean} muted - Whether to mute
     */
    setMuted(muted) {
        this.setMute(muted);
    }

    /**
     * Set SFX volume
     * @param {number} volume - Volume level (0-1)
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain && !this.muted) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
        this.saveSettings();
    }

    /**
     * Save audio settings to localStorage
     */
    saveSettings() {
        try {
            const settings = {
                musicVolume: this.musicVolume,
                sfxVolume: this.sfxVolume,
                muted: this.muted
            };
            localStorage.setItem('spaceInZader_audioSettings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save audio settings:', e);
        }
    }

    /**
     * Load audio settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('spaceInZader_audioSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.musicVolume = settings.musicVolume || 0.5;
                this.sfxVolume = settings.sfxVolume || 0.7;
                this.muted = settings.muted || false;
            }
        } catch (e) {
            console.warn('Failed to load audio settings:', e);
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
     * Play critical hit sound
     */
    playCrit() {
        if (!this.initialized || !this.context) return;

        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Play lifesteal sound
     */
    playLifesteal() {
        if (!this.initialized || !this.context) return;

        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(450, now + 0.12);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    /**
     * Play boss hit sound
     */
    playBossHit() {
        if (!this.initialized || !this.context) return;

        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    /**
     * Play wave start sound
     */
    playWaveStart() {
        if (!this.initialized || !this.context) return;

        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.setValueAtTime(0.3, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    /**
     * Start background music loop (MP3 playback)
     */
    startBackgroundMusic() {
        if (!this.initialized || this.musicPlaying) return;
        
        this.musicPlaying = true;
        this.playRandomMP3();
    }

    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        this.musicPlaying = false;
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            // Remove event listeners
            if (this.onTrackEnded) {
                this.currentAudio.removeEventListener('ended', this.onTrackEnded);
            }
            if (this.onTrackError) {
                this.currentAudio.removeEventListener('error', this.onTrackError);
            }
            this.currentAudio = null;
        }
        if (this.musicSource) {
            try {
                this.musicSource.disconnect();
            } catch (e) {
                // Already disconnected
            }
            this.musicSource = null;
        }
        // Reset error count
        this.errorCount = 0;
    }

    /**
     * Play a random MP3 track
     */
    playRandomMP3() {
        if (!this.musicPlaying || !this.initialized) return;

        // Clean up previous audio element
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.removeEventListener('ended', this.onTrackEnded);
            this.currentAudio.removeEventListener('error', this.onTrackError);
            this.currentAudio = null;
        }
        
        // Disconnect previous source
        if (this.musicSource) {
            try {
                this.musicSource.disconnect();
            } catch (e) {
                // Already disconnected
            }
            this.musicSource = null;
        }

        // Select a random track (avoid immediate repeat)
        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * this.musicTracks.length);
        } while (randomIndex === this.lastPlayedIndex && this.musicTracks.length > 1);
        
        this.lastPlayedIndex = randomIndex;
        const trackPath = this.musicTracks[randomIndex];

        // Create new audio element
        this.currentAudio = new Audio(trackPath);
        this.currentAudio.volume = this.muted ? 0 : this.musicVolume;
        
        // Create bound event handlers for cleanup
        this.onTrackEnded = () => {
            if (this.musicPlaying) {
                this.playRandomMP3();
            }
        };
        
        this.onTrackError = (e) => {
            console.error('Error loading music track:', trackPath, e);
            // Try next track on error (with limit to prevent infinite loop)
            if (this.musicPlaying && (!this.errorCount || this.errorCount < this.musicTracks.length)) {
                this.errorCount = (this.errorCount || 0) + 1;
                setTimeout(() => this.playRandomMP3(), 1000);
            } else {
                console.error('All music tracks failed to load. Stopping music.');
                this.stopBackgroundMusic();
                this.errorCount = 0;
            }
        };
        
        // Add event listeners
        this.currentAudio.addEventListener('ended', this.onTrackEnded);
        this.currentAudio.addEventListener('error', this.onTrackError);

        // Connect to Web Audio API for proper volume control (only once per element)
        if (this.context && !this.currentAudio.connectedToWebAudio) {
            try {
                this.musicSource = this.context.createMediaElementSource(this.currentAudio);
                this.musicSource.connect(this.musicGain);
                this.currentAudio.connectedToWebAudio = true;
            } catch (e) {
                // If connection fails, just use HTML5 audio volume control
                console.warn('Could not connect audio to Web Audio API:', e);
            }
        }

        // Start playback
        this.currentAudio.play().then(() => {
            // Reset error count on successful play
            this.errorCount = 0;
            console.log('Now playing:', trackPath);
        }).catch(e => {
            console.error('Error playing music:', e);
            this.onTrackError(e);
        });
    }

    /**
     * Set music theme (kept for backward compatibility, no longer used with MP3s)
     * @param {string} theme - Theme name ('calm', 'action', 'boss')
     */
    setMusicTheme(theme) {
        if (!['calm', 'action', 'boss'].includes(theme)) {
            console.warn('Invalid music theme:', theme);
            return;
        }
        
        // Store theme for backward compatibility but don't change music
        this.currentTheme = theme;
        // MP3 music plays randomly regardless of theme
    }

    /**
     * Get melodies for the current theme (kept for backward compatibility, not used with MP3s)
     * @returns {Array} Array of melody phrases
     */
    getThemeMelodies() {
        const noteDur = 0.2;
        const longDur = noteDur * 2;
        
        const themes = {
            calm: [
                // Calm 1: Gentle ascending
                [
                    { freq: 262, dur: longDur },     // C4
                    { freq: 294, dur: noteDur },     // D4
                    { freq: 330, dur: noteDur },     // E4
                    { freq: 349, dur: longDur },     // F4
                    { freq: 330, dur: noteDur },     // E4
                    { freq: 294, dur: noteDur },     // D4
                    { freq: 262, dur: longDur }      // C4
                ],
                // Calm 2: Ambient waves
                [
                    { freq: 392, dur: longDur },     // G4
                    { freq: 349, dur: noteDur },     // F4
                    { freq: 330, dur: noteDur },     // E4
                    { freq: 294, dur: longDur },     // D4
                    { freq: 330, dur: noteDur },     // E4
                    { freq: 349, dur: noteDur },     // F4
                    { freq: 392, dur: longDur }      // G4
                ],
                // Calm 3: Peaceful melody
                [
                    { freq: 294, dur: noteDur },     // D4
                    { freq: 330, dur: noteDur },     // E4
                    { freq: 294, dur: noteDur },     // D4
                    { freq: 262, dur: longDur },     // C4
                    { freq: 294, dur: noteDur },     // D4
                    { freq: 330, dur: noteDur },     // E4
                    { freq: 392, dur: longDur }      // G4
                ],
                // Calm 4: Serene flow
                [
                    { freq: 349, dur: longDur },     // F4
                    { freq: 330, dur: noteDur },     // E4
                    { freq: 294, dur: noteDur },     // D4
                    { freq: 330, dur: longDur },     // E4
                    { freq: 349, dur: noteDur },     // F4
                    { freq: 392, dur: noteDur },     // G4
                    { freq: 349, dur: longDur }      // F4
                ]
            ],
            action: [
                // Action 1: Fast ascending arpeggio
                [
                    { freq: 262, dur: noteDur * 0.8 },  // C4
                    { freq: 330, dur: noteDur * 0.8 },  // E4
                    { freq: 392, dur: noteDur * 0.8 },  // G4
                    { freq: 523, dur: noteDur * 0.8 },  // C5
                    { freq: 392, dur: noteDur * 0.8 },  // G4
                    { freq: 330, dur: noteDur * 0.8 },  // E4
                    { freq: 294, dur: noteDur * 0.8 },  // D4
                    { freq: 330, dur: noteDur * 0.8 }   // E4
                ],
                // Action 2: Intense rhythm
                [
                    { freq: 523, dur: noteDur * 0.6 },  // C5
                    { freq: 494, dur: noteDur * 0.6 },  // B4
                    { freq: 523, dur: noteDur * 0.6 },  // C5
                    { freq: 587, dur: noteDur },        // D5
                    { freq: 523, dur: noteDur * 0.6 },  // C5
                    { freq: 494, dur: noteDur * 0.6 },  // B4
                    { freq: 440, dur: noteDur },        // A4
                    { freq: 392, dur: noteDur }         // G4
                ],
                // Action 3: Power chords
                [
                    { freq: 330, dur: noteDur * 0.7 },  // E4
                    { freq: 330, dur: noteDur * 0.7 },  // E4
                    { freq: 392, dur: noteDur * 0.7 },  // G4
                    { freq: 440, dur: noteDur },        // A4
                    { freq: 392, dur: noteDur * 0.7 },  // G4
                    { freq: 392, dur: noteDur * 0.7 },  // G4
                    { freq: 330, dur: noteDur * 0.7 },  // E4
                    { freq: 294, dur: noteDur }         // D4
                ],
                // Action 4: Driving beat
                [
                    { freq: 440, dur: noteDur * 0.6 },  // A4
                    { freq: 392, dur: noteDur * 0.6 },  // G4
                    { freq: 440, dur: noteDur * 0.6 },  // A4
                    { freq: 494, dur: noteDur },        // B4
                    { freq: 440, dur: noteDur * 0.6 },  // A4
                    { freq: 392, dur: noteDur * 0.6 },  // G4
                    { freq: 330, dur: noteDur },        // E4
                    { freq: 392, dur: noteDur }         // G4
                ],
                // Action 5: Frantic energy
                [
                    { freq: 587, dur: noteDur * 0.5 },  // D5
                    { freq: 523, dur: noteDur * 0.5 },  // C5
                    { freq: 494, dur: noteDur * 0.5 },  // B4
                    { freq: 440, dur: noteDur * 0.5 },  // A4
                    { freq: 494, dur: noteDur * 0.5 },  // B4
                    { freq: 523, dur: noteDur * 0.5 },  // C5
                    { freq: 587, dur: noteDur },        // D5
                    { freq: 659, dur: noteDur }         // E5
                ]
            ],
            boss: [
                // Boss 1: Ominous low tones
                [
                    { freq: 131, dur: longDur },        // C3
                    { freq: 147, dur: noteDur },        // D3
                    { freq: 131, dur: noteDur },        // C3
                    { freq: 117, dur: longDur },        // A#2
                    { freq: 131, dur: noteDur },        // C3
                    { freq: 147, dur: noteDur },        // D3
                    { freq: 165, dur: longDur }         // E3
                ],
                // Boss 2: Epic rising tension
                [
                    { freq: 196, dur: noteDur },        // G3
                    { freq: 220, dur: noteDur },        // A3
                    { freq: 247, dur: noteDur },        // B3
                    { freq: 262, dur: longDur },        // C4
                    { freq: 247, dur: noteDur },        // B3
                    { freq: 220, dur: noteDur },        // A3
                    { freq: 196, dur: longDur }         // G3
                ],
                // Boss 3: Dramatic
                [
                    { freq: 262, dur: noteDur * 0.7 },  // C4
                    { freq: 233, dur: noteDur * 0.7 },  // A#3
                    { freq: 196, dur: noteDur * 0.7 },  // G3
                    { freq: 175, dur: longDur },        // F3
                    { freq: 196, dur: noteDur * 0.7 },  // G3
                    { freq: 233, dur: noteDur * 0.7 },  // A#3
                    { freq: 262, dur: longDur }         // C4
                ],
                // Boss 4: Menacing march
                [
                    { freq: 147, dur: noteDur },        // D3
                    { freq: 147, dur: noteDur },        // D3
                    { freq: 175, dur: noteDur },        // F3
                    { freq: 196, dur: longDur },        // G3
                    { freq: 175, dur: noteDur },        // F3
                    { freq: 147, dur: noteDur },        // D3
                    { freq: 131, dur: longDur }         // C3
                ],
                // Boss 5: Dark power
                [
                    { freq: 110, dur: longDur },        // A2
                    { freq: 123, dur: noteDur },        // B2
                    { freq: 147, dur: noteDur },        // D3
                    { freq: 165, dur: longDur },        // E3
                    { freq: 147, dur: noteDur },        // D3
                    { freq: 131, dur: noteDur },        // C3
                    { freq: 110, dur: longDur }         // A2
                ]
            ]
        };
        
        return themes[this.currentTheme] || themes.calm;
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
