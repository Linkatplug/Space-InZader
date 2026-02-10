/**
 * Global Constants for Space InZader
 * Centralized constants to avoid redeclaration errors
 */

// World size (playable area - 2x canvas size)
const WORLD_WIDTH = 2560;
const WORLD_HEIGHT = 1440;

// Enemy size threshold for boss detection
const BOSS_SIZE_THRESHOLD = 35;

// Game balance constants
const BASE_XP_TO_LEVEL = 100;
const XP_SCALING_FACTOR = 1.5;

// Difficulty scaling
const DIFFICULTY_TIME_MULTIPLIER = 0.15;
const DIFFICULTY_WAVE_HEALTH_MULTIPLIER = 0.12;
const DIFFICULTY_WAVE_SPEED_MULTIPLIER = 0.05;

// Soft caps
const MAX_ENEMY_COUNT_MULTIPLIER = 3.5;
const MAX_ENEMY_HEALTH_MULTIPLIER = 6.0;
const MAX_ENEMY_SPEED_MULTIPLIER = 2.0;

// Wave system
const WAVE_DURATION_SECONDS = 45;
const INTER_WAVE_PAUSE_SECONDS = 2;
const ELITE_SPAWN_INTERVAL_WAVES = 5;
const BOSS_SPAWN_INTERVAL_WAVES = 10;

// Audio
const DEFAULT_MUSIC_VOLUME = 0.7;
const DEFAULT_SFX_VOLUME = 0.8;

// Scoreboard
const MAX_SCOREBOARD_ENTRIES = 10;
const SCORE_KILLS_MULTIPLIER = 10;
const SCORE_WAVE_MULTIPLIER = 500;
const SCORE_BOSS_MULTIPLIER = 2000;
