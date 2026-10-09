
import React, { useEffect, useRef, useState } from 'react';
import { GameState, Entity, DamageType, Weapon, Stats, Keystone, Passive, EnvEventType } from './types';
import { WORLD_WIDTH, WORLD_HEIGHT, viewScaleFor, INITIAL_STATS, CONTROLS } from './constants';
import { HUD } from './components/HUD';
import { UpgradeMenu } from './components/Menu/UpgradeMenu';
import { DevMenu } from './components/Menu/DevMenu';
import { DebugOverlay } from './components/DebugOverlay';
import { updateGameState, spawnEnemy, createEffect } from './engine/CoreEngine';
import { renderGame } from './render/CoreRenderer';
import { startBGM, stopBGM, nextTrack, applyAudioSettings, setMusicContext } from './engine/SoundEngine';
import { isBossWave } from './data/enemies';
import { input } from './engine/InputManager';
import { createInitialState } from './engine/GameFactory';
import { applyUpgrade, rollUpgradeOptions, UpgradeOption } from './engine/Progression';
import { WEAPONS } from './data/weapons';
import { triggerEvent } from './engine/EventSystem';
import { MainMenu } from './components/Menu/MainMenu';
import { TouchControls, isTouchDevice } from './components/TouchControls';
import { PadNav, PadToast } from './components/PadNav';
import { GameOverScreen } from './components/Menu/GameOverScreen';
import { PauseMenu } from './components/Menu/PauseMenu';
import { OptionsMenu } from './components/Menu/OptionsMenu';
import { MetaSave, RunSummary, loadSave, writeSave, recordRun } from './engine/Meta';
import { botThink, botPickUpgrade } from './engine/Bot';
import { clampViewZoom } from './components/Menu/optionsModel';
import { loadPlayer, savePlayerName } from './components/player/playerStore';
import { Leaderboard, LeaderboardView } from './components/leaderboard/Leaderboard';
import { buildRunSubmission, fetchLeaderboard, submitScore, LeaderboardResult } from './components/leaderboard/api';
import { installErrorReporter } from './components/errorReporter';
import { FeedbackModal } from './components/feedback/FeedbackModal';
import { buildContext } from './components/feedback/logic';
import { FEEDBACK_KEY } from './components/feedback/text';
import { buildFeedbackSnapshot } from './engine/FeedbackSnapshot';
import type { FeedbackContext, FeedbackSnapshot } from './types';
import { calculateRuntimeStats, syncDefenseState, shipBaseStats } from './engine/StatsCalculator';

