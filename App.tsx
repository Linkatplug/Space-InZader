
import React, { useEffect, useRef, useState } from 'react';
import { GameState, Entity, DamageType, Weapon, Stats, Keystone, Passive, EnvEventType } from './types';
import { WORLD_WIDTH, WORLD_HEIGHT, viewScaleFor, INITIAL_STATS, CONTROLS } from './constants';
import { HUD } from './components/HUD';
import { UpgradeMenu } from './components/Menu/UpgradeMenu';
import { DevMenu } from './components/Menu/DevMenu';
import { DebugOverlay } from './components/DebugOverlay';
import { updateGameState, spawnEnemy, createEffect } from './engine/CoreEngine';
import { renderGame } from './render/CoreRenderer';
import { startBGM, stopBGM, setMuted, nextTrack } from './engine/SoundEngine';
import { input } from './engine/InputManager';
import { createInitialState } from './engine/GameFactory';
import { applyUpgrade, rollUpgradeOptions, UpgradeOption } from './engine/Progression';
import { WEAPONS } from './data/weapons';
import { triggerEvent } from './engine/EventSystem';
import { MainMenu } from './components/Menu/MainMenu';
import { TouchControls, isTouchDevice } from './components/TouchControls';
import { GameOverScreen } from './components/Menu/GameOverScreen';
import { MetaSave, RunSummary, loadSave, writeSave, recordRun } from './engine/Meta';
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
  useEffect(() => { setMuted(saveRef.current.settings.muted); }, []);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const isTouch = React.useMemo(() => isTouchDevice(), []);
  const togglePause = () => {
    const s = engineState.current;
    if (s.status === 'playing') { s.status = 'paused'; stopBGM(); }
    else if (s.status === 'paused') { s.status = 'playing'; startBGM(); }
    setUiState({ ...s });
  };

  /** Fin de partie : enregistre records / déblocages. */
  const finishRun = (s: GameState) => {
    const { save: next, summary } = recordRun(saveRef.current, s);
    saveRef.current = next;
    writeSave(next);
    setSave(next);
    setRunSummary(summary);
  };

  const updateSettings = (patch: Partial<MetaSave['settings']>) => {
    const next = { ...saveRef.current, settings: { ...saveRef.current.settings, ...patch } };
    saveRef.current = next;
    writeSave(next);
    setSave(next);
  };
  const [uiState, setUiState] = useState<GameState>(engineState.current);
  const lastTime = useRef<number>(0);
  const accumulator = useRef<number>(0);
  const lastUiSync = useRef<number>(0);
  const screenShake = useRef<number>(0);
  const VIEW_SCALE = viewScaleFor(dimensions);
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
    setRunSummary(null);
    freshState.status = newStatus;
    freshState.startTime = Date.now();
    engineState.current = freshState;
    camera.current = { x: freshState.player.x - dimensions.width / (2 * VIEW_SCALE), y: freshState.player.y - dimensions.height / (2 * VIEW_SCALE) };
    setUiState(freshState);
    if (newStatus === 'playing') startBGM(); else stopBGM();
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

      if ((s.status === 'playing' || s.status === 'lab') && ctx) {
        const mousePos = input.getMousePos();
        const isInputFocused = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;
        const keys = isInputFocused ? new Set<string>() : input.getKeys();
        s.analogMove = input.getAnalog();

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
            () => { if (s.status !== 'lab') { s.status = 'leveling'; setUpgradeOptions(rollUpgradeOptions(s)); stopBGM(); } },
            () => {
              if (s.status === 'lab') {
                handleDevAction('heal_player');
                createEffect(s, s.player.x, s.player.y, "RESPAWN_SIMULÉ", "#ffffff");
              } else {
                s.status = 'gameover';
                stopBGM();
                finishRun(s);
              }
            }
          );
          if (s.status !== 'playing' && s.status !== 'lab') { accumulator.current = 0; break; }
        }
        if (steps >= 6) accumulator.current = 0;

        if (s.shake > screenShake.current) screenShake.current = s.shake;
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
        renderGame(ctx, s, dimensions, camera.current, screenShake.current, s.time, VIEW_SCALE);
      }
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions, isLabMenuOpen]);

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === CONTROLS.PAUSE || key === 'escape') togglePause();
      if (key === CONTROLS.MUTE) {
        const muted = !saveRef.current.settings.muted;
        setMuted(muted);
        updateSettings({ muted });
        const s = engineState.current;
        createEffect(s, s.player.x, s.player.y - 60, muted ? 'SON : OFF' : 'SON : ON', '#94a3b8');
      }
      if (key === CONTROLS.NEXT_TRACK) nextTrack();
      if (key === CONTROLS.AUTO_FIRE) {
        const s = engineState.current;
        s.autoFire = !s.autoFire;
        updateSettings({ autoFire: s.autoFire });
        createEffect(s, s.player.x, s.player.y - 60, s.autoFire ? 'TIR AUTO : ON' : 'TIR AUTO : OFF', '#22d3ee');
        setUiState({...s});
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
    };
  });

  return (
    <div className="relative w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="absolute inset-0" />
      
      {uiState.isDebugMode && <DebugOverlay state={uiState} fps={fps} frameTime={frameTime} />}
      {uiState.status !== 'menu' && uiState.status !== 'dev' && uiState.status !== 'lab' && <HUD state={uiState} />}
      
      {uiState.status === 'menu' && (
        <MainMenu
          save={save}
          onStart={(shipId) => resetGame('playing', shipId)}
          onDev={() => resetGame('dev')}
          onLab={() => resetGame('lab')}
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
          currentWeapons={uiState.activeWeapons}
        />
      )}
      
      {isTouch && uiState.status === 'playing' && <TouchControls onPause={togglePause} />}

      {uiState.status === 'paused' && (
        <div onClick={togglePause} className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-40 font-orbitron cursor-pointer">
           <h2 className="text-[10vw] font-black text-white italic animate-pulse">SYSTEM_PAUSE</h2>
           <p className="text-xs text-slate-400 uppercase tracking-[0.4em] mt-4">P / Échap / toucher pour reprendre</p>
        </div>
      )}
      
      {uiState.status === 'gameover' && (
        <GameOverScreen
          state={uiState}
          summary={runSummary}
          onRetry={() => resetGame('playing', uiState.shipId)}
          onMenu={() => resetGame('menu', uiState.shipId)}
        />
      )}
    </div>
  );
};

export default App;
