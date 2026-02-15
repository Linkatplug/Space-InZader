
import React from 'react';
import { GameState } from '../types';

interface DebugOverlayProps {
  state: GameState;
  fps: number;
  frameTime: number;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ state, fps, frameTime }) => {
  const { player, enemies, projectiles, particles, xpDrops, effects, activeEvents, wave, heat } = state;

  const Row = ({ label, value, color = "text-green-400" }: { label: string, value: any, color?: string }) => (
    <div className="flex justify-between gap-4 font-mono text-[10px] uppercase leading-tight">
      <span className="text-slate-500">{label}:</span>
      <span className={color}>{value}</span>
    </div>
  );

  // Déterminer la couleur de santé du FPS
  const getFpsColor = (f: number) => {
    if (f >= 55) return "text-green-400";
    if (f >= 30) return "text-yellow-400";
    return "text-red-500";
  };

  return (
    <div className="absolute top-4 left-4 z-[100] bg-black/90 backdrop-blur-md border border-green-500/30 p-4 pointer-events-none min-w-[260px] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-end mb-4 border-b border-green-500/20 pb-2">
        <div>
          <div className="text-[10px] text-green-500/50 font-black">ENGINE_STATUS</div>
          <div className={`text-3xl font-black font-mono leading-none ${getFpsColor(fps)}`}>
            {fps}<span className="text-xs ml-1 opacity-50 text-white">FPS</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Frame Delay</div>
          <div className={`text-sm font-mono font-bold ${frameTime > 17 ? 'text-orange-400' : 'text-slate-300'}`}>
            {frameTime.toFixed(2)}<span className="text-[10px] ml-0.5 opacity-50">ms</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <section>
          <div className="text-[9px] text-green-500/40 font-bold mb-1 tracking-widest">// OBJECT_LOAD</div>
          <Row label="Hostiles" value={enemies.length} />
          <Row label="Projectiles" value={projectiles.length} />
          <Row label="Particles" value={particles.length} />
          <Row label="Loot/XP" value={xpDrops.length} />
          <Row label="VFX Active" value={effects.length} />
        </section>

        <section>
          <div className="text-[9px] text-green-500/40 font-bold mb-1 tracking-widest">// NAVIGATION</div>
          <Row label="COORD_X" value={Math.round(player.x)} />
          <Row label="COORD_Y" value={Math.round(player.y)} />
          <Row label="VELOCITY" value={`${Math.sqrt(player.vx**2 + player.vy**2).toFixed(1)} u/s`} />
          <Row label="THERMAL" value={`${((heat / state.maxHeat) * 100).toFixed(0)}%`} color={state.isOverheated ? "text-red-500 animate-pulse" : "text-orange-400"} />
        </section>

        <section className="bg-green-500/5 p-2 border-l-2 border-green-500/20">
          <div className="text-[9px] text-green-500/40 font-bold mb-1 tracking-widest">// SYSTEM</div>
          <Row label="Active Event" value={activeEvents.length > 0 ? activeEvents[0].type : "STABLE"} color={activeEvents.length > 0 ? "text-amber-400" : "text-green-800"} />
          <Row label="World Seed" value="0x8FA2" />
        </section>
      </div>

      <div className="mt-4 text-[8px] text-slate-600 font-bold italic flex justify-between uppercase">
        <span>Debug: F3</span>
        <span>Space InZader v1.0.4</span>
      </div>
    </div>
  );
};
