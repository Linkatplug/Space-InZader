import React, { useEffect, useState } from 'react';
import { GameState, ActiveAbility } from '../types';
import { DAMAGE_COLORS } from '../constants';
import { MAX_WEAPON_LEVEL } from '../engine/Progression';
import {
  HudLayout, HudSize, hudLayout, formatClock, ratio, heatInfo, HeatInfo, weaponSlots, WeaponSlot,
  synergyRows, SynergyRow, keystoneInfo, bossIncoming, bossInfo, activeBuffs, eventView, weaponAbbrev,
} from './hud/model';
import { Label, Num, Meter, Pips, cx } from './hud/widgets';

/**
 * HUD en jeu, pensé pour laisser le terrain visible : blocs petits, semi-transparents, collés aux bords.
 *  - bureau : l'échelle suit la hauteur de la fenêtre (×1.15 en 1080p) et l'option « Taille du HUD » ;
 *  - compacte : téléphone / petite fenêtre, en bandeaux haut et bas.
 * Voir `hudLayout` (components/hud/model.ts). Tailles minimales : 13 px avant échelle (≥ 12 px réels).
 */

export const useHudLayout = (size: HudSize = 'normal'): HudLayout => {
  const compute = () => hudLayout(window.innerWidth, window.innerHeight, size);
  const [layout, setLayout] = useState(compute);
  useEffect(() => {
    const onResize = () => setLayout(compute());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [size]); // eslint-disable-line react-hooks/exhaustive-deps
  return layout;
};

const COLORS = {
  shield: '#22d3ee',
  armor: '#f59e0b',
  hull: '#ef4444',
  xp: '#a78bfa',
  wave: '#22d3ee',
};

const HEAT_STYLE: Record<HeatInfo['level'], { color: string; text: string }> = {
  ok: { color: '#38bdf8', text: 'Stable' },
  warm: { color: '#f59e0b', text: 'Chaude' },
  throttled: { color: '#f97316', text: 'Bridage' },
  critical: { color: '#f97316', text: 'Critique' },
  overheated: { color: '#ef4444', text: 'Surchauffe' },
};

/** Fond commun des blocs : sombre mais transparent pour voir les ennemis derrière, contour fin. */
const GLASS = 'bg-slate-950/45 border border-white/10';

// --- Haut gauche : niveau / XP / score -------------------------------------------

const PilotBlock: React.FC<{ state: GameState }> = ({ state }) => (
  <div className={cx(GLASS, 'w-[230px] px-2 py-1.5 flex gap-2 items-center')}>
    <div className="shrink-0 flex flex-col items-center leading-none px-1">
      <Label className="text-violet-200">Niv</Label>
      <Num className="text-[20px] mt-0.5">{state.level}</Num>
    </div>
    <div className="flex-1 min-w-0 flex flex-col gap-1">
      <Meter value={ratio(state.experience, state.expToNextLevel)} color={COLORS.xp} height={8} />
      <div className="flex justify-between items-baseline">
        <Num className="text-[13px] text-amber-300">{state.score.toLocaleString('fr-FR')}</Num>
        {state.autoFire && <Label className="text-cyan-300">Tir auto</Label>}
      </div>
    </div>
  </div>
);

// --- Haut centre : vague, boss, événement -----------------------------------------

const WaveBlock: React.FC<{ state: GameState }> = ({ state }) => {
  const boss = bossIncoming(state);
  return (
    <div className={cx(GLASS, 'w-[420px] px-3 py-1.5')}>
      <div className="flex items-center gap-3">
        <span className="flex items-baseline gap-1.5 shrink-0">
          <Label className="text-cyan-300">Vague</Label>
          <span className="font-orbitron font-black text-[22px] leading-none text-cyan-300">{state.wave}</span>
        </span>
        <Meter value={ratio(state.waveKills, state.waveQuota)} color={boss ? '#facc15' : COLORS.wave} height={8} className="flex-1" />
        <Num className="text-[14px] shrink-0">{state.waveKills}<span className="text-slate-400">/{state.waveQuota}</span></Num>
      </div>
      <div className="flex justify-between items-baseline mt-1">
        <Num className="text-[13px] text-slate-300">{formatClock(state.time)}</Num>
        {boss && <Label className="text-amber-300">⚠ Boss à la vague {state.wave + 1}</Label>}
        <span className="font-hud text-[13px] text-slate-300"><Num className="text-[13px]">{state.totalKills}</Num> élim.</span>
      </div>
    </div>
  );
};

const BossBar: React.FC<{ state: GameState; width: number }> = ({ state, width }) => {
  const boss = bossInfo(state);
  if (!boss) return null;
  return (
    <div style={{ width }} className="flex flex-col gap-0.5">
      <div className="flex justify-between items-baseline">
        <span className="flex items-center gap-2">
          <span className="font-orbitron font-bold text-[13px] uppercase tracking-wider" style={{ color: boss.color }}>☠ {boss.name}</span>
          {boss.enraged && <span className="font-hud font-bold text-[13px] uppercase px-1 bg-red-600 text-white animate-hud-blink leading-tight">Enragé</span>}
        </span>
        <Num className="text-[13px]">{Math.ceil(boss.ratio * 100)}%</Num>
      </div>
      <Meter value={boss.ratio} color={boss.enraged ? '#ef4444' : boss.color} height={8} />
    </div>
  );
};

/**
 * Événement : description pendant l'alerte et les premières secondes, puis simple rappel
 * (nom + compte à rebours). Toujours petit et collé au bloc de vague, jamais sur le terrain.
 */
const EventChip: React.FC<{ state: GameState }> = ({ state }) => {
  const ev = eventView(state);
  if (!ev) return null;
  return (
    <div className={cx('bg-slate-950/55 border-l-[3px] px-2.5 py-1 max-w-[420px]', !ev.started && 'animate-pulse')} style={{ borderColor: ev.color }}>
      <div className="flex items-baseline gap-2">
        <span className="font-hud font-bold uppercase text-[13px] tracking-wide" style={{ color: ev.color }}>
          {ev.started ? ev.name : `⚠ ${ev.name}`}
        </span>
        <Num className="text-[13px] text-white">{ev.started ? `${ev.seconds} s` : `dans ${ev.seconds} s`}</Num>
      </div>
      {ev.showDetail && <div className="font-hud text-[13px] text-slate-200 leading-snug">{ev.description}</div>}
    </div>
  );
};

// --- Haut droite : keystones (pastilles) + synergies (une ligne chacune) ----------

const Tooltip: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <div className="hidden group-hover:block absolute right-full top-0 mr-2 w-[250px] p-2.5 bg-slate-950/95 border font-hud text-[13px] text-slate-100 leading-snug z-10" style={{ borderColor: color }}>
    {children}
  </div>
);

