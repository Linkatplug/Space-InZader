import React, { useEffect, useState } from 'react';
import { sanitizeName } from './playerStore';
import { PLAYER_NAME, PLAYER_TEXT } from './text';

interface PseudoFieldProps {
  /** Pseudo enregistré. */
  value: string;
  /** Appelé avec le pseudo nettoyé (à la validation : Entrée ou perte du focus). */
  onCommit: (name: string) => void;
  className?: string;
}

/** Champ pseudo : saisie libre, nettoyée et enregistrée à la validation (vide ou trop court → « Pilote »). */
export const PseudoField: React.FC<PseudoFieldProps> = ({ value, onCommit, className = '' }) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    const clean = sanitizeName(draft);
    setDraft(clean);
    if (clean !== value) onCommit(clean);
  };
  const tooShort = draft.trim().length > 0 && draft.trim().length < PLAYER_NAME.min;

  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="font-hud text-[13px] uppercase tracking-wider text-slate-400">{PLAYER_TEXT.label}</span>
      <input
        type="text"
        value={draft}
        maxLength={PLAYER_NAME.max}
        placeholder={PLAYER_TEXT.placeholder}
        autoComplete="off"
        spellCheck={false}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') { commit(); (e.target as HTMLInputElement).blur(); } }}
        className="bg-slate-950 border border-white/25 text-white px-3 py-2 font-hud text-[16px] focus:outline-none focus:border-cyan-300"
      />
      <span className={`font-hud text-[12px] ${tooShort ? 'text-amber-300' : 'text-slate-500'}`}>
        {tooShort ? PLAYER_TEXT.tooShort : PLAYER_TEXT.hint}
      </span>
    </label>
  );
};
