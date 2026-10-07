import React, { useEffect } from 'react';
import { GameSettings } from '../../engine/Meta';
import { playCollectXPSound } from '../../engine/SoundEngine';
import { normalizeSettingsPatch, percentLabel, shakeLabel, SliderKey } from './optionsModel';
import { cx } from '../hud/widgets';

interface OptionsMenuProps {
  settings: GameSettings;
  onChange: (patch: Partial<GameSettings>) => void;
  onClose: () => void;
}

const Row: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 py-3 border-b border-white/10">
    <div className="sm:w-[220px] shrink-0">
      <div className="font-hud font-bold text-[17px] text-white">{label}</div>
      {hint && <div className="font-hud text-[13px] text-slate-400 leading-snug">{hint}</div>}
    </div>
    <div className="flex-1 flex items-center gap-4">{children}</div>
  </div>
);

const Slider: React.FC<{ value: number; disabled?: boolean; label: string; display: string; onChange: (v: number) => void; onCommit?: () => void }> =
  ({ value, disabled, label, display, onChange, onCommit }) => (
    <>
      <input
        type="range" min={0} max={100} step={5}
        value={Math.round(value * 100)}
        aria-label={label}
        disabled={disabled}
        onChange={e => onChange(Number(e.target.value) / 100)}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        className="si-range flex-1 min-w-0"
        style={{ '--fill': `${value * 100}%` } as React.CSSProperties}
      />
      <span className={cx('font-mono font-bold text-[16px] w-[96px] text-right tabular-nums', disabled ? 'text-slate-500' : 'text-white')}>{display}</span>
    </>
  );

const Toggle: React.FC<{ checked: boolean; label: string; onChange: (v: boolean) => void; shortcut?: string }> = ({ checked, label, onChange, shortcut }) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className="flex items-center gap-3 group"
  >
    <span className={cx('relative w-[56px] h-[30px] border-2 transition-colors', checked ? 'bg-cyan-500/30 border-cyan-300' : 'bg-slate-900 border-slate-500')}>
      <span className={cx('absolute top-[3px] w-[20px] h-[20px] transition-all', checked ? 'left-[29px] bg-cyan-300' : 'left-[3px] bg-slate-400')} />
    </span>
    <span className={cx('font-hud font-bold text-[16px] uppercase', checked ? 'text-cyan-200' : 'text-slate-400')}>{checked ? 'Activé' : 'Désactivé'}</span>
    {shortcut && <kbd className="hidden sm:inline font-mono text-[13px] text-slate-300 bg-white/10 px-1.5 border border-white/20">{shortcut}</kbd>}
  </button>
);

/** Écran d'options : audio, confort visuel, tir auto. Les changements sont appliqués et sauvegardés immédiatement. */
export const OptionsMenu: React.FC<OptionsMenuProps> = ({ settings, onChange, onClose }) => {
  const set = (patch: Partial<GameSettings>) => onChange(normalizeSettingsPatch(patch));
  const slide = (k: SliderKey) => (v: number) => set({ [k]: v });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); onClose(); } };
    // Phase de capture : Échap ferme les options sans reprendre la partie
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-[60] bg-slate-950/95 backdrop-blur-md overflow-y-auto p-3 sm:p-8 flex justify-center items-[safe_center]">
      <div className="w-full max-w-3xl ui-zoom">
        <div className="flex items-end justify-between gap-4 mb-4 border-b border-cyan-400/30 pb-3">
          <h2 className="font-orbitron font-black text-[34px] sm:text-[48px] text-white leading-none">OPTIONS</h2>
          <button onClick={onClose} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-hud font-bold text-[18px] uppercase tracking-wider">
            Retour <span className="hidden sm:inline text-[13px] opacity-70">(Échap)</span>
          </button>
        </div>

        <h3 className="font-hud font-bold text-[14px] uppercase tracking-[0.15em] text-cyan-300 mt-4">Audio</h3>
        <Row label="Son" hint="Coupe musique et effets.">
          <Toggle label="Son" checked={!settings.muted} onChange={v => set({ muted: !v })} shortcut="M" />
        </Row>
        <Row label="Musique">
          <Slider label="Volume de la musique" value={settings.musicVolume} disabled={settings.muted} display={percentLabel(settings.musicVolume)} onChange={slide('musicVolume')} />
        </Row>
        <Row label="Effets sonores">
          <Slider label="Volume des effets" value={settings.sfxVolume} disabled={settings.muted} display={percentLabel(settings.sfxVolume)} onChange={slide('sfxVolume')} onCommit={playCollectXPSound} />
        </Row>

        <h3 className="font-hud font-bold text-[14px] uppercase tracking-[0.15em] text-cyan-300 mt-6">Affichage</h3>
        <Row label="Tremblement d'écran" hint="Secousses lors des explosions et des impacts.">
          <Slider label="Intensité du tremblement" value={settings.screenShake} display={shakeLabel(settings.screenShake)} onChange={slide('screenShake')} />
        </Row>
        <Row label="Chiffres de dégâts" hint="Valeurs flottantes au-dessus des ennemis touchés.">
          <Toggle label="Chiffres de dégâts" checked={settings.damageNumbers} onChange={v => set({ damageNumbers: v })} />
        </Row>

        <h3 className="font-hud font-bold text-[14px] uppercase tracking-[0.15em] text-cyan-300 mt-6">Commandes</h3>
        <Row label="Tir automatique" hint="Les armes tirent en continu vers le curseur.">
          <Toggle label="Tir automatique" checked={settings.autoFire} onChange={v => set({ autoFire: v })} shortcut="F" />
        </Row>
      </div>
    </div>
  );
};
