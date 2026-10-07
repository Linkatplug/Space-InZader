import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * Mise à l'échelle d'un écran pour qu'il tienne entièrement dans la fenêtre, sans défilement
 * (comme le HUD). Le contenu est mis en page à une largeur de référence fixe, mesuré,
 * puis agrandi ou réduit. Désactivé sur petit écran : on garde alors le défilement normal.
 */

export interface FitOptions {
  pad: number;   // marge autour du contenu (px réels)
  min: number;   // échelle minimale (au-delà, on accepte de défiler)
  max: number;   // échelle maximale (évite un rendu démesuré sur très grand écran)
}

export const FIT_DEFAULTS: FitOptions = { pad: 16, min: 0.6, max: 1.4 };

/** Échelle qui fait tenir un contenu w×h dans une fenêtre vw×vh. */
export const fitScale = (w: number, h: number, vw: number, vh: number, o: FitOptions = FIT_DEFAULTS) => {
  if (w <= 0 || h <= 0) return 1;
  const s = Math.min((vw - 2 * o.pad) / w, (vh - 2 * o.pad) / h);
  return Math.max(o.min, Math.min(o.max, s));
};

/** Largeur minimale de fenêtre pour activer l'ajustement (en dessous : mise en page mobile). */
export const FIT_MIN_VIEWPORT = 1024;

export const FitToScreen: React.FC<{ width: number; children: React.ReactNode; options?: FitOptions }> = ({ width, children, options = FIT_DEFAULTS }) => {
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ enabled: boolean; scale: number; h: number }>({ enabled: false, scale: 1, h: 0 });

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const measure = () => {
      const enabled = window.innerWidth >= FIT_MIN_VIEWPORT;
      // offsetHeight ignore la transformation : c'est la hauteur « naturelle » du contenu
      const h = el.offsetHeight;
      const scale = enabled ? fitScale(width, h, window.innerWidth, window.innerHeight, options) : 1;
      setFit(f => (f.enabled === enabled && Math.abs(f.scale - scale) < 0.002 && f.h === h ? f : { enabled, scale, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(document.documentElement); // taille de la fenêtre (plus fiable que le seul événement resize)
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [width, options]);

  // Mêmes nœuds DOM dans les deux modes : le ResizeObserver reste branché sur le bon élément
  return (
    <div
      className={fit.enabled ? 'relative shrink-0' : 'w-full'}
      style={fit.enabled ? { width: width * fit.scale, height: fit.h * fit.scale } : undefined}
    >
      <div
        ref={inner}
        className={fit.enabled ? 'absolute top-0 left-0' : 'w-full'}
        style={fit.enabled ? { width, transform: `scale(${fit.scale})`, transformOrigin: 'top left' } : undefined}
      >
        {children}
      </div>
    </div>
  );
};
