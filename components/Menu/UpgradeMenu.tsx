import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameState, Passive } from '../../types';
import { UpgradeOption, MAX_WEAPON_LEVEL } from '../../engine/Progression';
import { previewUpgrade, UpgradePreview } from '../../engine/Preview';
import { DAMAGE_COLORS } from '../../constants';
import { synergyGains, upgradeKind, weaponStats, techNote, TAG_LABELS, DAMAGE_LABELS } from '../hud/model';
import { cx } from '../hud/widgets';
import { statGroups, buildIndicators, cardHeat, fmt1 } from './levelUpModel';
import { LevelUpStats } from './LevelUpStats';
import { FitToScreen } from './FitToScreen';

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

const deltaClass = (good?: boolean) => (good ? 'text-emerald-300' : 'text-red-400');

// --- Cartes ------------------------------------------------------------------------

interface CardProps {
  state: GameState;
  opt: UpgradeOption;
  index: number;
  preview: UpgradePreview;
  active: boolean;   // prévisualisée (survol, focus clavier ou sélection tactile)
  armed: boolean;    // tactile : premier appui fait, le second confirme
  onActivate: (how: 'hover' | 'focus' | null) => void;
  onPress: (pointerType: string) => void;
}

const OptionCard: React.FC<CardProps> = ({ state, opt, index, preview, active, armed, onActivate, onPress }) => {
  const accent = accentOf(opt);
  const gains = synergyGains(state, opt);
  const owned = opt.type === 'weapon' ? state.activeWeapons.find(w => w.id === opt.item.id) : undefined;
  const stats = opt.type === 'weapon' ? weaponStats(opt.item, owned ? owned.level + 1 : 1) : null;
  const pointerType = useRef('mouse');
  const dps = buildIndicators({ stats: preview.before, loadout: preview.loadoutBefore }, { stats: preview.after, loadout: preview.loadoutAfter })[0];
  const changedRows = statGroups(preview.before, preview.changes).flatMap(g => g.rows).filter(r => r.delta);
  const heat = cardHeat(preview, opt.type === 'weapon' ? opt.item.id : undefined);
  return (
    <button
      onPointerDown={e => { pointerType.current = e.pointerType; }}
      onPointerEnter={e => { if (e.pointerType === 'mouse') onActivate('hover'); }}
      onPointerLeave={e => { if (e.pointerType === 'mouse') onActivate(null); }}
      onFocus={e => { if (e.currentTarget.matches(':focus-visible')) onActivate('focus'); }}
      onBlur={() => onActivate(null)}
      onClick={() => onPress(pointerType.current)}
      className={cx(
        'group relative flex flex-col text-left p-4 bg-slate-900/80 border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300',
        active ? 'bg-slate-800/95 -translate-y-1' : 'border-white/10',
      )}
      style={{
        borderTopColor: accent,
        ...(active && { borderColor: accent + 'cc', borderTopColor: accent }),
        boxShadow: active ? `0 0 34px -10px ${accent}` : `0 -6px 30px -12px ${accent}`,
      }}
    >
      <span className="absolute top-3 right-3 w-8 h-8 border border-white/30 flex items-center justify-center font-mono font-bold text-[15px] text-white bg-black/40">
        {index + 1}
      </span>
      <span className="font-hud font-bold text-[13px] uppercase tracking-[0.12em] mb-2 pr-10" style={{ color: accent }}>
        {upgradeKind(state, opt)}
      </span>
      <h3 className="font-hud font-bold text-[22px] leading-tight text-white mb-2">
        {opt.type === 'keystone' && opt.item.icon ? `${opt.item.icon} ` : ''}{opt.item.name}
      </h3>
      <p className="font-hud text-[15px] leading-snug text-slate-200 mb-3">{opt.item.description}</p>

      {opt.type === 'weapon' && owned && techNote(opt.item, owned.level + 1) && (
        <div className="mb-3 px-3 py-1.5 border-l-[3px] bg-emerald-400/10" style={{ borderColor: '#34d399' }}>
          <span className="font-hud text-[12px] uppercase tracking-wider text-emerald-300">Bonus Tech {owned.level + 1}</span>
          <div className="font-hud font-bold text-[16px] text-white leading-snug">{techNote(opt.item, owned.level + 1)}</div>
        </div>
      )}
      {opt.type === 'weapon' && !owned && opt.item.techNotes && (
        <div className="mb-3 font-hud text-[13px] text-slate-300 leading-snug">
          {Array.from({ length: MAX_WEAPON_LEVEL - 1 }, (_, i) => i + 2).map(l => techNote(opt.item, l) && (
            <div key={l}><span className="font-mono text-slate-400">T{l}</span> {techNote(opt.item, l)}</div>
          ))}
        </div>
      )}

      {opt.type === 'weapon' && stats && (
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 mb-3 px-2 py-1.5 bg-black/30 border border-white/10">
          <Stat label="Type" value={<span style={{ color: DAMAGE_COLORS[opt.item.type] }}>{DAMAGE_LABELS[opt.item.type]}</span>} />
          <Stat label="Dégâts" value={stats.damage} />
          <Stat label="Tirs/s" value={stats.fireRate} />
          <Stat label="Portée" value={stats.range} />
        </div>
      )}

      {/* Coût thermique : toujours visible, c'est ce qui départage souvent deux choix */}
      {(heat.weapon || heat.sustain) && (
        <div className="mb-3 px-3 py-1.5 bg-orange-500/10 border-l-[3px] border-orange-400 flex flex-col gap-0.5">
          {heat.weapon && (
            <div className="font-hud text-[15px] text-white">
              {heat.weapon.unchanged ? (
                <>Chaleur <b className="font-mono">{fmt1(heat.weapon.after)}/s</b> <span className="text-emerald-300 font-semibold">inchangée</span></>
              ) : heat.weapon.before !== undefined ? (
                <>Chaleur <b className="font-mono">{fmt1(heat.weapon.before)} → {fmt1(heat.weapon.after)}/s</b></>
              ) : (
                <>Chaleur <b className="font-mono text-orange-300">+{fmt1(heat.weapon.after)}/s</b></>
              )}
            </div>
          )}
          {heat.sustain && (
            <div className="font-hud text-[14px] text-slate-200">
              Cadence soutenable <b className={cx('font-mono', deltaClass(heat.sustain.good))}>{heat.sustain.before} → {heat.sustain.after}</b>
            </div>
          )}
        </div>
      )}

      {/* Petit écran : l'effet sur les stats est résumé dans la carte (le panneau est plus haut) */}
      {(changedRows.length > 0 || dps.delta) && (
        <div className="lg:hidden mb-4 p-2 bg-black/30 border border-white/10 flex flex-col gap-0.5">
          <span className="font-hud text-[12px] uppercase tracking-wider text-slate-400">Effet sur vos stats</span>
          {dps.delta && (
            <div className="flex justify-between font-hud text-[14px]">
              <span className="text-slate-200">DPS estimé</span>
              <span className={cx('font-mono font-bold', deltaClass(dps.good))}>{dps.delta}</span>
            </div>
          )}
          {changedRows.map(r => (
            <div key={r.key} className="flex justify-between gap-2 font-hud text-[14px]">
              <span className="text-slate-200 truncate">{r.label}</span>
              <span className="font-mono font-bold whitespace-nowrap"><span className="text-white">{r.next}</span> <span className={deltaClass(r.good)}>{r.delta}</span></span>
            </div>
          ))}
        </div>
      )}

      {/* Les synergies résument les tags ; sans synergie concernée, on montre les tags bruts */}
      {gains.length === 0 && 'tags' in opt.item && opt.item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {opt.item.tags.map(t => (
            <span key={t} className="px-2 py-0.5 font-hud font-semibold text-[12px] uppercase tracking-wider bg-white/5 border border-white/20 text-slate-200">{TAG_LABELS[t]}</span>
          ))}
        </div>
      )}

      {gains.length > 0 && (
        <div className="mt-auto pt-2 border-t border-white/10 flex flex-col gap-1">
          {gains.map(g => (
            <div
              key={g.id}
              className="font-hud text-[14px] leading-snug truncate"
              title={g.unlocks ? `Débloque : ${g.unlocks}` : g.next ? `Palier ${g.next.count} : ${g.next.description}` : undefined}
            >
              <span className="font-bold uppercase" style={{ color: g.color }}>{g.name}</span>{' '}
              <span className="font-mono text-white">{g.from}{g.to !== g.from ? ` → ${g.to}` : ''}</span>
              {g.unlocks
                ? <span className="text-emerald-300 font-semibold"> · ✓ {g.unlocks}</span>
                : g.next && <span className="text-slate-400"> · à {g.next.count} : {g.next.description}</span>}
            </div>
          ))}
        </div>
      )}

      {armed && (
        <div className="mt-3 py-2 text-center bg-cyan-500 text-slate-950 font-hud font-bold text-[15px] uppercase tracking-wider">
          Toucher à nouveau pour choisir
        </div>
      )}
    </button>
  );
};