const SIM_STEP = 1 / 60;

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isLabMenuOpen, setIsLabMenuOpen] = useState(true);
  
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const frameTimes = useRef<number[]>([]);
  const lastFpsUpdate = useRef<number>(0);

  const engineState = useRef<GameState>(createInitialState());
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);
  const [save, setSave] = useState<MetaSave>(() => loadSave());
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => { applyAudioSettings(saveRef.current.settings); }, []);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsOpenRef = useRef(false);
  // Mode bot (touche cachée F9, ou __SI.bot() en dev) : le bot pilote le vaisseau et choisit les améliorations.
  // Une partie où le bot a joué (used) n'est pas enregistrée dans la sauvegarde.
  const botRef = useRef({ on: false, used: false, log: [] as string[] });
  optionsOpenRef.current = optionsOpen;
  // Joueur local (pseudo + identifiant) et classement en ligne de la dernière partie
  const [player, setPlayer] = useState(() => loadPlayer());
  const playerRef = useRef(player);
  playerRef.current = player;
  const changePlayerName = (name: string) => setPlayer(savePlayerName(name));
  const [leaderboard, setLeaderboard] = useState<LeaderboardView>({ status: 'loading' });
  // Partie lancée depuis la base de données / le labo : jamais envoyée au classement
  const sandboxRunRef = useRef(false);
  const levelTimesRef = useRef<number[]>([]);
  useEffect(() => installErrorReporter(__BUILD__), []);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const isTouch = React.useMemo(() => isTouchDevice(), []);
  const togglePause = () => {
    const s = engineState.current;
    if (s.status === 'playing') { s.status = 'paused'; stopBGM(); }
    else if (s.status === 'paused') { s.status = 'playing'; startBGM(); }
    setUiState({ ...s });
  };

  /**
   * Fenêtre d'avis : instantané figé à l'ouverture. Ouverte = aucun pas de simulation (comme la pause),
   * l'état de la partie n'est pas modifié donc il reprend tel quel à la fermeture.
   */
  const [feedback, setFeedback] = useState<{ snapshot: FeedbackSnapshot; context: FeedbackContext } | null>(null);
  const feedbackOpenRef = useRef(false);
  feedbackOpenRef.current = feedback !== null;
  const openFeedback = () => {
    if (feedbackOpenRef.current) return;
    const s = engineState.current;
    feedbackOpenRef.current = true;
    input.getKeys().clear();
    setFeedback({
      snapshot: buildFeedbackSnapshot(s),
      context: buildContext({
        status: s.status, startTime: s.startTime, now: Date.now(), touch: isTouch,
        width: window.innerWidth, height: window.innerHeight, build: __BUILD__,
      }),
    });
  };
  const closeFeedback = () => {
    feedbackOpenRef.current = false;
    input.getKeys().clear();
    setFeedback(null);
  };

  /** Abandon depuis la pause : la partie est enregistrée comme une défaite. */
  const [abandoned, setAbandoned] = useState(false);
  const abandonRun = () => {
    const s = engineState.current;
    if (s.status !== 'paused') return;
    s.status = 'gameover';
    setAbandoned(true);
    finishRun(s, 'abandon');
    setUiState({ ...s });
  };

  /**
   * Envoie le score au classement en ligne, sauf partie bot ou lancée depuis dev/labo (on lit alors
   * seulement le classement). Serveur absent : « Classement indisponible », le reste de l'écran fonctionne.
   */
  const publishScore = (s: GameState, end: 'mort' | 'abandon', botUsed: boolean) => {
    setLeaderboard({ status: 'loading' });
    const me = playerRef.current;
    const request: Promise<LeaderboardResult> = botUsed || sandboxRunRef.current
      ? fetchLeaderboard(me.id)
      : submitScore(buildRunSubmission(s, me, {
          device: isTouch ? 'telephone' : 'ordinateur',
          input: input.isGamepadActive() ? 'manette' : isTouch ? 'tactile' : 'clavier',
          end, build: __BUILD__, levelTimes: levelTimesRef.current,
        }));
    request.then(res => setLeaderboard('data' in res ? { status: 'ready', data: res.data } : { status: 'unavailable', message: res.message }));
  };

  /** Fin de partie : enregistre records / déblocages, puis musique de fin (record ou game over). */
  const finishRun = (s: GameState, end: 'mort' | 'abandon' = 'mort') => {
    const { save: next, summary } = recordRun(saveRef.current, s);
    setRunSummary(summary);
    const bot = botRef.current.used;
    if (bot) botRef.current.log.push(`mort à ${Math.round(s.time / 1000)}s — niv ${s.level}, vague ${s.wave}`);
    else {
      saveRef.current = next;
      writeSave(next);
      setSave(next);
    }
    publishScore(s, end, bot);
    // Lecture unique, sans stopBGM derrière. startBGM d'abord : après une pause la musique est
    // arrêtée et setMusicContext ne ferait que mémoriser le choix.
    startBGM();
    setMusicContext(!bot && (summary.newBestScore || summary.newBestWave) ? 'record' : 'gameover');
  };

  const updateSettings = (patch: Partial<MetaSave['settings']>) => {
    const next = { ...saveRef.current, settings: { ...saveRef.current.settings, ...patch } };
    saveRef.current = next;
    writeSave(next);
    setSave(next);
  };

  /**
   * Point d'entrée unique des changements de réglages (écran d'options ET raccourcis M / F) :
   * applique l'effet (audio, tir auto) puis sauvegarde. L'écran d'options lit `save.settings`, il reste donc synchronisé.
   */
  const changeSettings = (patch: Partial<MetaSave['settings']>) => {
    updateSettings(patch);
    const settings = saveRef.current.settings;
    if ('muted' in patch || 'musicVolume' in patch || 'sfxVolume' in patch) applyAudioSettings(settings);
    if ('autoFire' in patch) {
      const s = engineState.current;
      s.autoFire = settings.autoFire;
      setUiState({ ...s });
    }
  };
  const [uiState, setUiState] = useState<GameState>(engineState.current);
  const lastTime = useRef<number>(0);
  const accumulator = useRef<number>(0);
  const lastUiSync = useRef<number>(0);
  const screenShake = useRef<number>(0);
  const viewZoom = clampViewZoom(save.settings.viewZoom);
  const VIEW_SCALE = viewScaleFor(dimensions) * viewZoom;
  const camera = useRef({ x: WORLD_WIDTH / 2 - dimensions.width / (2 * VIEW_SCALE), y: WORLD_HEIGHT / 2 - dimensions.height / (2 * VIEW_SCALE) });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    if (canvasRef.current) input.setCanvas(canvasRef.current);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetGame = (newStatus: 'menu' | 'playing' | 'dev' | 'lab' = 'menu', shipId?: string) => {
    const freshState = createInitialState(shipId ?? engineState.current.shipId);
    freshState.autoFire = saveRef.current.settings.autoFire || isTouch;
    freshState.autoAim = isTouch;
    botRef.current = { on: false, used: false, log: [] };
    sandboxRunRef.current = false;
    levelTimesRef.current = [];
    setRunSummary(null);
    setAbandoned(false);
    setOptionsOpen(false);
    freshState.status = newStatus;
    freshState.startTime = Date.now();
    engineState.current = freshState;
    camera.current = { x: freshState.player.x - dimensions.width / (2 * VIEW_SCALE), y: freshState.player.y - dimensions.height / (2 * VIEW_SCALE) };
    setUiState(freshState);
    if (newStatus === 'playing') startBGM();
    else if (newStatus === 'menu') { startBGM(); setMusicContext('menu'); }
    else stopBGM();
  };

  useEffect(() => {
    let animationFrameId: number;
    const gameLoop = (time: number) => {
      const dt = time - (lastTime.current || time - 16);
      const deltaTime = lastTime.current === 0 ? 0.016 : Math.min(0.1, dt / 1000); 
      lastTime.current = time;
      const s = engineState.current;
      const ctx = canvasRef.current?.getContext('2d');

      if (s.isDebugMode) {
        frameTimes.current.push(dt);
        if (frameTimes.current.length > 30) frameTimes.current.shift();
        if (time - lastFpsUpdate.current > 250) { 
          const avgDt = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length;
          setFrameTime(avgDt);
          setFps(Math.round(1000 / avgDt));
          lastFpsUpdate.current = time;
        }
      }

      if ((s.status === 'playing' || s.status === 'lab') && ctx && !feedbackOpenRef.current) {
        const mousePos = input.getMousePos();
        const isInputFocused = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;
        let keys = isInputFocused ? new Set<string>() : input.getKeys();
        s.analogMove = input.getAnalog();
        // Manette : stick droit au repos = visée automatique (comme sur mobile)
        if (!botRef.current.on) s.autoAim = isTouch || input.wantsAutoAim();
        if (botRef.current.on && s.status === 'playing') {
          const bot = botThink(s);
          s.analogMove = bot.move;
          keys = new Set([...keys, ...bot.keys]);
          s.autoFire = true;
          s.autoAim = true;
        }

        // Pas de simulation fixe (60 Hz) : même vitesse de jeu quel que soit l'écran
        accumulator.current += deltaTime;
        let steps = 0;
        while (accumulator.current >= SIM_STEP && steps < 6) {
          accumulator.current -= SIM_STEP;
          steps++;
          const mouseWorld = {
            x: (mousePos.x / VIEW_SCALE) + camera.current.x,
            y: (mousePos.y / VIEW_SCALE) + camera.current.y
          };
          updateGameState(
            s, SIM_STEP, keys, mouseWorld,
            () => {
              if (s.status === 'lab') return;
              levelTimesRef.current.push(Math.round(s.time / 1000));
              if (botRef.current.on) {
                botRef.current.log.push(`niv ${s.level + 1} à ${Math.round(s.time / 1000)}s`);
                const o = botPickUpgrade(rollUpgradeOptions(s));
                if (o) applyUpgrade(s, o); else s.experience = 0;
                return;
              }
              s.status = 'leveling'; setUpgradeOptions(rollUpgradeOptions(s)); stopBGM();
            },
            () => {
              if (s.status === 'lab') {
                handleDevAction('heal_player');
                createEffect(s, s.player.x, s.player.y, "RESPAWN_SIMULÉ", "#ffffff");
              } else {
                s.status = 'gameover';
                finishRun(s);
              }
            }
          );
          if (s.status !== 'playing' && s.status !== 'lab') { accumulator.current = 0; break; }
        }
        if (steps >= 6) accumulator.current = 0;

        // Intensité réglable dans les options (0 = pas de tremblement)
        const shake = s.shake * saveRef.current.settings.screenShake;
        if (shake > screenShake.current) screenShake.current = shake;
        s.shake = 0;

        const sidebarWidth = 450;
        const offset = (s.status === 'lab' && isLabMenuOpen) ? sidebarWidth : 0;
        const visibleWidth = dimensions.width - offset;
        
        const targetX = s.status === 'lab'
          ? s.player.x - (offset + visibleWidth / 2) / VIEW_SCALE
          : s.player.x - (dimensions.width / 2) / VIEW_SCALE;

        camera.current.x += (targetX - camera.current.x) * 0.1;
        camera.current.y += (s.player.y - dimensions.height / (2 * VIEW_SCALE) - camera.current.y) * 0.1;

        if (screenShake.current > 0) screenShake.current -= deltaTime * 40;
        // HUD React synchronisé à ~30 Hz (immédiatement si l'écran change : level-up, game over)
        if (time - lastUiSync.current > 33 || s.status !== 'playing') {
          lastUiSync.current = time;
          setUiState({ ...s });
        }
      }

      if (ctx) {
        renderGame(ctx, s, dimensions, camera.current, screenShake.current, s.time, VIEW_SCALE, { damageNumbers: saveRef.current.settings.damageNumbers });
      }
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions, isLabMenuOpen, viewZoom]);

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Saisie dans un champ (pseudo) : les raccourcis de lettre (M, N, F, P…) ne doivent pas se déclencher
      if ((e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) && e.key.length === 1) return;
      // Fenêtre d'avis ouverte : elle capte elle-même les touches (F8 / Échap) avant d'arriver ici
      if (feedbackOpenRef.current) return;
      if (key === FEEDBACK_KEY) { e.preventDefault(); openFeedback(); return; }
      // Écran d'options ouvert : P / Échap ne doivent pas relancer la partie derrière (Échap est géré par OptionsMenu)
      if ((key === CONTROLS.PAUSE || key === 'escape') && !optionsOpenRef.current) togglePause();
      if (key === CONTROLS.MUTE) {
        const muted = !saveRef.current.settings.muted;
        changeSettings({ muted });
        const s = engineState.current;
        createEffect(s, s.player.x, s.player.y - 60, muted ? 'SON : OFF' : 'SON : ON', '#94a3b8');
      }
      if (key === CONTROLS.NEXT_TRACK) nextTrack();
      if (key === CONTROLS.AUTO_FIRE) {
        const s = engineState.current;
        const autoFire = !s.autoFire;
        createEffect(s, s.player.x, s.player.y - 60, autoFire ? 'TIR AUTO : ON' : 'TIR AUTO : OFF', '#22d3ee');
        changeSettings({ autoFire });
      }
      if (key === CONTROLS.BOT) {
        e.preventDefault();
        const s = engineState.current;
        if (s.status !== 'playing') return;
        const on = !botRef.current.on;
        botRef.current.on = on;
        if (on) botRef.current.used = true;
        else { s.autoFire = saveRef.current.settings.autoFire || isTouch; s.autoAim = isTouch; }
        createEffect(s, s.player.x, s.player.y - 60, on ? 'BOT : ON (partie non enregistrée)' : 'BOT : OFF', '#a78bfa');
      }
      if (key === CONTROLS.DEBUG) {
        e.preventDefault();
        const s = engineState.current;
        s.isDebugMode = !s.isDebugMode;
        setUiState({...s});
      }
    };
    input.attach();
    window.addEventListener('keydown', handleGlobalKeys);
    return () => { window.removeEventListener('keydown', handleGlobalKeys); input.dispose(); };
  }, []);

  // Musique par contexte : menu, combat (selon la vague), boss, événement actif.
  // Dépend de valeurs lues à 30 Hz depuis uiState (pas de la frame) ; setMusicContext est idempotent.
  // Premier affichage sur le menu : démarre la musique (relancée au premier geste si le navigateur la bloque).
  useEffect(() => {
    if (engineState.current.status === 'menu') { setMusicContext('menu'); startBGM(); }
  }, []);

  const musicStatus = uiState.status;
  const musicWave = uiState.wave;
  const eventActive = uiState.activeEvents.some(e => e.started);
  useEffect(() => {
    if (musicStatus === 'menu') setMusicContext('menu');
    else if (musicStatus === 'playing' || musicStatus === 'paused' || musicStatus === 'leveling') {
      if (eventActive) setMusicContext('event', musicWave);
      else setMusicContext(isBossWave(musicWave) ? 'boss' : 'combat', musicWave);
    }
  }, [musicStatus, musicWave, eventActive]);

  const handleDevAction = (action: string, data?: any) => {
    const s = engineState.current;
    const isLab = s.status === 'lab';
    const spawnDist = isLab ? 300 : 1000;

    switch(action) {
      case 'toggle_lab_menu':
        setIsLabMenuOpen(!isLabMenuOpen);
        break;
      case 'reset_simulation': 
        s.enemies = []; s.projectiles = []; s.xpDrops = []; s.particles = []; s.effects = [];
        s.player.x = WORLD_WIDTH/2; s.player.y = WORLD_HEIGHT/2; s.heat = 0; s.isOverheated = false;
        createEffect(s, s.player.x, s.player.y, "REBOOT_TOTAL", "#ffffff");
        break;
      case 'reset_physics':
        // Reset profond : réalignement des PV max et désactivation God Mode
        s.player.baseStats = shipBaseStats(s.shipId);
        s.player.isGodMode = false;
        s.player.statsDirty = true;
        // On force le recalcul immédiat pour éviter les overflows de PV
        s.player.runtimeStats = calculateRuntimeStats(s.player, s);
        syncDefenseState(s.player);
        createEffect(s, s.player.x, s.player.y, "PHYSICS_NORMALIZED", "#fbbf24");
        break;
      case 'spawn_enemy': {
        const newEnemy = spawnEnemy(s.wave, s.player, data, spawnDist);
        s.enemies.push(newEnemy);
        createEffect(s, newEnemy.x, newEnemy.y, `INJECT_${String(data).toUpperCase()}`, "#ef4444");
        break;
      }
      case 'trigger_event':
        s.activeEvents = [];
        triggerEvent(s, data);
        break;
      case 'clear_enemies': 
        s.enemies = []; 
        createEffect(s, s.player.x, s.player.y, "ZONE_CLEARED", "#22d3ee");
        break;
      case 'tune_stat':
        s.player.baseStats = { ...s.player.baseStats, [data.prop]: data.val };
        s.player.statsDirty = true;
        break;
      case 'install_weapon':
        applyUpgrade(s, { type: 'weapon', item: data }, false);
        break;
      case 'install_passive':
        applyUpgrade(s, { type: 'passive', item: data }, false);
        break;
      case 'install_keystone':
        applyUpgrade(s, { type: 'keystone', item: data }, false);
        break;
      case 'clear_loadout':
        s.activeWeapons = [{ ...WEAPONS[0], level: 1 }];
        s.drones = [];
        s.activePassives = [];
        s.keystones = [];
        s.player.statsDirty = true;
        break;
      case 'change_status':
        if (data === 'playing') sandboxRunRef.current = true;
        s.status = data;
        if (data === 'playing') startBGM(); else stopBGM();
        break;
      case 'god_mode':
        s.player.isGodMode = !s.player.isGodMode;
        if (s.player.isGodMode) {
          handleDevAction('heal_player');
          createEffect(s, s.player.x, s.player.y, "GOD_MODE: ON", "#facc15");
        } else {
          // Sécurité : on remet les PV dans les limites normales au cas où
          s.player.statsDirty = true;
          createEffect(s, s.player.x, s.player.y, "GOD_MODE: OFF", "#94a3b8");
        }
        break;
      case 'heal_player':
        s.player.defense.shield = s.player.runtimeStats.maxShield;
        s.player.defense.armor = s.player.runtimeStats.maxArmor;
        s.player.defense.hull = s.player.runtimeStats.maxHull;
        s.heat = 0;
        s.isOverheated = false;
        createEffect(s, s.player.x, s.player.y, "SYSTEM_REPAIRED", "#4ade80");
        break;
    }

    if (s.player.statsDirty) {
      s.player.runtimeStats = calculateRuntimeStats(s.player, s);
      syncDefenseState(s.player);
      s.player.statsDirty = false;
    }
    setUiState({...s});
  };

  // Accès debug (dev uniquement) : window.__SI.state(), window.__SI.action('spawn_enemy', 'tank')...
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as any).__SI = {
      state: () => engineState.current,
      action: (a: string, d?: any) => handleDevAction(a, d),
      start: () => resetGame('playing'),
      // Mode bot : __SI.bot() lance une partie pilotée par le bot, __SI.bot(false) l'arrête,
      // __SI.botLog() = montées de niveau / mort (parties non enregistrées dans la sauvegarde)
      bot: (on = true) => {
        if (on) resetGame('playing');
        botRef.current = { on, used: botRef.current.used || on, log: on ? [] : botRef.current.log };
      },
      botLog: () => botRef.current.log,
      // Force un tirage de level-up précis (tests visuels du menu d'amélioration)
      offer: (opts: UpgradeOption[]) => {
        const s = engineState.current;
        s.status = 'leveling';
        stopBGM();
        setUpgradeOptions(opts);
        setUiState({ ...s });
      },
    };
  });

  return (
    <div className="relative w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="absolute inset-0" />
      
      {uiState.isDebugMode && <DebugOverlay state={uiState} fps={fps} frameTime={frameTime} />}
      {uiState.status !== 'menu' && uiState.status !== 'dev' && uiState.status !== 'lab' && <HUD state={uiState} touch={isTouch} size={save.settings.hudSize} onFeedback={openFeedback} />}
      
      {uiState.status === 'menu' && (
        <MainMenu
          save={save}
          onStart={(shipId) => resetGame('playing', shipId)}
          onDev={() => resetGame('dev')}
          onLab={() => resetGame('lab')}
          onOptions={() => setOptionsOpen(true)}
          onFeedback={openFeedback}
          playerName={player.name}
          onPlayerName={changePlayerName}
        />
      )}

      {(uiState.status === 'dev' || uiState.status === 'lab') && (
        <DevMenu 
          state={uiState} 
          isLabMenuOpen={isLabMenuOpen}
          onClose={() => resetGame('menu')} 
          onLaunchSandbox={() => handleDevAction('change_status', 'playing')}
          onTriggerAction={handleDevAction}
        />
      )}

      {uiState.status === 'leveling' && (
        <UpgradeMenu
          state={uiState}
          options={upgradeOptions}
          onSelect={(u) => {
            const s = engineState.current;
            applyUpgrade(s, u);
            // Plusieurs niveaux d'un coup : on enchaîne les menus
            if (s.experience >= s.expToNextLevel) {
              setUpgradeOptions(rollUpgradeOptions(s));
            } else {
              s.status = 'playing';
              startBGM();
            }
            setUiState({ ...s });
          }}
        />
      )}
      
      <PadNav />
      <PadToast />

      {isTouch && uiState.status === 'playing' && <TouchControls onPause={togglePause} onFeedback={openFeedback} abilities={uiState.activeAbilities} />}

      {uiState.status === 'paused' && (
        <PauseMenu state={uiState} onResume={togglePause} onQuit={abandonRun} onOptions={() => setOptionsOpen(true)} onFeedback={openFeedback} />
      )}

      {optionsOpen && (uiState.status === 'menu' || uiState.status === 'paused') && (
        <OptionsMenu settings={save.settings} onChange={changeSettings} onClose={() => setOptionsOpen(false)} autoFireLocked={isTouch} />
      )}
      
      {feedback && (
        <FeedbackModal
          snapshot={feedback.snapshot}
          context={feedback.context}
          defaultName={player.name}
          screenToWorld={(x, y) => ({ x: x / VIEW_SCALE + camera.current.x, y: y / VIEW_SCALE + camera.current.y })}
          onClose={closeFeedback}
        />
      )}

      {uiState.status === 'gameover' && (
        <GameOverScreen
          state={uiState}
          summary={runSummary}
          abandoned={abandoned}
          leaderboard={leaderboard}
          onRetry={() => resetGame('playing', uiState.shipId)}
          onMenu={() => resetGame('menu', uiState.shipId)}
        />
      )}
    </div>
  );
};

export default App;