const KeystonePill: React.FC<{ state: GameState; k: GameState['keystones'][number] }> = ({ state, k }) => {
  const info = keystoneInfo(state, k);
  const color = k.color ?? '#fbbf24';
  return (
    <div
      className="group relative w-[30px] h-[30px] flex items-center justify-center border bg-slate-950/50"
      style={{ borderColor: info.active ? color : color + '55', boxShadow: info.active ? `0 0 8px ${color}88` : undefined, opacity: info.active ? 1 : 0.6 }}
    >
      <span className="text-[15px] leading-none">{k.icon}</span>
      {info.kind === 'scaling' && (
        <span className="absolute -bottom-1.5 -right-1.5 font-mono font-bold text-[13px] leading-none px-0.5 bg-slate-950 text-white border border-white/20">{info.value}</span>
      )}
      <Tooltip color={color}>
        <div className="font-bold uppercase mb-0.5" style={{ color }}>{k.icon} {k.name}</div>
        {k.description}
        <div className={cx('mt-1 font-semibold', info.active ? 'text-emerald-300' : 'text-slate-400')}>
          {info.kind === 'scaling' ? `${info.value} / ${info.max} ${info.label}`
            : info.kind === 'conditional' ? (info.active ? 'Active' : `Inactive — si ${info.label}`)
            : 'Permanente'}
        </div>
      </Tooltip>
    </div>
  );
};

