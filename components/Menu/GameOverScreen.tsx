import React from 'react';
import { GameState } from '../../types';
import { RunSummary } from '../../engine/Meta';
import { getShip } from '../../data/ships';
import { ENEMIES } from '../../data/enemies';

const SOURCE_NAMES: Record<string, string> = { meteor: 'Météore', black_hole: 'Trou noir', solar_storm: 'Éruption solaire' };
const sourceName = (id: string) => ENEMIES[id]?.name ?? SOURCE_NAMES[id] ?? id;

interface GameOverProps {
  state: GameState;
  summary: RunSummary | null;
  onRetry: () => void;
  onMenu: () => void;
}

const fmtTime = (sec: number) => `${Math.floor(sec / 60).toString().padStart(2, '0')}:${Math.floor(sec % 60).toString().padStart(2, '0')}`;

export const GameOverScreen: React.FC<GameOverProps> = ({ state, summary, onRetry, onMenu }) => {
  const ship = getShip(state.shipId);
  const Stat = ({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) => (
    <div className="border-l-2 border-white/10 pl-3 text-left">
      <div className="text-[9px] text-red-300/70 uppercase tracking-widest">{label}</div>
      <div className={`text-xl font-black ${highlight ? 'text-amber-300' : 'text-white'}`}>{value}{highlight ? ' ★' : ''}</div>
    </div>
  );

  return (
    <div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-[safe_center] z-50 text-center font-orbitron p-4 sm:p-10 overflow-y-auto">
      <h2 className="text-4xl sm:text-7xl font-bold text-white mb-2 uppercase tracking-tighter">Critical_Failure</h2>
      <div className="text-xs uppercase tracking-[0.4em] mb-8" style={{ color: ship.color }}>
        {ship.name} détruit{state.lastHitBy ? ` par : ${sourceName(state.lastHitBy)}` : ''}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 w-full max-w-3xl">
        <Stat label="Vague" value={state.wave} highlight={summary?.newBestWave} />
        <Stat label="Score" value={state.score.toLocaleString()} highlight={summary?.newBestScore} />
        <Stat label="Éliminations" value={state.totalKills} />
        <Stat label="Durée" value={fmtTime(state.time / 1000)} />
        <Stat label="Niveau" value={state.level} />
        <Stat label="Boss vaincus" value={state.bossKills} />
        <Stat label="Dégâts infligés" value={Math.round(state.damageDealt).toLocaleString()} />
        <Stat label="Dégâts subis" value={Math.round(state.damageTaken).toLocaleString()} />
      </div>

      <div className="w-full max-w-3xl text-left mb-6">
        <div className="text-[9px] text-red-300/70 uppercase tracking-widest mb-2">Build</div>
        <div className="flex flex-wrap gap-2">
          {state.activeWeapons.map(w => (
            <span key={w.id} className="px-2 py-1 bg-black/30 border border-white/10 text-xs text-white">{w.name} T{w.level}</span>
          ))}
          {state.keystones.map(k => (
            <span key={k.id} className="px-2 py-1 bg-amber-500/10 border border-amber-500/40 text-xs text-amber-300">{k.icon} {k.name}</span>
          ))}
          {state.activePassives.map(p => (
            <span key={p.passive.id} className="px-2 py-1 bg-black/20 border border-white/5 text-xs text-slate-300">{p.passive.name} ×{p.stacks}</span>
          ))}
        </div>
      </div>

      {summary && summary.unlockedShips.length > 0 && (
        <div className="mb-6 px-6 py-3 border-2 border-amber-400 bg-amber-400/10 text-amber-300 font-black uppercase tracking-widest text-sm">
          Nouveau vaisseau débloqué : {summary.unlockedShips.map(s => s.name).join(', ')}
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={onRetry} className="px-10 py-5 bg-white text-red-900 font-bold text-xl uppercase hover:bg-red-100 transition-colors">System_Reboot</button>
        <button onClick={onMenu} className="px-10 py-5 border-2 border-white/40 text-white font-bold text-xl uppercase hover:bg-white/10 transition-colors">Menu</button>
      </div>
    </div>
  );
};
