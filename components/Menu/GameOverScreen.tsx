import React from 'react';
import { GameState } from '../../types';
import { RunSummary } from '../../engine/Meta';
import { getShip } from '../../data/ships';
import { ENEMIES } from '../../data/enemies';
import { DAMAGE_COLORS } from '../../constants';
import { formatClock } from '../hud/model';
import { Leaderboard, LeaderboardView } from '../leaderboard/Leaderboard';

const SOURCE_NAMES: Record<string, string> = { meteor: 'Météore', black_hole: 'Trou noir', solar_storm: 'Éruption solaire' };
const sourceName = (id: string) => ENEMIES[id]?.name ?? SOURCE_NAMES[id] ?? id;

interface GameOverProps {
  state: GameState;
  summary: RunSummary | null;
  abandoned?: boolean;
  leaderboard: LeaderboardView;
  onRetry: () => void;
  onMenu: () => void;
}

const Stat: React.FC<{ label: string; value: string | number; record?: boolean }> = ({ label, value, record }) => (
  <div className={`p-3 text-left border ${record ? 'border-amber-400/70 bg-amber-400/10' : 'border-white/10 bg-black/30'}`}>
    <div className="font-hud text-[13px] font-semibold uppercase tracking-wider text-red-100/80">{label}</div>
    <div className={`font-mono font-bold text-[24px] tabular-nums ${record ? 'text-amber-300' : 'text-white'}`}>{value}</div>
    {record && <div className="font-hud text-[12px] font-bold uppercase text-amber-300">★ Nouveau record</div>}
  </div>
);

export const GameOverScreen: React.FC<GameOverProps> = ({ state, summary, abandoned, leaderboard, onRetry, onMenu }) => {
  const ship = getShip(state.shipId);
  return (
    <div data-pad-scope className="absolute inset-0 bg-gradient-to-b from-red-950/95 to-slate-950/95 flex flex-col items-center justify-[safe_center] z-50 text-center p-4 sm:p-10 overflow-y-auto">
      <div className="ui-zoom w-full flex flex-col items-center">
      <h2 className="font-orbitron font-black text-[40px] sm:text-[64px] text-white mb-2 uppercase leading-none">
        {abandoned ? 'Mission abandonnée' : 'Vaisseau détruit'}
      </h2>
      <div className="font-hud font-semibold text-[16px] uppercase tracking-[0.15em] mb-8" style={{ color: ship.color }}>
        {ship.name}{!abandoned && state.lastHitBy ? ` — abattu par : ${sourceName(state.lastHitBy)}` : ''}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 w-full max-w-4xl">
        <Stat label="Vague" value={state.wave} record={summary?.newBestWave} />
        <Stat label="Score" value={state.score.toLocaleString('fr-FR')} record={summary?.newBestScore} />
        <Stat label="Éliminations" value={state.totalKills} />
        <Stat label="Durée" value={formatClock(state.time)} />
        <Stat label="Niveau" value={state.level} />
        <Stat label="Boss vaincus" value={state.bossKills} />
        <Stat label="Dégâts infligés" value={Math.round(state.damageDealt).toLocaleString('fr-FR')} />
        <Stat label="Dégâts subis" value={Math.round(state.damageTaken).toLocaleString('fr-FR')} />
      </div>

      <div className="w-full max-w-4xl text-left mb-6">
        <div className="font-hud text-[13px] font-semibold uppercase tracking-wider text-red-100/80 mb-2">Build</div>
        <div className="flex flex-wrap gap-2">
          {state.activeWeapons.map(w => (
            <span key={w.id} className="px-2.5 py-1 bg-black/40 border-l-[3px] font-hud text-[15px] text-white" style={{ borderColor: DAMAGE_COLORS[w.type] }}>
              {w.name} <span className="font-mono text-slate-300">T{w.level}</span>
            </span>
          ))}
          {state.keystones.map(k => (
            <span key={k.id} className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/50 font-hud text-[15px] text-amber-200">{k.icon} {k.name}</span>
          ))}
          {state.activePassives.map(p => (
            <span key={p.passive.id} className="px-2.5 py-1 bg-black/30 border border-white/10 font-hud text-[15px] text-slate-200">{p.passive.name} ×{p.stacks}</span>
          ))}
        </div>
      </div>

      {summary && summary.unlockedShips.length > 0 && (
        <div className="mb-6 px-6 py-3 border-2 border-amber-400 bg-amber-400/10 text-amber-300 font-hud font-bold uppercase tracking-wider text-[18px]">
          Nouveau vaisseau débloqué : {summary.unlockedShips.map(s => s.name).join(', ')}
        </div>
      )}

      <Leaderboard view={leaderboard} className="w-full max-w-4xl text-left mb-6" />

      <div className="flex flex-wrap justify-center gap-4">
        <button onClick={onRetry} className="px-10 py-4 bg-white text-red-900 font-hud font-bold text-[20px] uppercase tracking-wider hover:bg-red-100 transition-colors">Rejouer</button>
        <button onClick={onMenu} className="px-10 py-4 border-2 border-white/50 text-white font-hud font-bold text-[20px] uppercase tracking-wider hover:bg-white/10 transition-colors">Menu</button>
      </div>
      </div>
    </div>
  );
};