const SynergyLine: React.FC<{ row: SynergyRow }> = ({ row }) => (
  <div className={cx('group relative flex items-center gap-2 px-1.5 py-[3px] bg-slate-950/40 border-l-2', !row.current && 'opacity-75')} style={{ borderColor: row.color }}>
    <span className="font-hud font-bold uppercase text-[13px] tracking-wide flex-1 truncate" style={{ color: row.color }}>{row.name}</span>
    {/* Une case par objet ; les paliers sont soulignés */}
    <span className="flex gap-[2px]">
      {Array.from({ length: row.maxCount }, (_, i) => {
        const tier = row.tiers.some(t => t.count === i + 1);
        return (
          <span key={i} className="w-[6px] h-[11px]" style={{
            backgroundColor: i < row.count ? row.color : 'rgba(255,255,255,0.14)',
            boxShadow: tier ? 'inset 0 -3px 0 rgba(255,255,255,0.9)' : undefined,
          }} />
        );
      })}
    </span>
    <Tooltip color={row.color}>
      <div className="font-bold uppercase mb-1" style={{ color: row.color }}>{row.name} — {row.count} objet{row.count > 1 ? 's' : ''}</div>
      {row.tiers.map(t => (
        <div key={t.count} className={cx('flex gap-2', t.active ? 'text-white' : 'text-slate-400')}>
          <span className="font-mono w-5 shrink-0">{t.active ? '✓' : t.count}</span>
          <span>{t.description}</span>
        </div>
      ))}
    </Tooltip>
  </div>
);

const BuildBlock: React.FC<{ state: GameState; maxRows?: number }> = ({ state, maxRows = 8 }) => {
  const rows = synergyRows(state).slice(0, maxRows);
  if (rows.length === 0 && state.keystones.length === 0) return null;
  return (
    <div className="flex flex-col items-end gap-1 pointer-events-auto w-[190px]">
      {state.keystones.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1.5 mb-0.5">
          {state.keystones.map(k => <KeystonePill key={k.id} state={state} k={k} />)}
        </div>
      )}
      {rows.map(r => <div key={r.id} className="w-full"><SynergyLine row={r} /></div>)}
    </div>
  );
};

// --- Bas gauche : défenses, compétences, bonus ---------------------------------

const DefenseRow: React.FC<{ label: string; value: number; max: number; color: string; blink?: boolean }> = ({ label, value, max, color, blink }) => (
  <div className="flex items-center gap-2">
    <Label className="w-[72px] shrink-0" style={{ color }}>{label}</Label>
    <Meter value={ratio(value, max)} color={color} height={8} blink={blink} className="flex-1" />
    <Num className="text-[13px] w-[64px] text-right shrink-0">
      {Math.ceil(Math.max(0, value))}<span className="text-slate-400">/{Math.round(max)}</span>
    </Num>
  </div>
);

const DefenseBlock: React.FC<{ state: GameState; width: number }> = ({ state, width }) => {
  const { defense, runtimeStats, isGodMode } = state.player;
  const lowHull = ratio(defense.hull, runtimeStats.maxHull) <= 0.3;
  return (
    <div className={cx(GLASS, 'px-2 py-1.5 flex flex-col gap-1')} style={{ width }}>
      {isGodMode && <Label className="text-amber-300">★ Mode dieu</Label>}
      <DefenseRow label="Bouclier" value={defense.shield} max={runtimeStats.maxShield} color={COLORS.shield} />
      <DefenseRow label="Armure" value={defense.armor} max={runtimeStats.maxArmor} color={COLORS.armor} />
      <DefenseRow label="Coque" value={defense.hull} max={runtimeStats.maxHull} color={COLORS.hull} blink={lowHull} />
    </div>
  );
};

/** Libellé court d'une touche (« shift » → « ⇧ ») pour tenir dans le coin d'une pastille. */
const keyLabel = (key: string) => (key.toLowerCase() === 'shift' ? '⇧' : key.toUpperCase());

