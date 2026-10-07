import React, { useEffect, useRef } from 'react';
import { GameState, Passive } from '../../types';
import { UpgradeOption } from '../../engine/Progression';
import { DAMAGE_COLORS } from '../../constants';
import { synergyGains, upgradeKind, weaponStats, techNote, TAG_LABELS, DAMAGE_LABELS } from '../hud/model';
import { MAX_WEAPON_LEVEL } from '../../engine/Progression';
import { cx } from '../hud/widgets';

interface UpgradeMenuProps {
  state: GameState;
  options: UpgradeOption[];
  onSelect: (upgrade: UpgradeOption) => void;
}

const RARITY_COLOR: Record<Passive['rarity'], string> = {
  common: '#94a3b8',
  rare: '#22d3ee',
  epic: '#c084fc',
  legendary: '#fbbf24',
};

const accentOf = (opt: UpgradeOption) =>
  opt.type === 'keystone' ? (opt.item.color ?? RARITY_COLOR.legendary)
  : opt.type === 'weapon' ? DAMAGE_COLORS[opt.item.type]
  : RARITY_COLOR[opt.item.rarity];

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="font-hud text-[12px] uppercase tracking-wider text-slate-400">{label}</span>
    <span className="font-mono font-bold text-[15px] text-white tabular-nums">{value}</span>
  </div>
);

const OptionCard: React.FC<{ state: GameState; opt: UpgradeOption; index: number; onSelect: () => void }> = ({ state, opt, index, onSelect }) => {
  const accent = accentOf(opt);
  const gains = synergyGains(state, opt);
  const owned = opt.type === 'weapon' ? state.activeWeapons.find(w => w.id === opt.item.id) : undefined;
  const stats = opt.type === 'weapon' ? weaponStats(opt.item, owned ? owned.level + 1 : 1) : null;
  return (
    <button
      onClick={onSelect}
      className="group relative flex flex-col text-left p-4 sm:p-6 bg-slate-900/80 border-2 border-white/10 hover:bg-slate-800/90 transition-all hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      style={{ borderTopColor: accent, boxShadow: `0 -6px 30px -12px ${accent}` }}
    >
      <span className="absolute top-3 right-3 w-8 h-8 border border-white/30 flex items-center justify-center font-mono font-bold text-[15px] text-white bg-black/40">
        {index + 1}
      </span>
      <span className="font-hud font-bold text-[13px] uppercase tracking-[0.12em] mb-2 pr-10" style={{ color: accent }}>
        {upgradeKind(state, opt)}
      </span>
      <h3 className="font-hud font-bold text-[24px] sm:text-[28px] leading-tight text-white mb-3">
        {opt.type === 'keystone' && opt.item.icon ? `${opt.item.icon} ` : ''}{opt.item.name}
      </h3>
      <p className="font-hud text-[16px] leading-snug text-slate-200 mb-4">{opt.item.description}</p>

      {opt.type === 'weapon' && owned && techNote(opt.item, owned.level + 1) && (
        <div className="mb-4 px-3 py-2 border-l-[3px] bg-emerald-400/10" style={{ borderColor: '#34d399' }}>
          <span className="font-hud text-[12px] uppercase tracking-wider text-emerald-300">Bonus Tech {owned.level + 1}</span>
          <div className="font-hud font-bold text-[16px] text-white leading-snug">{techNote(opt.item, owned.level + 1)}</div>
        </div>
      )}
      {opt.type === 'weapon' && !owned && opt.item.techNotes && (
        <div className="mb-4 font-hud text-[13px] text-slate-300 leading-snug">
          {Array.from({ length: MAX_WEAPON_LEVEL - 1 }, (_, i) => i + 2).map(l => techNote(opt.item, l) && (
            <div key={l}><span className="font-mono text-slate-400">T{l}</span> {techNote(opt.item, l)}</div>
          ))}
        </div>
      )}

      {opt.type === 'weapon' && stats && (
        <div className="grid grid-cols-4 gap-2 mb-4 p-2 bg-black/30 border border-white/10">
          <Stat label="Type" value={<span style={{ color: DAMAGE_COLORS[opt.item.type] }}>{DAMAGE_LABELS[opt.item.type]}</span>} />
          <Stat label="Dégâts" value={stats.damage} />
          <Stat label="Tirs/s" value={stats.fireRate} />
          <Stat label="Chaleur" value={stats.heat} />
        </div>
      )}

      {'tags' in opt.item && opt.item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {opt.item.tags.map(t => (
            <span key={t} className="px-2 py-0.5 font-hud font-semibold text-[12px] uppercase tracking-wider bg-white/5 border border-white/20 text-slate-200">{TAG_LABELS[t]}</span>
          ))}
        </div>
      )}

      {gains.length > 0 && (
        <div className="mt-auto pt-3 border-t border-white/10 flex flex-col gap-1.5">
          <span className="font-hud text-[12px] uppercase tracking-wider text-slate-400">Synergies</span>
          {gains.map(g => (
            <div key={g.id} className="font-hud text-[14px] leading-snug">
              <span className="font-bold uppercase" style={{ color: g.color }}>{g.name}</span>{' '}
              <span className="font-mono text-white">{g.from}{g.to !== g.from ? ` → ${g.to}` : ''}</span>
              {g.unlocks
                ? <span className="block text-emerald-300 font-semibold">✓ Débloque : {g.unlocks}</span>
                : g.next && <span className="block text-slate-400">Prochain palier à {g.next.count} : {g.next.description}</span>}
            </div>
          ))}
        </div>
      )}
    </button>
  );
};

export const UpgradeMenu: React.FC<UpgradeMenuProps> = ({ state, options, onSelect }) => {
  // Un seul choix par tirage (évite le double clic / la répétition de touche)
  const locked = useRef(false);
  useEffect(() => { locked.current = false; }, [options]);
  const choose = (opt: UpgradeOption) => {
    if (locked.current) return;
    locked.current = true;
    onSelect(opt);
  };

  // Raccourcis clavier 1 / 2 / 3
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const i = Number(e.key) - 1;
      if (Number.isInteger(i) && i >= 0 && i < options.length) choose(options[i]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="absolute inset-0 z-50 flex items-[safe_center] justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-8 overflow-y-auto">
      <div className="max-w-6xl w-full ui-zoom">
        <div className="flex flex-wrap justify-between items-end gap-2 mb-4 sm:mb-8 border-b border-white/15 pb-3">
          <div>
            <div className="font-hud font-semibold text-[14px] uppercase tracking-[0.2em] text-violet-300">Niveau {state.level + 1} atteint</div>
            <h2 className="font-orbitron font-black text-[26px] sm:text-[40px] text-white uppercase leading-tight">Choisissez une amélioration</h2>
          </div>
          <span className={cx('font-hud text-[14px] text-slate-300')}>Clic ou touches <b className="text-white">1</b> <b className="text-white">2</b> <b className="text-white">3</b></span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
          {options.map((opt, i) => (
            <OptionCard key={`${opt.type}-${opt.item.id}`} state={state} opt={opt} index={i} onSelect={() => choose(opt)} />
          ))}
        </div>
      </div>
    </div>
  );
};
