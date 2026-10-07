import React from 'react';
import { GameState } from '../../types';
import { DAMAGE_COLORS } from '../../constants';
import { MAX_WEAPON_LEVEL } from '../../engine/Progression';
import { formatClock, keystoneInfo, synergyRows, techNote, DAMAGE_LABELS, RARITY_LABELS } from '../hud/model';
import { Pips, cx } from '../hud/widgets';

interface PauseMenuProps {
  state: GameState;
  onResume: () => void;
  onQuit: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; empty?: string }> = ({ title, children, empty }) => (
  <section className="flex flex-col gap-2 min-w-0">
    <h3 className="font-hud font-bold text-[14px] uppercase tracking-[0.15em] text-cyan-300 border-b border-cyan-400/30 pb-1">{title}</h3>
    {children ?? <p className="font-hud text-[14px] text-slate-400">{empty}</p>}
  </section>
);

const Item: React.FC<{ color: string; title: React.ReactNode; right?: React.ReactNode; children?: React.ReactNode }> = ({ color, title, right, children }) => (
  <div className="p-2.5 bg-slate-900/70 border-l-[3px]" style={{ borderColor: color }}>
    <div className="flex items-center gap-2">
      <span className="font-hud font-bold text-[15px] text-white flex-1 min-w-0">{title}</span>
      {right}
    </div>
    {children && <div className="font-hud text-[14px] text-slate-300 leading-snug mt-1">{children}</div>}
  </div>
);

/** Pause : reprise, abandon et récapitulatif complet du build (synergies, keystones, modules). */
export const PauseMenu: React.FC<PauseMenuProps> = ({ state, onResume, onQuit }) => {
  const synergies = synergyRows(state);
  return (
    <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md overflow-y-auto p-3 sm:p-8 flex justify-center items-[safe_center]">
      <div className="w-full max-w-6xl ui-zoom">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-orbitron font-black text-[40px] sm:text-[56px] text-white leading-none">PAUSE</h2>
            <div className="font-hud text-[15px] text-slate-300 mt-2">
              Vague <b className="text-white">{state.wave}</b> · Niveau <b className="text-white">{state.level}</b> · <span className="font-mono">{formatClock(state.time)}</span> · {state.totalKills} éliminations
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onResume} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-hud font-bold text-[18px] uppercase tracking-wider">
              Reprendre <span className="hidden sm:inline text-[13px] opacity-70">(P / Échap)</span>
            </button>
            <button onClick={onQuit} className="px-5 py-3 border-2 border-red-400/60 text-red-300 hover:bg-red-500/15 font-hud font-bold text-[16px] uppercase tracking-wider">
              Abandonner
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Section title="Armes">
            {state.activeWeapons.map(w => (
              <Item
                key={w.id}
                color={DAMAGE_COLORS[w.type]}
                title={w.name}
                right={<span className="flex items-center gap-1.5 font-mono text-[13px] text-slate-200">T{w.level}<Pips value={w.level} max={MAX_WEAPON_LEVEL} color={DAMAGE_COLORS[w.type]} /></span>}
              >
                <span style={{ color: DAMAGE_COLORS[w.type] }}>{DAMAGE_LABELS[w.type]}</span> — {w.description}
                {Array.from({ length: w.level - 1 }, (_, i) => i + 2).map(l => techNote(w, l) && (
                  <div key={l} className="text-emerald-300"><span className="font-mono">T{l}</span> ✓ {techNote(w, l)}</div>
                ))}
              </Item>
            ))}
          </Section>

          <Section title="Synergies" empty="Aucune synergie entamée. Les armes et modules partageant un tag se renforcent.">
            {synergies.length > 0 ? synergies.map(r => (
              <Item key={r.id} color={r.color} title={<span style={{ color: r.color }} className="uppercase">{r.name}</span>} right={<span className="font-mono text-[14px] text-white">{r.count} objet{r.count > 1 ? 's' : ''}</span>}>
                {r.tiers.map(t => (
                  <div key={t.count} className={cx('flex gap-2', t.active ? 'text-white' : 'text-slate-400')}>
                    <span className="font-mono w-5 shrink-0">{t.active ? '✓' : t.count}</span>
                    <span>{t.description}</span>
                  </div>
                ))}
              </Item>
            )) : null}
          </Section>

          <div className="flex flex-col gap-6">
            <Section title="Keystones" empty="Aucune keystone (une tous les 5 niveaux).">
              {state.keystones.length > 0 ? state.keystones.map(k => {
                const info = keystoneInfo(state, k);
                const status = info.kind === 'scaling' ? `${info.value} / ${info.max} ${info.label}`
                  : info.kind === 'conditional' ? (info.active ? 'Active' : `Inactive — si ${info.label}`)
                  : 'Permanente';
                return (
                  <Item key={k.id} color={k.color ?? '#fbbf24'} title={`${k.icon ?? ''} ${k.name}`}>
                    {k.description}
                    <div className={cx('font-semibold mt-0.5', info.active ? 'text-emerald-300' : 'text-slate-400')}>{status}</div>
                  </Item>
                );
              }) : null}
            </Section>

            <Section title="Modules" empty="Aucun module.">
              {state.activePassives.length > 0 ? state.activePassives.map(({ passive, stacks }) => (
                <Item key={passive.id} color="#94a3b8" title={passive.name} right={<span className="font-mono text-[13px] text-slate-200">{stacks}/{passive.maxStacks}</span>}>
                  <span className="text-slate-400">{RARITY_LABELS[passive.rarity]} — </span>{passive.description}
                </Item>
              )) : null}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
};
