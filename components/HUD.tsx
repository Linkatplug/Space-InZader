import React, { useEffect, useState } from 'react';
import { GameState, ActiveAbility } from '../types';
import { DAMAGE_COLORS } from '../constants';
import { EVENTS } from '../data/events';
import { MAX_WEAPON_LEVEL } from '../engine/Progression';
import {
  HudLayout, hudLayout, formatClock, ratio, heatInfo, HeatInfo, weaponSlots, WeaponSlot,
  synergyRows, SynergyRow, keystoneInfo, bossIncoming, bossInfo, activeBuffs,
} from './hud/model';
import { Panel, Label, Num, Meter, Pips, cx } from './hud/widgets';

/**
 * HUD en jeu. Deux dispositions :
 *  - bureau : dessinée pour 1280×720 puis agrandie (×1.5 en 1080p, ×2 en 1440p) ;
 *  - compacte : téléphone / petite fenêtre, en bandeaux haut et bas.
 * Voir `hudLayout` (components/hud/model.ts) pour le choix de l'échelle.
 */

export const useHudLayout = (): HudLayout => {
  const [layout, setLayout] = useState(() => hudLayout(window.innerWidth, window.innerHeight));
  useEffect(() => {
    const onResize = () => setLayout(hudLayout(window.innerWidth, window.innerHeight));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
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
  critical: { color: '#f97316', text: 'Critique !' },
  overheated: { color: '#ef4444', text: 'Surchauffe' },
};

// --- Haut : pilote (niveau / XP / score) ------------------------------------

const PilotPanel: React.FC<{ state: GameState }> = ({ state }) => (
  <Panel className="w-[280px] p-2.5 flex gap-3 items-center" accent={COLORS.xp}>
    <div className="w-[52px] h-[52px] shrink-0 border-2 flex flex-col items-center justify-center bg-violet-500/10" style={{ borderColor: COLORS.xp }}>
      <Label className="text-[12px] text-violet-200">Niv</Label>
      <Num className="text-[24px] mt-0.5">{state.level}</Num>
    </div>
    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <Label>Expérience</Label>
        <Num className="text-[13px] text-violet-100">{Math.floor(state.experience)} / {state.expToNextLevel}</Num>
      </div>
      <Meter value={ratio(state.experience, state.expToNextLevel)} color={COLORS.xp} height={12} />
      <div className="flex justify-between items-baseline">
        <Label>Score <Num className="text-[14px] text-amber-300 ml-1">{state.score.toLocaleString('fr-FR')}</Num></Label>
        {state.autoFire && <Label className="text-[12px] text-cyan-300 border border-cyan-400/50 px-1.5 py-0.5">Tir auto</Label>}
      </div>
    </div>
  </Panel>
);

// --- Haut : vague -------------------------------------------------------------

const WavePanel: React.FC<{ state: GameState }> = ({ state }) => {
  const boss = bossIncoming(state);
  return (
    <Panel className="w-[440px] px-4 pt-2 pb-3">
      <div className="grid grid-cols-3 items-end mb-2">
        <div className="flex flex-col items-start gap-1">
          <Label className="text-[12px]">Temps</Label>
          <Num className="text-[20px]">{formatClock(state.time)}</Num>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Label className="text-[12px] text-cyan-300">Vague</Label>
          <span className="font-orbitron font-black text-[34px] leading-none text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)]">{state.wave}</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Label className="text-[12px]">Éliminations</Label>
          <Num className="text-[20px]">{state.totalKills}</Num>
        </div>
      </div>
      <div className="flex justify-between items-baseline mb-1">
        <Label className="text-[12px]">Objectif de vague</Label>
        <Num className="text-[15px]">{state.waveKills} <span className="text-slate-400">/ {state.waveQuota}</span></Num>
      </div>
      <Meter value={ratio(state.waveKills, state.waveQuota)} color={boss ? '#facc15' : COLORS.wave} height={12} />
      {boss && (
        <div className="mt-1.5 text-center">
          <Label className="text-amber-300 text-[13px]">⚠ Boss à la vague {state.wave + 1}</Label>
        </div>
      )}
    </Panel>
  );
};

const BossBar: React.FC<{ state: GameState; width: number }> = ({ state, width }) => {
  const boss = bossInfo(state);
  if (!boss) return null;
  return (
    <div style={{ width }} className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <span className="flex items-center gap-2">
          <span className="font-orbitron font-bold text-[15px] uppercase tracking-wider" style={{ color: boss.color }}>☠ {boss.name}</span>
          {boss.enraged && <span className="font-hud font-bold text-[12px] uppercase px-1.5 py-0.5 bg-red-600 text-white animate-hud-blink">Enragé</span>}
        </span>
        <Num className="text-[14px]">{Math.ceil(boss.ratio * 100)}%</Num>
      </div>
      <Meter value={boss.ratio} color={boss.enraged ? '#ef4444' : boss.color} height={14} />
    </div>
  );
};

const EventBanner: React.FC<{ state: GameState; compact?: boolean }> = ({ state, compact }) => {
  const ev = state.activeEvents[0];
  if (!ev) return null;
  const def = EVENTS[ev.type];
  return (
    <div
      className={cx('border-2 bg-slate-950/85 text-center', compact ? 'px-3 py-1.5' : 'px-5 py-2', !ev.started && 'animate-pulse')}
      style={{ borderColor: def.color }}
    >
      <div className={cx('font-hud font-bold uppercase leading-tight', compact ? 'text-[14px] tracking-[0.06em]' : 'text-[16px] tracking-[0.12em]')} style={{ color: def.color }}>
        {ev.started ? def.name : `⚠ ${def.name} dans ${Math.ceil(ev.warning)} s`}
        {ev.started && <Num className="text-white ml-3 text-[15px]">{Math.ceil(ev.duration)} s</Num>}
      </div>
      <div className={cx('font-hud text-slate-200 mt-0.5', compact ? 'text-[12px]' : 'text-[13px]')}>{def.description}</div>
    </div>
  );
};

// --- Haut droite : keystones + synergies -------------------------------------

const SynergyTooltip: React.FC<{ row: SynergyRow }> = ({ row }) => (
  <div className="hidden group-hover:block absolute right-full top-0 mr-2 w-[260px] p-3 bg-slate-950/95 border z-10" style={{ borderColor: row.color }}>
    <div className="font-hud font-bold uppercase text-[14px] mb-2" style={{ color: row.color }}>{row.name} — {row.count} objet{row.count > 1 ? 's' : ''}</div>
    {row.tiers.map(t => (
      <div key={t.count} className={cx('flex gap-2 font-hud text-[13px] leading-snug mb-1', t.active ? 'text-white' : 'text-slate-400')}>
        <span className="font-mono w-6 shrink-0">{t.active ? '✓' : t.count}</span>
        <span>{t.description}</span>
      </div>
    ))}
    <div className="font-hud text-[12px] text-slate-400 mt-2">Chaque arme ou module portant un tag de la synergie compte pour 1.</div>
  </div>
);

const SynergyLine: React.FC<{ row: SynergyRow; compact?: boolean }> = ({ row, compact }) => {
  const active = !!row.current;
  return (
    <div className={cx('group relative px-2.5 py-1.5 border-l-[3px] bg-slate-950/75', !active && 'opacity-80')} style={{ borderColor: row.color }}>
      <div className="flex items-center gap-2">
        <span className="font-hud font-bold uppercase text-[14px] tracking-wide flex-1 truncate" style={{ color: row.color }}>{row.name}</span>
        {/* Une case par objet, les paliers sont soulignés */}
        <span className="flex gap-[2px]">
          {Array.from({ length: row.maxCount }, (_, i) => {
            const tier = row.tiers.some(t => t.count === i + 1);
            return (
              <span key={i} className="w-[7px] h-[12px]" style={{
                backgroundColor: i < row.count ? row.color : 'rgba(255,255,255,0.12)',
                boxShadow: tier ? 'inset 0 -3px 0 rgba(255,255,255,0.9)' : undefined,
              }} />
            );
          })}
        </span>
        <Num className="text-[13px] w-8 text-right">{row.count}{row.next ? `/${row.next.count}` : '★'}</Num>
      </div>
      {!compact && (
        <div className="font-hud text-[12.5px] leading-snug mt-0.5 truncate">
          {active
            ? <span className="text-white">✓ {row.current}</span>
            : <span className="text-slate-400">À {row.next?.count} : {row.next?.description}</span>}
        </div>
      )}
      {!compact && <SynergyTooltip row={row} />}
    </div>
  );
};

const BuildPanel: React.FC<{ state: GameState; compact?: boolean; maxHeight?: number }> = ({ state, compact, maxHeight }) => {
  const rows = synergyRows(state);
  if (rows.length === 0 && state.keystones.length === 0) return null;
  return (
    <div className={cx('flex flex-col gap-1 pointer-events-auto', compact ? 'w-[220px] overflow-hidden' : 'w-[270px]')} style={{ maxHeight }}>
      {state.keystones.map(k => {
        const info = keystoneInfo(state, k);
        const color = k.color ?? '#fbbf24';
        return (
          <div key={k.id} className="group relative px-2.5 py-1.5 bg-slate-950/80 border" style={{ borderColor: color + (info.active ? 'cc' : '55') }}>
            <div className="flex items-center gap-2">
              <span className="text-[15px]">{k.icon}</span>
              <span className="font-hud font-bold uppercase text-[14px] tracking-wide flex-1 truncate" style={{ color }}>{k.name}</span>
              {info.kind === 'scaling' && <Num className="text-[13px]">{info.value}/{info.max}</Num>}
              {info.kind === 'conditional' && compact && (
                <span className={cx('w-2.5 h-2.5 rounded-full shrink-0', info.active ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'border border-slate-400')} />
              )}
              {info.kind === 'conditional' && !compact && (
                <span className={cx('font-hud font-bold text-[11.5px] uppercase px-1.5 py-0.5', info.active ? 'bg-emerald-400 text-black' : 'text-slate-400 border border-white/20')}>
                  {info.active ? 'Actif' : 'Inactif'}
                </span>
              )}
            </div>
            {!compact && info.kind === 'conditional' && !info.active && (
              <div className="font-hud text-[12.5px] text-slate-400 mt-0.5">Si {info.label}</div>
            )}
            {!compact && (
              <div className="hidden group-hover:block absolute right-full top-0 mr-2 w-[260px] p-3 bg-slate-950/95 border font-hud text-[13px] text-slate-100 leading-snug z-10" style={{ borderColor: color }}>
                <div className="font-bold uppercase mb-1" style={{ color }}>{k.icon} {k.name}</div>
                {k.description}
              </div>
            )}
          </div>
        );
      })}
      {rows.length > 0 && (
        <div className="flex justify-between items-baseline mt-1 px-0.5">
          <Label className="text-[12px] text-slate-300">Synergies</Label>
          {!compact && <span className="font-hud text-[12px] text-slate-400">survoler : détails</span>}
        </div>
      )}
      {rows.map(r => <SynergyLine key={r.id} row={r} compact={compact} />)}
    </div>
  );
};

// --- Bas gauche : défenses + compétences --------------------------------------

const DefenseRow: React.FC<{ label: string; value: number; max: number; color: string; height: number; compact?: boolean; blink?: boolean }> =
  ({ label, value, max, color, height, compact, blink }) => (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <Label className={compact ? 'text-[12px]' : ''} style={{ color }}>{label}</Label>
        <Num className={compact ? 'text-[13px]' : 'text-[16px]'}>
          {Math.ceil(Math.max(0, value))}<span className="text-slate-400 text-[0.8em]"> / {Math.round(max)}</span>
        </Num>
      </div>
      <Meter value={ratio(value, max)} color={color} height={height} blink={blink} />
    </div>
  );

const DefensePanel: React.FC<{ state: GameState; compact?: boolean }> = ({ state, compact }) => {
  const { defense, runtimeStats, isGodMode } = state.player;
  const lowHull = ratio(defense.hull, runtimeStats.maxHull) <= 0.3;
  const h = compact ? 8 : 12;
  return (
    <div className={cx('flex flex-col', compact ? 'gap-1.5' : 'gap-2.5')}>
      {isGodMode && <Label className="text-amber-300">★ Mode dieu</Label>}
      <DefenseRow label="Bouclier" value={defense.shield} max={runtimeStats.maxShield} color={COLORS.shield} height={h} compact={compact} />
      <DefenseRow label="Armure" value={defense.armor} max={runtimeStats.maxArmor} color={COLORS.armor} height={h} compact={compact} />
      <DefenseRow label="Coque" value={defense.hull} max={runtimeStats.maxHull} color={COLORS.hull} height={h + 2} compact={compact} blink={lowHull} />
    </div>
  );
};

const AbilitySlot: React.FC<{ ability: ActiveAbility; size?: number }> = ({ ability, size = 54 }) => {
  const ready = ability.currentCooldown <= 0;
  const remaining = ratio(ability.currentCooldown, ability.cooldown);
  return (
    <div
      className={cx('relative flex items-center justify-center bg-slate-950/80 border-2 overflow-hidden', ready ? 'border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.5)]' : 'border-slate-600')}
      style={{ width: size, height: size }}
      title={`${ability.name} — ${ability.description}`}
    >
      <span className={cx('text-[24px]', !ready && 'opacity-40')}>{ability.icon}</span>
      {!ready && (
        <>
          <div className="absolute left-0 right-0 bottom-0 bg-cyan-400/25" style={{ height: `${(1 - remaining) * 100}%` }} />
          <Num className="absolute text-[17px] drop-shadow-[0_1px_2px_black]">{Math.ceil(ability.currentCooldown)}</Num>
        </>
      )}
      <span className="absolute bottom-0 right-0 bg-white text-black font-hud font-bold text-[11.5px] px-1 leading-tight uppercase">{ability.key}</span>
    </div>
  );
};

/** Bonus temporaires des compétences, avec le temps restant. */
const BuffList: React.FC<{ state: GameState; compact?: boolean }> = ({ state, compact }) => {
  const buffs = activeBuffs(state);
  if (buffs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {buffs.map(b => (
        <div key={b.id} className={cx('flex items-center gap-2 bg-slate-950/80 border-l-[3px]', compact ? 'px-1.5 py-0.5' : 'px-2 py-1', b.remaining < 1.5 && 'animate-hud-blink')} style={{ borderColor: b.color }}>
          <span className={cx('font-hud font-bold uppercase', compact ? 'text-[12px]' : 'text-[13px]')} style={{ color: b.color }}>{b.name}</span>
          <Num className={compact ? 'text-[12px]' : 'text-[14px]'}>{b.remaining.toFixed(1)} s</Num>
        </div>
      ))}
    </div>
  );
};

// --- Bas centre : armes -------------------------------------------------------

/** En dessous de ce délai de recharge, la barre clignoterait en permanence : on l'affiche pleine. */
const FAST_WEAPON_MS = 250;

const WeaponCard: React.FC<{ slot: WeaponSlot | null; overheated: boolean }> = ({ slot, overheated }) => {
  if (!slot) {
    return (
      <div className="w-[180px] h-[58px] border border-dashed border-white/15 bg-slate-950/40 flex items-center justify-center">
        <Label className="text-slate-500 text-[12px]">Emplacement libre</Label>
      </div>
    );
  }
  const { weapon } = slot;
  const color = DAMAGE_COLORS[weapon.type];
  const readiness = slot.cooldownMs < FAST_WEAPON_MS ? 1 : slot.readiness;
  const ready = readiness >= 1 && !overheated;
  return (
    <div
      className={cx('w-[180px] h-[58px] px-2.5 py-2 bg-slate-950/80 border flex flex-col justify-between', overheated && 'opacity-50')}
      style={{ borderColor: ready ? color + 'aa' : 'rgba(255,255,255,0.18)' }}
      title={`${weapon.name} — Tech ${weapon.level} — ${weapon.description}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 shrink-0 rotate-45" style={{ backgroundColor: color }} />
        <span className="font-hud font-bold text-[14px] text-white leading-none truncate">{weapon.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 shrink-0">
          <Num className="text-[12px] text-slate-200">T{weapon.level}</Num>
          <Pips value={weapon.level} max={MAX_WEAPON_LEVEL} color={color} size={6} />
        </span>
        <Meter value={overheated ? 0 : readiness} color={ready ? color : '#64748b'} height={7} className="flex-1" />
      </div>
    </div>
  );
};

/** Version réduite (compacte) : pastille avec niveau Tech et recharge. */
const WeaponChip: React.FC<{ slot: WeaponSlot | null; overheated: boolean }> = ({ slot, overheated }) => {
  if (!slot) return <div className="w-[32px] h-[32px] border border-dashed border-white/15" />;
  const color = DAMAGE_COLORS[slot.weapon.type];
  const readiness = overheated ? 0 : slot.cooldownMs < FAST_WEAPON_MS ? 1 : slot.readiness;
  return (
    <div className={cx('relative w-[32px] h-[32px] bg-slate-950/80 border flex items-center justify-center', overheated && 'opacity-50')} style={{ borderColor: color + 'aa' }}>
      <Num className="text-[12px]" style={{ color }}>T{slot.weapon.level}</Num>
      <div className="absolute left-0 bottom-0 h-[3px]" style={{ width: `${readiness * 100}%`, backgroundColor: readiness >= 1 ? color : '#64748b' }} />
    </div>
  );
};

// --- Bas droite : chaleur + série --------------------------------------------

const HeatPanel: React.FC<{ state: GameState; compact?: boolean }> = ({ state, compact }) => {
  const heat = heatInfo(state);
  const style = HEAT_STYLE[heat.level];
  const alarm = heat.level === 'overheated' || heat.level === 'critical';
  const over = heat.level === 'overheated';
  return (
    <div className={cx(compact ? '' : 'w-[250px]')}>
      <div className="flex justify-between items-baseline mb-1">
        <Label className={compact ? 'text-[12px]' : ''} style={{ color: alarm ? style.color : undefined }}>Chaleur</Label>
        <span className="flex items-baseline gap-2">
          <span className={cx('font-hud font-bold uppercase', compact ? 'text-[12px]' : 'text-[13px]', alarm && 'animate-hud-blink')} style={{ color: style.color }}>{style.text}</span>
          <Num className={compact ? 'text-[13px]' : 'text-[20px]'} style={{ color: style.color }}>{heat.percent}%</Num>
        </span>
      </div>
      <div className="relative">
        <Meter
          value={heat.ratio}
          color={style.color}
          height={compact ? 10 : 16}
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
      <div className={cx('flex justify-between items-baseline mt-1 font-hud', compact ? 'text-[12px]' : 'text-[13px]')}>
        {over ? (
          <span className="text-red-300 font-semibold">Tir coupé — reprise à {Math.round(heat.recovery * 100)}%</span>
        ) : heat.ratePenalty > 0 ? (
          <span className="font-bold text-orange-300">Cadence −{heat.ratePenalty} %</span>
        ) : (
          <span className="text-slate-400">Pleine cadence</span>
        )}
        {!compact && !over && <span className="text-slate-500">bridage ≥ {Math.round(heat.throttleStart * 100)}%</span>}
      </div>
    </div>
  );
};

const ComboBadge: React.FC<{ state: GameState; compact?: boolean }> = ({ state, compact }) => {
  if (state.comboCount <= 0) return null;
  return (
    <div className={cx('flex flex-col items-end', compact ? 'w-[110px]' : 'w-[160px]')}>
      <div className="flex items-baseline gap-2">
        <Label className="text-cyan-300 text-[13px]">Série</Label>
        <span key={state.comboCount} className={cx('font-orbitron font-black italic text-white animate-hud-pop', compact ? 'text-[24px]' : 'text-[34px]')}>×{state.comboCount}</span>
      </div>
      <Meter value={ratio(state.comboTimer, state.player.runtimeStats.comboWindow)} color="#22d3ee" height={5} />
    </div>
  );
};

// --- Alertes centrales --------------------------------------------------------

const CenterAlert: React.FC<{ state: GameState; compact?: boolean }> = ({ state, compact }) => {
  const heat = heatInfo(state);
  if (heat.level !== 'overheated' && heat.level !== 'critical') return null;
  const over = heat.level === 'overheated';
  return (
    <div className="absolute left-0 right-0 flex justify-center" style={{ top: '62%' }}>
      <div className={cx('flex flex-col items-center', over ? 'px-5 py-2 border-2 bg-slate-950/70 border-red-500 animate-hud-blink' : 'px-3 py-1 bg-slate-950/50')}>
        <span className={cx('font-orbitron font-black uppercase tracking-[0.15em]', over ? (compact ? 'text-[20px]' : 'text-[28px]') : 'text-[16px]', over ? 'text-red-400' : 'text-orange-300')}>
          {over ? '⚠ Surchauffe' : `Cadence −${heat.ratePenalty} %`}
        </span>
        <span className={cx('font-hud font-semibold text-white', over ? 'text-[14px]' : 'text-[13px] opacity-90')}>
          {over
            ? `Armes coupées — reprise à ${Math.round(heat.recovery * 100)}%`
            : state.autoFire ? 'Chaleur critique — surchauffe à 100 %' : 'Chaleur critique — relâchez le tir'}
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

const DesktopHUD: React.FC<{ state: GameState; layout: HudLayout }> = ({ state }) => {
  const slots = weaponSlots(state);
  return (
    <>
      <div className="absolute top-4 left-4"><PilotPanel state={state} /></div>

      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <WavePanel state={state} />
        <BossBar state={state} width={520} />
        <EventBanner state={state} />
      </div>

      <div className="absolute top-4 right-4"><BuildPanel state={state} /></div>

      <div className="absolute bottom-4 left-4 flex flex-col gap-3 w-[280px]">
        <BuffList state={state} />
        <div className="flex gap-3">
          {state.activeAbilities.map(a => <AbilitySlot key={a.id} ability={a} />)}
        </div>
        <Panel className="w-[280px] p-3" accent={COLORS.shield}>
          <DefensePanel state={state} />
        </Panel>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 grid grid-cols-3 gap-2">
        {slots.map((s, i) => <WeaponCard key={i} slot={s} overheated={state.isOverheated} />)}
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-3">
        <ComboBadge state={state} />
        <Panel className="p-3" accent={HEAT_STYLE[heatInfo(state).level].color}>
          <HeatPanel state={state} />
        </Panel>
      </div>

      <CenterAlert state={state} />
    </>
  );
};

const CompactHUD: React.FC<{ state: GameState; layout: HudLayout; touch: boolean }> = ({ state, layout, touch }) => {
  const slots = weaponSlots(state);
  const boss = bossIncoming(state);
  const wide = layout.width >= 640;
  return (
    <>
      {/* Bandeau haut (à droite : place pour le bouton pause tactile) */}
      <div className="absolute top-2 left-2 flex flex-col gap-1.5" style={{ right: touch ? 60 : 8 }}>
        <Panel className="px-2.5 py-1.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-[12px] text-cyan-300">Vague</Label>
            <span className="font-orbitron font-black text-[20px] leading-none text-cyan-300">{state.wave}</span>
            <Meter value={ratio(state.waveKills, state.waveQuota)} color={boss ? '#facc15' : COLORS.wave} height={9} className="flex-1" />
            <Num className="text-[13px]">{state.waveKills}/{state.waveQuota}</Num>
            <Num className="text-[13px] text-slate-300 ml-1">{formatClock(state.time)}</Num>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-[12px] text-violet-200">Niv</Label>
            <Num className="text-[16px]">{state.level}</Num>
            <Meter value={ratio(state.experience, state.expToNextLevel)} color={COLORS.xp} height={7} className="flex-1" />
            <Num className="text-[12px] text-slate-300">{state.totalKills} élim.</Num>
          </div>
          {boss && <Label className="text-[12px] text-amber-300 text-center">⚠ Boss à la vague {state.wave + 1}</Label>}
        </Panel>
        {bossInfo(state) && <BossBar state={state} width={Math.min(360, layout.width - 76)} />}
        <div className="flex justify-center"><EventBanner state={state} compact /></div>
        {/* Série + build (paysage) à droite sous le bandeau */}
        <div className="self-end flex flex-col items-end gap-2" style={{ marginRight: touch ? 36 : 0 }}>
          <ComboBadge state={state} compact />
          {wide && <BuildPanel state={state} compact maxHeight={layout.height - 110} />}
        </div>
      </div>

      {/* Bas gauche : armes, défenses, chaleur (à droite : place pour les boutons tactiles) */}
      <div className="absolute bottom-2 left-2 flex flex-col gap-2 w-[220px]">
        <BuffList state={state} compact />
        <div className="flex gap-1">
          {slots.map((s, i) => <WeaponChip key={i} slot={s} overheated={state.isOverheated} />)}
        </div>
        <Panel className="p-2 flex flex-col gap-2" accent={COLORS.shield}>
          <DefensePanel state={state} compact />
          <HeatPanel state={state} compact />
        </Panel>
      </div>

      {!touch && (
        <div className="absolute bottom-2 right-2 flex gap-2">
          {state.activeAbilities.map(a => <AbilitySlot key={a.id} ability={a} size={46} />)}
        </div>
      )}

      <CenterAlert state={state} compact />
    </>
  );
};

export const HUD: React.FC<{ state: GameState; touch?: boolean }> = ({ state, touch = false }) => {
  const layout = useHudLayout();
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
          {layout.compact ? <CompactHUD state={state} layout={layout} touch={touch} /> : <DesktopHUD state={state} layout={layout} />}
        </div>
      </div>
    </div>
  );
};
