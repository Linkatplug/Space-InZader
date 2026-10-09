import React, { useEffect, useRef, useState } from 'react';
import type { FeedbackContext, FeedbackElement, FeedbackKind, FeedbackSnapshot } from '../../types';
import { sendFeedback } from './api';
import { buildPayload, canvasElement, describeElement, isFormValid } from './logic';
import { FEEDBACK_KEY, FEEDBACK_KINDS, FEEDBACK_LIMITS, FEEDBACK_TEXT as T } from './text';

interface FeedbackModalProps {
  /** Figés à l'ouverture. */
  snapshot: FeedbackSnapshot;
  context: FeedbackContext;
  /** Conversion écran → monde (même que la souris du jeu). */
  screenToWorld: (clientX: number, clientY: number) => { x: number; y: number };
  onClose: () => void;
  /** Pseudo du joueur : pré-remplit le champ pseudo. */
  defaultName?: string;
}

const BLOCKED_POINTER_EVENTS = ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend'] as const;

/**
 * Fenêtre d'avis. Pendant qu'elle est ouverte (App ne simule plus), elle capte toutes les touches
 * (le jeu et les raccourcis ne les voient pas) : F8 / Échap ferment, Échap annule la sélection d'élément.
 */
export const FeedbackModal: React.FC<FeedbackModalProps> = ({ snapshot, context, screenToWorld, onClose, defaultName = '' }) => {
  const [kind, setKind] = useState<FeedbackKind>('bug');
  const [message, setMessage] = useState('');
  const [name, setName] = useState(defaultName);
  const [website, setWebsite] = useState('');
  const [element, setElement] = useState<FeedbackElement | undefined>();
  const [picking, setPicking] = useState(false);
  const [hover, setHover] = useState<DOMRect | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showEmptyError, setShowEmptyError] = useState(false);
  const pickingRef = useRef(false);
  pickingRef.current = picking;
  const rootRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Touches : tout est capté ici, rien n'atteint le jeu (ni App, ni InputManager).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === FEEDBACK_KEY) { e.preventDefault(); e.stopImmediatePropagation(); onCloseRef.current(); return; }
      if (key === 'escape') {
        e.preventDefault(); e.stopImmediatePropagation();
        if (pickingRef.current) setPicking(false); else onCloseRef.current();
        return;
      }
      e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', onKey, true);
    const onKeyUp = (e: KeyboardEvent) => e.stopImmediatePropagation();
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, []);

  // Sélection d'élément : survol = cadre, clic = choix (le clic n'atteint pas le jeu).
  useEffect(() => {
    if (!picking) { setHover(null); return; }
    const targetAt = (x: number, y: number) => document.elementFromPoint(x, y);
    const onMove = (e: MouseEvent) => {
      const el = targetAt(e.clientX, e.clientY);
      setHover(el ? el.getBoundingClientRect() : null);
    };
    const swallow = (e: Event) => { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); };
    const onClick = (e: MouseEvent) => {
      swallow(e);
      const el = targetAt(e.clientX, e.clientY);
      if (!el) return;
      setElement(el instanceof HTMLCanvasElement ? canvasElement(screenToWorld(e.clientX, e.clientY)) : describeElement(el));
      setPicking(false);
    };
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('click', onClick, true);
    for (const t of BLOCKED_POINTER_EVENTS) window.addEventListener(t, swallow, true);
    return () => {
      window.removeEventListener('mousemove', onMove, true);
      window.removeEventListener('click', onClick, true);
      for (const t of BLOCKED_POINTER_EVENTS) window.removeEventListener(t, swallow, true);
    };
  }, [picking, screenToWorld]);

  const submit = async () => {
    if (sending) return;
    if (!isFormValid({ message })) { setShowEmptyError(true); return; }
    setShowEmptyError(false);
    setSending(true);
    setResult(null);
    const res = await sendFeedback(buildPayload({ kind, message, name, website, element }, snapshot, context));
    setSending(false);
    setResult(res);
    if (res.ok) { setMessage(''); setElement(undefined); }
  };

  const sent = result?.ok === true;
  const elementLabel = element
    ? (element.path === 'canvas' && element.world ? T.pickedCanvasAt(element.world.x, element.world.y) : element.path)
    : null;

  if (picking) {
    return (
      <div className="fixed inset-0 z-[100] pointer-events-none" style={{ cursor: 'crosshair' }}>
        {hover && (
          <div className="absolute border-2 border-amber-300 bg-amber-300/10"
            style={{ left: hover.left, top: hover.top, width: hover.width, height: hover.height }} />
        )}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-300 text-slate-950 font-hud font-bold text-[16px] shadow-lg">
          {T.pickBanner}
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} data-pad-scope className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-sm overflow-y-auto p-3 sm:p-8 flex justify-center items-[safe_center]">
      <div className="w-full max-w-xl bg-slate-900 border border-amber-300/40 p-4 sm:p-6 flex flex-col gap-4 font-hud">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-orbitron font-black text-[28px] text-white leading-none">{T.title}</h2>
            <p className="text-[14px] text-slate-300 mt-2">{T.intro}</p>
          </div>
          <button type="button" onClick={onClose} title={T.closeHint}
            className="px-3 py-1 border border-white/30 text-white hover:bg-white/10 text-[14px] uppercase">{T.close}</button>
        </div>

        <div>
          <div className="text-[13px] uppercase tracking-wider text-slate-400 mb-1">{T.kindLabel}</div>
          <div className="flex flex-wrap gap-2">
            {FEEDBACK_KINDS.map(k => (
              <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={kind === k}
                className={`px-3 py-1.5 text-[14px] font-bold border ${kind === k ? 'bg-amber-300 text-slate-950 border-amber-300' : 'border-white/30 text-slate-200 hover:bg-white/10'}`}>
                {T.kinds[k]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[13px] uppercase tracking-wider text-slate-400 mb-1 block" htmlFor="fb-message">{T.messageLabel}</label>
          <textarea id="fb-message" value={message} rows={5} maxLength={FEEDBACK_LIMITS.message} autoFocus
            onChange={(e) => { setMessage(e.target.value); setShowEmptyError(false); }}
            placeholder={T.messagePlaceholder}
            className="w-full bg-slate-950 border border-white/25 text-white p-2 text-[15px] focus:outline-none focus:border-amber-300" />
          <div className="text-right text-[12px] text-slate-500">{T.charCount(message.length, FEEDBACK_LIMITS.message)}</div>
          {showEmptyError && <div className="text-red-300 text-[14px]" role="alert">{T.messages.emptyMessage}</div>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setPicking(true)}
            className="px-3 py-2 border border-amber-300/60 text-amber-200 hover:bg-amber-300/15 text-[14px] font-bold uppercase">
            {element ? T.pickAgain : T.pickButton}
          </button>
          {elementLabel && (
            <div className="flex flex-wrap items-center gap-x-2 min-w-0 text-[13px] text-slate-300">
              <span className="text-slate-500">{T.pickedLabel}</span>
              <code className="break-all text-amber-100">{elementLabel}</code>
              <button type="button" onClick={() => setElement(undefined)} className="underline text-slate-400 hover:text-white">{T.pickClear}</button>
            </div>
          )}
        </div>

        <div>
          <label className="text-[13px] uppercase tracking-wider text-slate-400 mb-1 block" htmlFor="fb-name">{T.nameLabel}</label>
          <input id="fb-name" type="text" value={name} maxLength={FEEDBACK_LIMITS.name} onChange={(e) => setName(e.target.value)}
            placeholder={T.namePlaceholder} autoComplete="off"
            className="w-full bg-slate-950 border border-white/25 text-white p-2 text-[15px] focus:outline-none focus:border-amber-300" />
        </div>

        {/* Piège à robots : invisible pour les humains */}
        <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1} autoComplete="off" aria-hidden="true"
          style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }} />

        {result && (
          <div role="status" className={`p-2 text-[14px] border ${sent ? 'border-emerald-400/60 text-emerald-200 bg-emerald-500/10' : 'border-red-400/60 text-red-200 bg-red-500/10'}`}>
            {result.message}
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={submit} disabled={sending || sent}
            className="flex-1 px-4 py-3 bg-amber-300 hover:bg-amber-200 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold text-[16px] uppercase tracking-wider">
            {sending ? T.sending : sent ? T.sentTitle : T.send}
          </button>
          {sent && (
            <button type="button" onClick={onClose} className="px-4 py-3 border border-white/40 text-white hover:bg-white/10 font-bold uppercase text-[15px]">{T.close}</button>
          )}
        </div>
      </div>
    </div>
  );
};
