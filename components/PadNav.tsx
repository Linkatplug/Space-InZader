import React, { useEffect } from 'react';
import { input } from '../engine/InputManager';
import { Dir, pickNext, shouldRepeat } from './padNavModel';

/**
 * Navigation des menus à la manette. Fonctionne par focus DOM : aucune modification des menus n'est nécessaire,
 * il suffit de marquer la racine d'un écran avec `data-pad-scope` (le dernier dans le DOM = le plus au-dessus).
 *  - croix / stick gauche : déplace le focus (navigation spatiale) ; sur un curseur (range) : change la valeur ;
 *  - Start : clique l'élément `data-pad-default` (menu principal : lancer la mission) ;
 *  - A : clique l'élément focalisé ; B : bouton `data-pad-back` s'il existe, sinon Échap (ferme / reprend) ;
 *  - `data-pad-default` : élément focalisé en premier à l'ouverture d'un écran.
 * Un champ texte focalisé n'est jamais cassé : haut/bas quittent le champ, B le quitte, le reste est ignoré.
 */

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="radio"], [role="switch"], [tabindex]:not([tabindex="-1"])';

const topScope = (): HTMLElement | null => {
  const all = document.querySelectorAll<HTMLElement>('[data-pad-scope]');
  return all.length ? all[all.length - 1] : null;
};

const visible = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
};

const isTextField = (el: Element | null): el is HTMLInputElement | HTMLTextAreaElement =>
  !!el && (el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && !['range', 'checkbox', 'radio', 'button'].includes(el.type)));

/** Change la valeur d'un curseur en déclenchant l'événement que React écoute. */
const nudgeRange = (el: HTMLInputElement, dir: 1 | -1) => {
  const step = Number(el.step) || 1;
  const next = Math.max(Number(el.min) || 0, Math.min(Number(el.max) || 100, Number(el.value) + dir * step));
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  setter.call(el, String(next));
  el.dispatchEvent(new Event('input', { bubbles: true }));
};

const move = (dir: Dir) => {
  const scope = topScope();
  if (!scope) return;
  const active = document.activeElement as HTMLElement | null;
  const items = [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(visible);
  if (!items.length) return;
  const cur = active && scope.contains(active) ? active : null;
  if (!cur) {
    (scope.querySelector<HTMLElement>('[data-pad-default]:not([disabled])') ?? items[0]).focus();
    return;
  }
  if (isTextField(cur) && (dir === 'left' || dir === 'right')) return;
  if (cur instanceof HTMLInputElement && cur.type === 'range' && (dir === 'left' || dir === 'right')) {
    nudgeRange(cur, dir === 'right' ? 1 : -1);
    return;
  }
  const next = pickNext(items.map(i => i.getBoundingClientRect()), items.indexOf(cur), dir);
  if (next >= 0) {
    items[next].focus();
    items[next].scrollIntoView({ block: 'nearest' });
  }
};

const confirm = () => {
  const el = document.activeElement as HTMLElement | null;
  const scope = topScope();
  if (!scope || !el || !scope.contains(el) || isTextField(el)) return;
  el.click();
};

const back = () => {
  const active = document.activeElement;
  if (isTextField(active)) { active.blur(); return; }
  const btn = topScope()?.querySelector<HTMLElement>('[data-pad-back]');
  if (btn) { btn.click(); return; }
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
};

/** À monter une fois dans App : relie les actions de la manette (input.getPadActions) à la navigation des menus. */
export const PadNav: React.FC = () => {
  useEffect(() => {
    let raf = 0;
    const pressedAt = new Map<string, number>();
    const lastRepeat = new Map<string, number>();
    let lastScope: HTMLElement | null = null;
    let startWasDown = false;
    const loop = (now: number) => {
      const scope = topScope();
      // Nouvel écran : le focus est placé tout de suite si la manette est le périphérique en cours
      if (scope !== lastScope) {
        lastScope = scope;
        if (scope && input.isGamepadActive() && !scope.contains(document.activeElement) && !isTextField(document.activeElement)) move('down');
      }
      const held = input.getPadActions();
      // Start dans le menu principal = lancer la mission (l'élément marqué data-pad-default)
      const startDown = held.has('pause');
      if (startDown && !startWasDown && scope) scope.querySelector<HTMLElement>('[data-pad-default]:not([disabled])')?.click();
      startWasDown = startDown;
      for (const a of ['up', 'down', 'left', 'right', 'confirm', 'back'] as const) {
        if (!held.has(a)) { pressedAt.delete(a); lastRepeat.delete(a); continue; }
        const start = pressedAt.get(a);
        if (start === undefined) {
          pressedAt.set(a, now);
          lastRepeat.set(a, now);
          if (!scope) continue;
          if (a === 'confirm') confirm();
          else if (a === 'back') back();
          else move(a);
        } else if (scope && a !== 'confirm' && a !== 'back' && shouldRepeat(now - start, now - (lastRepeat.get(a) ?? now))) {
          lastRepeat.set(a, now);
          move(a);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
};

/** Message temporaire « Manette connectée / déconnectée ». */
export const PadToast: React.FC = () => {
  const [msg, setMsg] = React.useState<string | null>(null);
  useEffect(() => {
    let timer = 0;
    const off = input.onGamepadChange((connected, id) => {
      const name = (id ?? '').replace(/\s*\(.*$/, '').trim();
      setMsg(connected ? `🎮 Manette connectée${name ? ` — ${name}` : ''}` : '🎮 Manette déconnectée');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setMsg(null), 3500);
    });
    return () => { off(); window.clearTimeout(timer); };
  }, []);
  if (!msg) return null;
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 bg-slate-950/90 border border-cyan-400/60 font-hud font-bold text-[15px] text-cyan-100 pointer-events-none" role="status">
      {msg}
    </div>
  );
};