const AbilitySlot: React.FC<{ ability: ActiveAbility; size?: number }> = ({ ability, size = 40 }) => {
  const ready = ability.currentCooldown <= 0;
  const remaining = ratio(ability.currentCooldown, ability.cooldown);
  return (
    <div
      className={cx('relative flex items-center justify-center bg-slate-950/50 border overflow-hidden', ready ? 'border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'border-slate-600')}
      style={{ width: size, height: size }}
      title={`${ability.name} — ${ability.description}`}
    >
      <span className={cx('text-[18px]', !ready && 'opacity-40')}>{ability.icon}</span>
      {!ready && (
        <>
          <div className="absolute left-0 right-0 bottom-0 bg-cyan-400/25" style={{ height: `${(1 - remaining) * 100}%` }} />
          <Num className="absolute text-[14px] drop-shadow-[0_1px_2px_black]">{Math.ceil(ability.currentCooldown)}</Num>
        </>
      )}
      <span className="absolute bottom-0 right-0 bg-white/90 text-black font-hud font-bold text-[13px] px-0.5 leading-none uppercase">{keyLabel(ability.key)}</span>
    </div>
  );
};

/** Bonus temporaires des compétences : petite jauge + secondes restantes. */
const BuffList: React.FC<{ state: GameState }> = ({ state }) => {
  const buffs = activeBuffs(state);
  if (buffs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {buffs.map(b => (
        <div key={b.id} className={cx('flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-950/55 border-l-2', b.remaining < 1.5 && 'animate-hud-blink')} style={{ borderColor: b.color }}>
          <span className="font-hud font-bold uppercase text-[13px]" style={{ color: b.color }}>{b.name}</span>
          <Num className="text-[13px]">{b.remaining.toFixed(1)}s</Num>
        </div>
      ))}
    </div>
  );
};

// --- Bas centre : armes (une rangée de pastilles) --------------------------------

/** En dessous de ce délai de recharge, la barre clignoterait en permanence : on l'affiche pleine. */
const FAST_WEAPON_MS = 250;

const WeaponPill: React.FC<{ slot: WeaponSlot; overheated: boolean }> = ({ slot, overheated }) => {
  const { weapon } = slot;
  const color = DAMAGE_COLORS[weapon.type];
  const readiness = overheated ? 0 : slot.cooldownMs < FAST_WEAPON_MS ? 1 : slot.readiness;
  const ready = readiness >= 1;
  return (
    <div
      className={cx('relative w-[52px] h-[34px] bg-slate-950/50 border flex flex-col items-center justify-center', overheated && 'opacity-50')}
      style={{ borderColor: ready ? color + 'bb' : 'rgba(255,255,255,0.15)' }}
      title={`${weapon.name} — Tech ${weapon.level}`}
    >
      <span className="font-hud font-bold text-[13px] leading-none" style={{ color }}>{weaponAbbrev(weapon.name)}</span>
      <span className="mt-[3px]"><Pips value={weapon.level} max={MAX_WEAPON_LEVEL} color={color} size={5} /></span>
      <div className="absolute left-0 bottom-0 h-[3px]" style={{ width: `${readiness * 100}%`, backgroundColor: ready ? color : '#64748b' }} />
    </div>
  );
};

const WeaponRow: React.FC<{ state: GameState; compact?: boolean }> = ({ state }) => {
  const slots = weaponSlots(state).filter((s): s is WeaponSlot => !!s);
  return (
    <div className="flex gap-1">
      {slots.map(s => <WeaponPill key={s.weapon.id} slot={s} overheated={state.isOverheated} />)}
    </div>
  );
};

// --- Bas droite : chaleur + série ------------------------------------------------

const HeatBlock: React.FC<{ state: GameState; width: number }> = ({ state, width }) => {
  const heat = heatInfo(state);
  const style = HEAT_STYLE[heat.level];
  const over = heat.level === 'overheated';
  const alarm = over || heat.level === 'critical';
  return (
    <div className={cx(GLASS, 'px-2 py-1.5')} style={{ width }}>
      <div className="flex items-center gap-2">
        <Label className="shrink-0" style={{ color: alarm ? style.color : undefined }}>Chaleur</Label>
        <div className="relative flex-1">
          <Meter
            value={heat.ratio}
            color={style.color}
            height={9}
            blink={over}
            markers={over ? [heat.recovery] : [heat.throttleStart]}
            track={over ? '#3b0a0a' : undefined}
          />
          {/* Zone de bridage : au-delà, la cadence de tir baisse */}
          {!over && (
            <div
              className="absolute top-0 bottom-0 right-0 pointer-events-none"
              style={{ left: `${heat.throttleStart * 100}%`, backgroundImage: 'repeating-linear-gradient(135deg, rgba(249,115,22,0.35) 0 3px, transparent 3px 7px)' }}
            />
          )}
        </div>
        <Num className="text-[14px] w-[40px] text-right shrink-0" style={{ color: style.color }}>{heat.percent}%</Num>
      </div>
      {(over || heat.ratePenalty > 0) && (
        <div className={cx('font-hud font-bold text-[13px] mt-0.5', over ? 'text-red-300 animate-hud-blink' : 'text-orange-300')}>
          {over ? `${style.text} — reprise à ${Math.round(heat.recovery * 100)}%` : `${style.text} : cadence −${heat.ratePenalty} %`}
        </div>
      )}
    </div>
  );
};

const ComboBadge: React.FC<{ state: GameState }> = ({ state }) => {
  if (state.comboCount <= 0) return null;
  return (
    <div className="flex flex-col items-end w-[110px]">
      <div className="flex items-baseline gap-1.5">
        <Label className="text-cyan-300">Série</Label>
        <span key={state.comboCount} className="font-orbitron font-black italic text-white text-[22px] leading-none animate-hud-pop">×{state.comboCount}</span>
      </div>
      <Meter value={ratio(state.comboTimer, state.player.runtimeStats.comboWindow)} color="#22d3ee" height={3} className="mt-0.5" />
    </div>
  );
};

// --- Alertes ---------------------------------------------------------------------

/** Surchauffe : bandeau court sous le vaisseau (le bas-centre est déjà occupé par les armes, plus bas). */
const CenterAlert: React.FC<{ state: GameState }> = ({ state }) => {
  const heat = heatInfo(state);
  if (heat.level !== 'overheated' && heat.level !== 'critical') return null;
  const over = heat.level === 'overheated';
  return (
    <div className="absolute left-0 right-0 flex justify-center" style={{ top: '64%' }}>
      <div className={cx('flex items-baseline gap-2 px-3 py-1', over ? 'bg-slate-950/60 border border-red-500 animate-hud-blink' : 'bg-slate-950/35')}>
        <span className={cx('font-orbitron font-black uppercase tracking-[0.12em]', over ? 'text-[18px] text-red-400' : 'text-[14px] text-orange-300')}>
          {over ? '⚠ Surchauffe' : `Cadence −${heat.ratePenalty} %`}
        </span>
        <span className="font-hud font-semibold text-[13px] text-white/90">
          {over ? `armes coupées — reprise à ${Math.round(heat.recovery * 100)}%` : 'chaleur critique'}
        </span>
      </div>
    </div>
  );
};

/** Bordure rouge pulsante quand la coque est basse (hors échelle, plein écran). */
const LowHullVignette: React.FC<{ state: GameState }> = ({ state }) => {
  const { defense, runtimeStats, isGodMode } = state.player;
  if (isGodMode || ratio(defense.hull, runtimeStats.maxHull) > 0.3) return null;
  return <div className="absolute inset-0 animate-pulse" style={{ boxShadow: 'inset 0 0 120px 20px rgba(239,68,68,0.45)' }} />;
};

// --- Dispositions -------------------------------------------------------------

const DesktopHUD: React.FC<{ state: GameState }> = ({ state }) => (
  <>
    <div className="absolute top-2 left-2"><PilotBlock state={state} /></div>

    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
      <WaveBlock state={state} />
      <BossBar state={state} width={420} />
      <EventChip state={state} />
    </div>

    <div className="absolute top-2 right-2"><BuildBlock state={state} /></div>

    <div className="absolute bottom-2 left-2 flex flex-col gap-1.5">
      <BuffList state={state} />
      <div className="flex items-end gap-1.5">
        <DefenseBlock state={state} width={244} />
        <div className="flex flex-col gap-1.5">
          {state.activeAbilities.map(a => <AbilitySlot key={a.id} ability={a} />)}
        </div>
      </div>
    </div>

    <div className="absolute bottom-2 left-1/2 -translate-x-1/2"><WeaponRow state={state} /></div>

    <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1.5">
      <ComboBadge state={state} />
      <HeatBlock state={state} width={220} />
    </div>

    <CenterAlert state={state} />
  </>
);

const CompactHUD: React.FC<{ state: GameState; layout: HudLayout; touch: boolean }> = ({ state, layout, touch }) => {
  const boss = bossIncoming(state);
  const wide = layout.width >= 640;
  return (
    <>
      {/* Bandeau haut (à droite : place pour le bouton pause tactile) */}
      <div className="absolute top-1.5 left-1.5 flex flex-col gap-1" style={{ right: touch ? 58 : 6 }}>
        <div className={cx(GLASS, 'px-2 py-1 flex flex-col gap-1')}>
          <div className="flex items-center gap-2">
            <Label className="text-cyan-300">Vague</Label>
            <span className="font-orbitron font-black text-[18px] leading-none text-cyan-300">{state.wave}</span>
            <Meter value={ratio(state.waveKills, state.waveQuota)} color={boss ? '#facc15' : COLORS.wave} height={7} className="flex-1" />
            <Num className="text-[13px]">{state.waveKills}/{state.waveQuota}</Num>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-violet-200">Niv</Label>
            <Num className="text-[14px]">{state.level}</Num>
            <Meter value={ratio(state.experience, state.expToNextLevel)} color={COLORS.xp} height={5} className="flex-1" />
            <Num className="text-[13px] text-slate-300">{formatClock(state.time)}</Num>
          </div>
          {boss && <Label className="text-amber-300 text-center">⚠ Boss à la vague {state.wave + 1}</Label>}
        </div>
        {bossInfo(state) && <BossBar state={state} width={Math.min(360, layout.width - 76)} />}
        <EventChip state={state} />
        <div className="self-end flex flex-col items-end gap-1.5" style={{ marginRight: touch ? 36 : 0 }}>
          <ComboBadge state={state} />
          {wide && <BuildBlock state={state} maxRows={5} />}
        </div>
      </div>

      {/* Bas gauche : armes, défenses, chaleur (à droite : place pour les boutons tactiles) */}
      <div className="absolute bottom-1.5 left-1.5 flex flex-col gap-1.5 w-[220px]">
        <BuffList state={state} />
        <WeaponRow state={state} />
        <DefenseBlock state={state} width={220} />
        <HeatBlock state={state} width={220} />
      </div>

      {!touch && (
        <div className="absolute bottom-1.5 right-1.5 flex gap-1.5">
          {state.activeAbilities.map(a => <AbilitySlot key={a.id} ability={a} size={42} />)}
        </div>
      )}

      <CenterAlert state={state} />
    </>
  );
};

export const HUD: React.FC<{ state: GameState; touch?: boolean; size?: HudSize }> = ({ state, touch = false, size = 'normal' }) => {
  const layout = useHudLayout(size);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      <LowHullVignette state={state} />
      <div
        className="absolute top-0 left-0"
        style={{
          width: layout.width,
          height: layout.height,
          transform: `scale(${layout.scale})`,
          transformOrigin: 'top left',
          padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
          boxSizing: 'border-box',
        }}
      >
        <div className="relative w-full h-full">
          {layout.compact ? <CompactHUD state={state} layout={layout} touch={touch} /> : <DesktopHUD state={state} />}
        </div>
      </div>
    </div>
  );
};
