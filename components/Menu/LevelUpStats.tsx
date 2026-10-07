import React from 'react';
import type { UpgradePreview } from '../../engine/Preview';
import type { Stats } from '../../types';
import type { StatGroup } from '../../data/statInfo';
import { cx } from '../hud/widgets';
import {
  statGroups, buildIndicators, thermalView, fmt1,
  Indicator, StatRow, ThermalView, PRIMARY_GROUPS,
} from './levelUpModel';

/**
 * Panneau « Build » du level-up, sous les cartes : 3 gros indicateurs, stats en colonnes,
 * bloc chaleur. Au survol d'une carte, il prend sa couleur et montre les écarts.
 */

const GROUP_COLOR: Record<StatGroup, string> = {
  Défense: '#22d3ee',
  Attaque: '#f472b6',
  Chaleur: '#fb923c',
  Mobilité: '#a78bfa',
  Utilitaire: '#4ade80',
};

const GOOD = '#34d399';
const BAD = '#f87171';

const DeltaPill: React.FC<{ text: string; good?: boolean; big?: boolean }> = ({ text, good, big }) => (
  <span
    className={cx('font-mono font-bold tabular-nums px-1 leading-tight', big ? 'text-[15px] py-0.5' : 'text-[12px]')}
    style={{ color: good ? GOOD : BAD, backgroundColor: (good ? GOOD : BAD) + '22', border: `1px solid ${(good ? GOOD : BAD)}66` }}
  >
    {text}
  </span>
);

const Tile: React.FC<{ ind: Indicator }> = ({ ind }) => {
  const changed = !!ind.delta;
  const color = changed ? (ind.good ? GOOD : BAD) : undefined;
  return (
    <div
      title={ind.hint}
      className="relative p-2.5 sm:px-3 bg-black/45 border transition-colors duration-200 overflow-hidden"
      style={{ borderColor: color ? color + 'aa' : 'rgba(255,255,255,0.12)', boxShadow: color ? `inset 0 0 24px -8px ${color}` : undefined }}
    >
      <div className="font-hud font-bold text-[12px] sm:text-[13px] uppercase tracking-[0.12em] text-slate-300 leading-tight">{ind.label}</div>
      <div className="flex items-baseline gap-x-2 mt-1 whitespace-nowrap">
        {changed && <span className="font-mono text-[14px] sm:text-[16px] text-slate-500 line-through tabular-nums">{ind.value}</span>}
        <span
          key={ind.next ?? ind.value}
          className={cx('font-mono font-extrabold text-[22px] sm:text-[28px] leading-none tabular-nums animate-hud-pop',
            !changed && ind.tone === 'warn' ? 'text-amber-300' : 'text-white')}
          style={color ? { color } : undefined}
        >
          {ind.next ?? ind.value}
        </span>
        {changed && <DeltaPill text={ind.delta!} good={ind.good} big />}
      </div>
    </div>
  );
};

const Row: React.FC<{ row: StatRow; color: string; dim: boolean }> = ({ row, color, dim }) => {
  const changed = !!row.delta;
  const tone = row.good ? GOOD : BAD;
  return (
    <div
      className={cx('flex items-center gap-2 px-1.5 py-[2px] transition-all duration-200', dim && 'opacity-40')}
      style={changed ? { backgroundColor: tone + '18', boxShadow: `inset 3px 0 0 ${tone}` } : undefined}
    >
      <span className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: changed ? tone : color }} />
      <span className={cx('font-hud text-[13px] flex-1 min-w-0 truncate', changed ? 'text-white font-semibold' : 'text-slate-300')}>{row.label}</span>
      {changed ? (
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="font-mono text-[12px] text-slate-500 line-through tabular-nums">{row.value}</span>
          <span className="font-mono font-bold text-[13px] text-white tabular-nums">{row.next}</span>
          <DeltaPill text={row.delta!} good={row.good} />
        </span>
      ) : (
        <span className="font-mono text-[13px] text-slate-100 tabular-nums shrink-0">{row.value}</span>
      )}
    </div>
  );
};

const Column: React.FC<{ group: StatGroup; rows: StatRow[]; previewing: boolean; children?: React.ReactNode }> = ({ group, rows, previewing, children }) => (
  <div className="flex flex-col min-w-0">
    <div className="flex items-center gap-2 mb-1">
      <span className="w-3 h-[3px]" style={{ backgroundColor: GROUP_COLOR[group] }} />
      <span className="font-hud font-bold text-[13px] uppercase tracking-[0.15em]" style={{ color: GROUP_COLOR[group] }}>{group}</span>
      <span className="flex-1 h-px bg-white/10" />
    </div>
    {children}
    {rows.map(r => <Row key={r.key} row={r} color={GROUP_COLOR[group]} dim={previewing && !r.delta} />)}
  </div>
);

