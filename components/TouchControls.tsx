import React, { useRef, useState } from 'react';
import { input } from '../engine/InputManager';
import { ActiveAbility } from '../types';
import { FEEDBACK_TEXT } from './feedback/text';

/** Détection d'un écran tactile principal (téléphone / tablette). */
export const isTouchDevice = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window);

const RADIUS = 60;

/**
 * Contrôles tactiles : joystick virtuel à gauche (déplacement),
 * boutons de compétences et de pause à droite. Visée et tir automatiques.
 */
export const TouchControls: React.FC<{ onPause: () => void; onFeedback: () => void; abilities: ActiveAbility[] }> = ({ onPause, onFeedback, abilities }) => {
  const [stick, setStick] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null);
  const touchId = useRef<number | null>(null);

  const start = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    touchId.current = t.identifier;
    setStick({ ox: t.clientX, oy: t.clientY, x: t.clientX, y: t.clientY });
  };
  const move = (e: React.TouchEvent) => {
    if (!stick) return;
    const t = Array.from(e.changedTouches).find(c => c.identifier === touchId.current);
    if (!t) return;
    let dx = t.clientX - stick.ox, dy = t.clientY - stick.oy;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) { dx *= RADIUS / d; dy *= RADIUS / d; }
    setStick({ ...stick, x: stick.ox + dx, y: stick.oy + dy });
    input.setAnalog(dx / RADIUS, dy / RADIUS);
  };
  const end = (e: React.TouchEvent) => {
    if (!Array.from(e.changedTouches).some(c => c.identifier === touchId.current)) return;
    touchId.current = null;
    setStick(null);
    input.setAnalog(0, 0);
  };

  const Btn = ({ label, onTap, className = '', style }: { label: React.ReactNode; onTap: () => void; className?: string; style?: React.CSSProperties }) => (
    <button
      onTouchStart={(e) => { e.preventDefault(); onTap(); }}
      className={`relative rounded-full border-2 border-cyan-400/70 bg-slate-950/70 text-white active:bg-cyan-400/30 select-none flex items-center justify-center overflow-hidden ${className}`}
      style={style}
    >
      {label}
    </button>
  );

  /** Bouton de compétence : anneau de recharge + secondes restantes. */
  const AbilityBtn = ({ ability }: { ability: ActiveAbility }) => {
    const ready = ability.currentCooldown <= 0;
    const remaining = Math.min(1, ability.currentCooldown / (ability.cooldown || 1));
    return (
      <Btn
        onTap={() => input.tap(ability.key)}
        className={`w-[68px] h-[68px] ${ready ? 'shadow-[0_0_14px_rgba(34,211,238,0.6)]' : 'border-slate-500/70'}`}
        style={{ background: ready ? undefined : `conic-gradient(rgba(2,6,23,0.85) ${remaining * 360}deg, rgba(34,211,238,0.25) 0)` }}
        label={ready
          ? <span className="text-[28px]">{ability.icon}</span>
          : <span className="font-mono font-bold text-[20px] text-white">{Math.ceil(ability.currentCooldown)}</span>}
      />
    );
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none select-none" style={{ touchAction: 'none' }}>
      {/* Zone joystick : moitié gauche */}
      <div
        className="absolute left-0 top-0 w-1/2 h-full pointer-events-auto"
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
        onTouchCancel={end}
      />
      {stick && (
        <>
          <div className="absolute rounded-full border-2 border-white/20 bg-white/5 pointer-events-none"
            style={{ left: stick.ox - RADIUS, top: stick.oy - RADIUS, width: RADIUS * 2, height: RADIUS * 2 }} />
          <div className="absolute rounded-full bg-cyan-400/50 pointer-events-none"
            style={{ left: stick.x - 24, top: stick.y - 24, width: 48, height: 48 }} />
        </>
      )}
      {/* Compétences : coin bas droit (le HUD compact laisse cette zone libre) */}
      <div
        className="absolute flex flex-col gap-3 pointer-events-auto"
        style={{ right: 'calc(14px + env(safe-area-inset-right))', bottom: 'calc(18px + env(safe-area-inset-bottom))' }}
      >
        {[...abilities].reverse().map(a => <AbilityBtn key={a.id} ability={a} />)}
      </div>
      {/* Pause : coin haut droit (le bandeau du HUD compact s'arrête avant) */}
      <div
        className="absolute pointer-events-auto"
        style={{ right: 'calc(8px + env(safe-area-inset-right))', top: 'calc(8px + env(safe-area-inset-top))' }}
      >
        <Btn label={<span className="text-[18px]">⏸</span>} onTap={onPause} className="w-11 h-11" />
      </div>
      {/* Avis : à gauche du bouton pause */}
      <div
        className="absolute pointer-events-auto"
        style={{ right: 'calc(60px + env(safe-area-inset-right))', top: 'calc(8px + env(safe-area-inset-top))' }}
      >
        <Btn label={<span className="text-[16px]" title={FEEDBACK_TEXT.buttonHint}>💬</span>} onTap={onFeedback} className="w-11 h-11 border-amber-300/70" />
      </div>
    </div>
  );
};