/** Largeur de mise en page du level-up sur bureau (px avant mise à l'échelle). */
const LEVELUP_WIDTH = 1200;

export const UpgradeMenu: React.FC<UpgradeMenuProps> = ({ state, options, onSelect }) => {
  // Un seul choix par tirage (évite le double clic / la répétition de touche)
  const locked = useRef(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [armed, setArmed] = useState<number | null>(null);
  useEffect(() => {
    locked.current = false;
    setHovered(null);
    setFocused(null);
    setArmed(null);
  }, [options]);
  const choose = (opt: UpgradeOption) => {
    if (locked.current) return;
    locked.current = true;
    onSelect(opt);
  };

  // Prévisualisations calculées une fois par tirage (fonctions pures du moteur, l'état n'est pas modifié)
  const previews = useMemo(() => options.map(o => previewUpgrade(state, o)), [options]); // eslint-disable-line react-hooks/exhaustive-deps
  const active = hovered ?? focused ?? armed;
  const activePreview = active !== null ? previews[active] : undefined;

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

  // Tactile : premier appui = aperçu, second appui sur la même carte = choix
  const press = (i: number, pointerType: string) => {
    if (pointerType === 'touch' && armed !== i) { setArmed(i); return; }
    choose(options[i]);
  };

  if (previews.length === 0) return null;
  const base = previews[0]; // « avant » commun à toutes les options (stats hors bonus temporaires)
  const reserve = [...new Set(previews.flatMap(p => p.changes.map(c => c.key)))];

  return (
    <div className="absolute inset-0 z-50 flex items-[safe_center] justify-center bg-slate-950/90 backdrop-blur-md p-3 lg:p-4 overflow-y-auto">
      {/* Bureau : l'écran entier est mis à l'échelle pour tenir sans défilement (voir FitToScreen) */}
      <FitToScreen width={LEVELUP_WIDTH}>
        <div className="flex flex-wrap justify-between items-end gap-2 mb-3 sm:mb-4 border-b border-white/15 pb-2">
          <div className="flex flex-wrap items-baseline gap-x-4">
            <h2 className="font-orbitron font-black text-[24px] sm:text-[30px] text-white uppercase leading-tight">Choisissez une amélioration</h2>
            <span className="font-hud font-semibold text-[14px] uppercase tracking-[0.2em] text-violet-300">Niveau {state.level + 1} atteint</span>
          </div>
          <span className="font-hud text-[14px] text-slate-300">
            <span className="hidden sm:inline">Clic ou touches <b className="text-white">1</b> <b className="text-white">2</b> <b className="text-white">3</b></span>
            <span className="sm:hidden">Touchez une carte pour l'aperçu, puis touchez-la à nouveau pour choisir</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4 mb-3 items-start">
          {options.map((opt, i) => (
            <OptionCard
              key={`${opt.type}-${opt.item.id}`}
              state={state}
              opt={opt}
              index={i}
              preview={previews[i]}
              active={active === i}
              armed={armed === i}
              onActivate={how => {
                if (how === 'hover') setHovered(i);
                else if (how === 'focus') setFocused(i);
                else {
                  setHovered(h => (h === i ? null : h));
                  setFocused(f => (f === i ? null : f));
                }
              }}
              onPress={t => press(i, t)}
            />
          ))}
        </div>

        <LevelUpStats
          base={base}
          preview={activePreview}
          accent={active !== null ? accentOf(options[active]) : undefined}
          previewName={active !== null ? options[active].item.name : undefined}
          reserve={reserve}
        />
      </FitToScreen>
    </div>
  );
};
