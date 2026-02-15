
import React, { useEffect, useRef, useState } from 'react';
import { GameState, Entity, DamageType, Weapon, Stats, Keystone, Passive, EnvEventType } from './types';
import { WORLD_WIDTH, WORLD_HEIGHT, VIEW_SCALE, INITIAL_STATS, WEAPON_POOL, CONTROLS } from './constants';
import { HUD } from './components/HUD';
import { UpgradeMenu } from './components/Menu/UpgradeMenu';
import { DevMenu } from './components/Menu/DevMenu';
import { DebugOverlay } from './components/DebugOverlay';
import { updateGameState, spawnEnemy, createEffect } from './engine/CoreEngine';
import { renderGame } from './render/CoreRenderer';
import { startBGM, stopBGM } from './engine/SoundEngine';
import { input } from './engine/InputManager';
import { BLINK_DASH, TACTICAL_NOVA } from './engine/AbilitySystem';
import { calculateRuntimeStats, syncDefenseState } from './engine/StatsCalculator';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isLabMenuOpen, setIsLabMenuOpen] = useState(true);
  
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const frameTimes = useRef<number[]>([]);
  const lastFpsUpdate = useRef<number>(0);

  const createInitialState = (): GameState => ({
    player: {
      id: 'player', x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2, rotation: -Math.PI / 2, vx: 0, vy: 0, radius: 40, type: 'player',
      baseStats: { ...INITIAL_STATS }, runtimeStats: { ...INITIAL_STATS }, modifiers: [], statsDirty: true,
      defense: { shield: INITIAL_STATS.maxShield, armor: INITIAL_STATS.maxArmor, hull: INITIAL_STATS.maxHull },
      isGodMode: false
    },
    heat: 0, maxHeat: INITIAL_STATS.maxHeat, isOverheated: false, score: 0, level: 1, experience: 0, 
    expToNextLevel: 60,
    wave: 1, waveTimer: 35,
    waveKills: 0,
    waveQuota: 15,
    totalKills: 0,
    startTime: Date.now(),
    enemies: [], projectiles: [], xpDrops: [], effects: [], particles: [], activeWeapons: [{ ...WEAPON_POOL[0], level: 1 }],
    activeAbilities: [
      { ...BLINK_DASH },
      { ...TACTICAL_NOVA }
    ],
    activeEvents: [],
    keystones: [], activePassives: [], status: 'menu', comboCount: 0, comboTimer: 0, currentMisses: 0, bossSpawned: false,
    isDebugMode: false,
  });

  const engineState = useRef<GameState>(createInitialState());
  const [uiState, setUiState] = useState<GameState>(engineState.current);
  const lastTime = useRef<number>(0);
  const screenShake = useRef<number>(0);
  const camera = useRef({ x: WORLD_WIDTH / 2 - dimensions.width / (2 * VIEW_SCALE), y: WORLD_HEIGHT / 2 - dimensions.height / (2 * VIEW_SCALE) });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    if (canvasRef.current) input.setCanvas(canvasRef.current);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetGame = (newStatus: 'menu' | 'playing' | 'dev' | 'lab' = 'menu') => {
    const freshState = createInitialState();
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
        const mouseWorld = {
          x: (mousePos.x / VIEW_SCALE) + camera.current.x,
          y: (mousePos.y / VIEW_SCALE) + camera.current.y
        };

        const isInputFocused = document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement;
        const keys = isInputFocused ? new Set<string>() : input.getKeys();

        updateGameState(
          s, deltaTime, time, keys, mouseWorld,
          () => { if(s.status !== 'lab') { s.status = 'leveling'; stopBGM(); } },
          () => { 
            if(s.status === 'lab') {
              handleDevAction('heal_player');
              createEffect(s, s.player.x, s.player.y, "RESPAWN_SIMULÉ", "#ffffff");
            } else {
              s.status = 'gameover'; 
              stopBGM(); 
            }
          },
          (amount) => { screenShake.current = amount; }
        );

        const sidebarWidth = 450;
        const offset = (s.status === 'lab' && isLabMenuOpen) ? sidebarWidth : 0;
        const visibleWidth = dimensions.width - offset;
        
        const targetX = s.status === 'lab'
          ? s.player.x - (offset + visibleWidth / 2) / VIEW_SCALE
          : s.player.x - (dimensions.width / 2) / VIEW_SCALE;

        camera.current.x += (targetX - camera.current.x) * 0.1;
        camera.current.y += (s.player.y - dimensions.height / (2 * VIEW_SCALE) - camera.current.y) * 0.1;

        if (screenShake.current > 0) screenShake.current -= deltaTime * 40;
        setUiState({ ...s });
      }

      if (ctx) {
        renderGame(ctx, s, dimensions, camera.current, screenShake.current, time);
      }
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions, isLabMenuOpen]);

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === CONTROLS.PAUSE) {
        const s = engineState.current;
        if (s.status === 'playing') { s.status = 'paused'; stopBGM(); } 
        else if (s.status === 'paused') { s.status = 'playing'; startBGM(); }
        setUiState({...s});
      }
      if (key === CONTROLS.DEBUG) {
        e.preventDefault();
        const s = engineState.current;
        s.isDebugMode = !s.isDebugMode;
        setUiState({...s});
      }
    };
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
        s.player.baseStats = { ...INITIAL_STATS };
        s.player.isGodMode = false;
        s.player.statsDirty = true;
        // On force le recalcul immédiat pour éviter les overflows de PV
        s.player.runtimeStats = calculateRuntimeStats(s.player, s);
        syncDefenseState(s.player);
        createEffect(s, s.player.x, s.player.y, "PHYSICS_NORMALIZED", "#fbbf24");
        break;
      case 'spawn_basic': case 'spawn_swarmer': case 'spawn_sniper': case 'spawn_kamikaze': case 'spawn_boss':
        const type = action.replace('spawn_', '');
        const newEnemy = spawnEnemy(s.wave, s.player, type as any, spawnDist);
        s.enemies.push(newEnemy);
        createEffect(s, newEnemy.x, newEnemy.y, `INJECT_${type.toUpperCase()}`, "#ef4444");
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
        const existingW = s.activeWeapons.find(w => w.id === data.id);
        if (existingW) existingW.level = Math.min(3, existingW.level + 1);
        else s.activeWeapons.push({ ...data, level: 1 });
        break;
      case 'install_passive':
        const existingP = s.activePassives.find(ap => ap.passive.id === data.id);
        if (existingP) existingP.stacks++;
        else s.activePassives.push({ passive: data, stacks: 1 });
        s.player.statsDirty = true;
        break;
      case 'install_keystone':
        if (!s.keystones.find(k => k.id === data.id)) {
          s.keystones.push(data);
          s.player.statsDirty = true;
        }
        break;
      case 'clear_loadout':
        s.activeWeapons = [{ ...WEAPON_POOL[0], level: 1 }];
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

  return (
    <div className="relative w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="absolute inset-0" />
      
      {uiState.isDebugMode && <DebugOverlay state={uiState} fps={fps} frameTime={frameTime} />}
      {uiState.status !== 'menu' && uiState.status !== 'dev' && uiState.status !== 'lab' && <HUD state={uiState} />}
      
      {uiState.status === 'menu' && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center z-50 font-orbitron text-center">
          <h1 className="text-[8rem] font-bold text-cyan-400 mb-4 uppercase tracking-tighter italic drop-shadow-[0_0_50px_rgba(34,211,238,0.3)]">Space InZader</h1>
          <div className="flex flex-col gap-4">
            <button onClick={() => resetGame('playing')} className="px-12 py-10 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-3xl border-b-8 border-cyan-800 transition-all uppercase active:translate-y-1">DÉMARRER MISSION</button>
            <div className="flex gap-4">
               <button onClick={() => resetGame('dev')} className="flex-1 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-sm border-b-4 border-slate-950 transition-all uppercase tracking-widest">DATABASE_DEV</button>
               <button onClick={() => resetGame('lab')} className="flex-1 px-8 py-4 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-300 font-bold text-sm border-b-4 border-indigo-950 transition-all uppercase tracking-widest">ENGINEERING_LAB</button>
            </div>
          </div>
        </div>
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
          onSelect={(u) => {
            const s = engineState.current;
            if (u.type === 'weapon') {
              const ex = s.activeWeapons.find(w => w.id === u.item.id);
              if (ex) ex.level = Math.min(3, ex.level + 1);
              else s.activeWeapons.push({ ...u.item, level: 1 });
            } else if (u.type === 'passive') {
              const ex = s.activePassives.find(p => p.passive.id === u.item.id);
              if (ex) ex.stacks = Math.min(u.item.maxStacks, ex.stacks + 1);
              else s.activePassives.push({ passive: u.item, stacks: 1 });
              s.player.statsDirty = true;
            }
            if (s.player.statsDirty) {
              s.player.runtimeStats = calculateRuntimeStats(s.player, s);
              syncDefenseState(s.player);
              s.player.statsDirty = false;
            }
            s.experience -= s.expToNextLevel;
            s.expToNextLevel = Math.floor(s.expToNextLevel * 1.3);
            s.level++;
            s.status = 'playing';
            startBGM();
            setUiState({ ...s });
          }} 
          currentWeapons={uiState.activeWeapons} 
          currentKeystones={uiState.keystones} 
        />
      )}
      
      {uiState.status === 'paused' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 font-orbitron">
           <h2 className="text-[10vw] font-black text-white italic animate-pulse">SYSTEM_PAUSE</h2>
        </div>
      )}
      
      {uiState.status === 'gameover' && (
        <div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center z-50 text-center font-orbitron p-20">
           <h2 className="text-[10vw] font-bold text-white mb-6 uppercase tracking-tighter">CRITICAL_FAILURE</h2>
           <button onClick={() => resetGame('playing')} className="px-24 py-12 bg-white text-red-900 font-bold text-4xl uppercase hover:bg-red-100 transition-colors">SYSTEM_REBOOT</button>
        </div>
      )}
    </div>
  );
};

export default App;
