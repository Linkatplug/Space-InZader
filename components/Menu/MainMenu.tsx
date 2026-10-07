import React, { useState } from 'react';
import { SHIPS } from '../../data/ships';
import { WEAPONS } from '../../data/weapons';
import { KEYSTONES } from '../../data/keystones';
import { MetaSave, isShipUnlocked, unlockLabel } from '../../engine/Meta';

interface MainMenuProps {
  save: MetaSave;
  onStart: (shipId: string) => void;
  onDev: () => void;
  onLab: () => void;
}

const DIFFICULTY_COLOR = { facile: 'text-green-400', moyen: 'text-amber-400', difficile: 'text-red-400' };

const CONTROLS_HELP: [string, string][] = [
  ['ZQSD', 'Se déplacer'], ['Souris', 'Viser'],
  ['Clic / Espace', 'Tirer'], ['F', 'Tir auto'],
  ['Shift', 'Dash'], ['E', 'Nova'],
  ['P / Échap', 'Pause'], ['M / N', 'Son / piste'],
];

export const MainMenu: React.FC<MainMenuProps> = ({ save, onStart, onDev, onLab }) => {
  const initial = SHIPS.find(s => s.id === save.lastShipId && isShipUnlocked(s, save)) ?? SHIPS[0];
  const [selected, setSelected] = useState(initial.id);
  const ship = SHIPS.find(s => s.id === selected)!;
  const unlocked = isShipUnlocked(ship, save);
  const weapon = WEAPONS.find(w => w.id === ship.startingWeapon);
  const keystone = KEYSTONES.find(k => k.id === ship.signatureKeystone);

  return (
    <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-[safe_center] z-50 font-hud text-center overflow-y-auto p-4 sm:p-8">
      <div className="ui-zoom w-full flex flex-col items-center">
      <h1 className="font-orbitron text-5xl sm:text-7xl lg:text-8xl font-black text-cyan-400 mb-2 uppercase tracking-tighter italic drop-shadow-[0_0_50px_rgba(34,211,238,0.3)]">Space InZader</h1>
      <div className="text-[14px] sm:text-[15px] text-slate-300 tracking-[0.15em] uppercase mb-6 sm:mb-10">
        Record : vague <b className="text-white">{save.bestWave}</b> · <b className="text-white">{save.bestScore.toLocaleString('fr-FR')}</b> pts · {save.totalRuns} partie{save.totalRuns > 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 mb-6 w-full max-w-6xl">
        {SHIPS.map(s => {
          const ok = isShipUnlocked(s, save);
          const active = s.id === selected;
          return (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={`p-3 border-2 transition-all text-left ${active ? 'bg-white/10' : 'bg-slate-900/60 hover:bg-white/5'} ${ok ? '' : 'opacity-50'}`}
              style={{ borderColor: active ? s.color : 'rgba(255,255,255,0.08)' }}
            >
              <svg viewBox="0 0 40 40" className="w-8 h-8 mb-2" style={{ stroke: s.color }} fill="none" strokeWidth={2}>
                <path d="M20 4 L34 34 L20 28 L6 34 Z" />
              </svg>
              <div className="text-[15px] font-bold text-white uppercase leading-tight">{ok ? s.name : '???'}</div>
              <div className={`text-[12px] font-semibold uppercase tracking-wider ${ok ? DIFFICULTY_COLOR[s.difficulty] : 'text-slate-400'}`}>{ok ? s.difficulty : '🔒 verrouillé'}</div>
            </button>
          );
        })}
      </div>

      <div className="w-full max-w-3xl border-2 p-4 sm:p-6 mb-6 text-left bg-slate-900/50" style={{ borderColor: ship.color + '66' }}>
        <div className="flex justify-between items-baseline mb-2">
          <h2 className="font-orbitron text-2xl font-black uppercase" style={{ color: ship.color }}>{unlocked ? ship.name : 'Vaisseau verrouillé'}</h2>
          <span className={`text-[13px] font-semibold uppercase tracking-wider ${DIFFICULTY_COLOR[ship.difficulty]}`}>{ship.difficulty}</span>
        </div>
        {unlocked ? (
          <>
            <p className="text-[16px] text-slate-200 mb-4 leading-snug">{ship.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px]">
              <div className="border-l-2 border-white/10 pl-3">
                <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Arme de départ</div>
                <div className="text-white font-bold text-[15px]">{weapon?.name}</div>
                <div className="text-slate-300 leading-snug">{weapon?.description}</div>
              </div>
              <div className="border-l-2 border-white/10 pl-3">
                <div className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">Keystone signature</div>
                <div className="text-white font-bold text-[15px]">{keystone?.icon} {keystone?.name}</div>
                <div className="text-slate-300 leading-snug">{keystone?.description}</div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-[16px] text-slate-200">🔒 Condition : {unlockLabel(ship)}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-md">
        <button
          disabled={!unlocked}
          onClick={() => onStart(ship.id)}
          className="px-8 py-5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-orbitron font-black text-2xl border-b-8 border-cyan-800 disabled:border-slate-900 transition-all uppercase active:translate-y-1"
        >
          Démarrer mission
        </button>
        <div className="flex gap-3">
          <button onClick={onDev} className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[13px] border-b-4 border-slate-950 transition-all uppercase tracking-wider">Base de données</button>
          <button onClick={onLab} className="flex-1 px-4 py-3 bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 font-bold text-[13px] border-b-4 border-indigo-950 transition-all uppercase tracking-wider">Labo d'essais</button>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-slate-300 mt-2 text-left">
          {CONTROLS_HELP.map(([k, v]) => (
            <div key={k} className="flex gap-2"><kbd className="font-mono text-white bg-white/10 px-1.5 border border-white/20 whitespace-nowrap w-[120px] shrink-0 text-center">{k}</kbd><span>{v}</span></div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};
