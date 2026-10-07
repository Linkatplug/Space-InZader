/**
 * Briques visuelles du HUD (panneaux, libellés, jauges).
 * Tailles minimales : libellés 12-13 px, chiffres 14 px et plus (avant mise à l'échelle).
 */
import React from 'react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/** Cadre sombre semi-transparent avec liseré néon. */
export const Panel: React.FC<{ className?: string; accent?: string; style?: React.CSSProperties; children: React.ReactNode; title?: string }> =
  ({ className, accent = '#22d3ee', style, children, title }) => (
    <div
      title={title}
      className={cx('relative bg-slate-950/75 border border-white/15 shadow-[0_4px_24px_rgba(0,0,0,0.55)]', className)}
      style={style}
    >
      <span className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2" style={{ borderColor: accent }} />
      <span className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2" style={{ borderColor: accent }} />
      {children}
    </div>
  );

/** Libellé court en capitales, lisible (≥ 12 px). */
export const Label: React.FC<{ className?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({ className, style, children }) => (
  <span className={cx('font-hud text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-300 leading-none', className)} style={style}>
    {children}
  </span>
);

/** Valeur numérique à chasse fixe. */
export const Num: React.FC<{ className?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({ className, style, children }) => (
  <span className={cx('font-mono font-bold tabular-nums text-white leading-none', className)} style={style}>{children}</span>
);

/**
 * Jauge horizontale. `value` ∈ [0,1]. `markers` : repères verticaux (seuils) ∈ [0,1].
 */
export const Meter: React.FC<{
  value: number;
  color: string;
  height?: number;
  markers?: number[];
  className?: string;
  blink?: boolean;
  track?: string;
}> = ({ value, color, height = 10, markers, className, blink, track = '#0b1222' }) => (
  <div
    className={cx('relative w-full border border-white/20 overflow-hidden', className)}
    style={{ height, backgroundColor: track }}
  >
    <div
      className={cx('h-full transition-[width] duration-150 ease-out', blink && 'animate-hud-blink')}
      style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}99` }}
    />
    {markers?.map(m => (
      <span key={m} className="absolute top-0 bottom-0 w-[2px] bg-white/70" style={{ left: `calc(${m * 100}% - 1px)` }} />
    ))}
  </div>
);

/** Petits crans (niveau Tech, paliers). */
export const Pips: React.FC<{ value: number; max: number; color: string; size?: number }> = ({ value, max, color, size = 7 }) => (
  <span className="inline-flex gap-[3px] items-center">
    {Array.from({ length: max }, (_, i) => (
      <span
        key={i}
        style={{ width: size, height: size, backgroundColor: i < value ? color : 'transparent', borderColor: i < value ? color : 'rgba(255,255,255,0.35)' }}
        className="border rotate-45"
      />
    ))}
  </span>
);
