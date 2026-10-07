import React, { useRef, useState } from 'react';
import { input } from '../engine/InputManager';
import { CONTROLS } from '../constants';

/** Détection d'un écran tactile principal (téléphone / tablette). */
export const isTouchDevice = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window);

const RADIUS = 60;

/**
 * Contrôles tactiles : joystick virtuel à gauche (déplacement),
 * boutons de compétences et de pause à droite. Visée et tir automatiques.
 */
export const TouchControls: React.FC<{ onPause: () => void }> = ({ onPause }) => {
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

  const Btn = ({ label, onTap, className = '' }: { label: string; onTap: () => void; className?: string }) => (
    <button
      onTouchStart={(e) => { e.preventDefault(); onTap(); }}
      className={`w-16 h-16 rounded-full border-2 border-cyan-400/60 bg-black/50 text-2xl text-white active:bg-cyan-400/30 select-none ${className}`}
    >
      {label}
    </button>
  );

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
      <div className="absolute right-6 bottom-56 flex flex-col gap-4 pointer-events-auto">
        <Btn label="⚡" onTap={() => input.tap(CONTROLS.ABILITY_1)} />
        <Btn label="🌀" onTap={() => input.tap(CONTROLS.ABILITY_2)} />
      </div>
      <div className="absolute left-4 top-24 pointer-events-auto">
        <Btn label="⏸" onTap={onPause} className="w-12 h-12 text-lg" />
      </div>
    </div>
  );
};