/** Jauge horizontale sur l'échelle commune du bloc chaleur. */
const HeatBar: React.FC<{ label: string; value: number; extra?: number; before?: number; scale: number; color: string; extraLabel?: string }> =
  ({ label, value, extra, before, scale, color, extraLabel }) => (
    <div>
      <div className="flex justify-between items-baseline">
        <span className="font-hud text-[13px] text-slate-300">{label}</span>
        <span className="font-mono text-[13px] tabular-nums">
          {before !== undefined && <span className="text-slate-500 line-through mr-1.5">{fmt1(before)}</span>}
          <b className="text-white">{fmt1(value)}/s</b>
          {extraLabel && <span className="text-slate-400"> {extraLabel}</span>}
        </span>
      </div>
      <div className="relative h-[12px] mt-0.5 bg-[#0b1222] border border-white/15 overflow-hidden">
        {extra !== undefined && (
          <div className="absolute inset-y-0 left-0" style={{
            width: `${(extra / scale) * 100}%`,
            backgroundImage: `repeating-linear-gradient(135deg, ${color}55 0 3px, transparent 3px 7px)`,
          }} />
        )}
        <div className="absolute inset-y-0 left-0 transition-[width] duration-300" style={{ width: `${(value / scale) * 100}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}aa` }} />
        {before !== undefined && (
          <span className="absolute inset-y-0 w-[2px] bg-white" style={{ left: `calc(${(before / scale) * 100}% - 1px)` }} />
        )}
      </div>
    </div>
  );

const HeatBlock: React.FC<{ t: ThermalView }> = ({ t }) => (
  <div className="p-2.5 bg-black/45 border border-orange-400/35 flex flex-col gap-1.5 justify-center">
    <div className="flex items-baseline justify-between">
      <span className="font-hud font-bold text-[12px] sm:text-[13px] uppercase tracking-[0.12em] text-orange-300">Chaleur / s</span>
      <span className={cx('font-mono text-[12px] tabular-nums', t.net > 0 ? 'text-amber-300' : 'text-emerald-300')}>
        {t.net > 0 ? `monte de ${fmt1(t.net)}/s à froid` : 'équilibrée'}
      </span>
    </div>
    <HeatBar label="Produite (tir continu)" value={t.produced} before={t.producedBefore} scale={t.scale} color="#fb923c" />
    <HeatBar label="Refroidie" value={t.cooled} before={t.cooledBefore} extra={t.cooledMax} scale={t.scale} color="#38bdf8"
      extraLabel={`→ ${fmt1(t.cooledMax)} à chaud`} />
  </div>
);

export const LevelUpStats: React.FC<{
  base: UpgradePreview;
  preview?: UpgradePreview;
  accent?: string;
  previewName?: string;
  /** Stats modifiées par au moins un des choix : lignes toujours présentes (mise en page stable). */
  reserve?: (keyof Stats)[];
}> =
  ({ base, preview, accent, previewName, reserve = [] }) => {
    const groups = statGroups(base.before, preview?.changes, reserve);
    const indicators = buildIndicators(
      { stats: base.before, loadout: base.loadoutBefore },
      preview && { stats: preview.after, loadout: preview.loadoutAfter },
    );
    const thermal = thermalView(base.loadoutBefore, preview?.loadoutAfter);
    const primary = PRIMARY_GROUPS.map(g => groups.find(x => x.group === g)).filter(Boolean) as typeof groups;
    const secondary = groups.filter(g => !PRIMARY_GROUPS.includes(g.group));
    const previewing = !!preview;
    const changedRows = groups.flatMap(g => g.rows).filter(r => r.delta);
    const edge = accent ?? '#22d3ee';

    return (
      <section
        className="relative p-3 sm:p-4 bg-slate-950/95 border transition-[border-color,box-shadow] duration-200"
        style={{ borderColor: previewing ? edge + 'cc' : 'rgba(255,255,255,0.14)', boxShadow: previewing ? `0 0 34px -12px ${edge}` : undefined }}
      >
        {/* Liseré d'accent : relie visuellement la carte survolée au panneau */}
        <span className="absolute top-0 left-0 right-0 h-[3px] transition-colors duration-200" style={{ backgroundColor: previewing ? edge : 'rgba(34,211,238,0.35)' }} />

        <div className="flex items-center gap-x-3 mb-2.5 h-[28px] overflow-hidden whitespace-nowrap">
          <h3 className="font-orbitron font-black text-[18px] sm:text-[20px] uppercase tracking-[0.12em] text-white mr-auto">Votre build</h3>
          {previewing ? (
            <>
              <span className="font-hud text-[14px] text-slate-300">Aperçu : <b style={{ color: edge }}>{previewName}</b></span>
              {/* Résumé des stats modifiées : visible sans faire défiler jusqu'aux colonnes */}
              {changedRows.map(r => (
                <span key={r.key} className="inline-flex items-center gap-1.5 font-hud text-[13px] text-slate-200">
                  {r.label} <DeltaPill text={r.delta!} good={r.good} />
                </span>
              ))}
              {changedRows.length === 0 && <span className="font-hud text-[13px] text-slate-400">aucune stat de base modifiée</span>}
            </>
          ) : (
            <span className="font-hud text-[14px] text-slate-400">Survolez une carte pour voir son effet</span>
          )}
        </div>

        {/* Rangée du haut : 3 indicateurs + bilan thermique (c'est ce qui départage souvent deux choix) */}
        <div className="grid grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_1.5fr] gap-2 sm:gap-3 mb-3">
          {indicators.map(ind => <Tile key={ind.id} ind={ind} />)}
          <div className="col-span-3 lg:col-span-1"><HeatBlock t={thermal} /></div>
        </div>

        {/* Toutes les stats, sans repli : Défense / Attaque / Chaleur / Mobilité + Utilitaire */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-3">
          {primary.map(g => (
            <Column key={g.group} group={g.group} rows={g.rows} previewing={previewing} />
          ))}
          {secondary.length > 0 && (
            <div className="flex flex-col gap-2 min-w-0">
              {secondary.map(g => <Column key={g.group} group={g.group} rows={g.rows} previewing={previewing} />)}
            </div>
          )}
        </div>
      </section>
    );
  };
