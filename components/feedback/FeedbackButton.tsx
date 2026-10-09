import React from 'react';
import { FEEDBACK_TEXT } from './text';

/** Bouton « Avis » : ouvre la fenêtre d’avis (aussi sur F8). */
export const FeedbackButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    title={FEEDBACK_TEXT.buttonHint}
    className={`font-hud font-bold uppercase tracking-wider border border-amber-300/60 text-amber-200 bg-slate-950/70 hover:bg-amber-300/15 ${className}`}
  >
    💬 {FEEDBACK_TEXT.button}
  </button>
);
