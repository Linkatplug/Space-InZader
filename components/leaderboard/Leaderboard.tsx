import React from 'react';
import type { LeaderboardResponse, ScoreRow } from '../../types';
import { getShip } from '../../data/ships';
import { formatDuration, formatScore, meOutsideTop, rankMessage } from './logic';
import { LEADERBOARD_TEXT as T } from './text';

export type LeaderboardView =
  | { status: 'loading' }
  | { status: 'unavailable'; message?: string }
  | { status: 'ready'; data: LeaderboardResponse };

const Row: React.FC<{ row: ScoreRow; highlight: boolean }> = ({ row, highlight }) => (
  <tr className={highlight ? 'bg-cyan-400/20 text-white font-bold' : 'text-slate-200'}>
    <td className="py-1 pr-2 font-mono tabular-nums text-right w-10">{row.rank}</td>
    <td className="py-1 pr-2 truncate max-w-[9rem]">{row.name}{highlight && <span className="ml-1 text-[12px] text-cyan-300">({T.you})</span>}</td>
    <td className="py-1 pr-2 font-mono tabular-nums text-right">{formatScore(row.score)}</td>
    <td className="py-1 pr-2 font-mono tabular-nums text-right">{row.wave}</td>
    <td className="py-1 pr-2 font-mono tabular-nums text-right hidden sm:table-cell">{formatDuration(row.timeSec)}</td>
    <td className="py-1 hidden sm:table-cell truncate max-w-[8rem]">{getShip(row.ship).name}</td>
  </tr>
);

/** Bloc « Classement » : top 10, ligne du joueur en évidence, son rang s'il est hors top, état indisponible. */
export const Leaderboard: React.FC<{ view: LeaderboardView; className?: string }> = ({ view, className = '' }) => {
  const outside = view.status === 'ready' ? meOutsideTop(view.data) : null;
  const rank = view.status === 'ready' ? rankMessage(view.data.me, view.data.total) : null;
  return (
    <section className={`font-hud ${className}`} aria-label={T.title}>
      <h3 className="font-bold text-[14px] uppercase tracking-[0.15em] text-cyan-300 border-b border-cyan-400/30 pb-1 mb-2">{T.title}</h3>
      {view.status === 'loading' && <p className="text-[14px] text-slate-400">{T.loading}</p>}
      {view.status === 'unavailable' && <p className="text-[14px] text-amber-300" role="status">{view.message ?? T.unavailable}</p>}
      {view.status === 'ready' && (
        <>
          {view.data.personalBest && <p className="text-[15px] font-bold text-amber-300 mb-1">{T.newPersonalBest}</p>}
          {rank && <p className="text-[15px] text-white mb-2">{rank}</p>}
          {view.data.top.length === 0 ? <p className="text-[14px] text-slate-400">{T.empty}</p> : (
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-slate-500 text-[12px] uppercase text-left">
                  <th className="text-right pr-2">{T.columns.rank}</th><th className="pr-2">{T.columns.name}</th>
                  <th className="text-right pr-2">{T.columns.score}</th><th className="text-right pr-2">{T.columns.wave}</th>
                  <th className="text-right pr-2 hidden sm:table-cell">{T.columns.time}</th><th className="hidden sm:table-cell">{T.columns.ship}</th>
                </tr>
              </thead>
              <tbody>
                {view.data.top.map(row => <Row key={`${row.rank}-${row.name}`} row={row} highlight={!!row.me} />)}
                {outside && (
                  <>
                    <tr className="text-slate-500"><td colSpan={6} className="text-center leading-none">…</td></tr>
                    <Row row={outside} highlight />
                  </>
                )}
              </tbody>
            </table>
          )}
        </>
      )}
    </section>
  );
};
