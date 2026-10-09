/** Libellés du pseudo joueur (aucun texte en dur dans les composants). */
export const PLAYER_TEXT = {
  label: 'Pseudo',
  placeholder: 'Pilote',
  hint: '2 à 16 caractères',
  tooShort: 'Au moins 2 caractères.',
  defaultName: 'Pilote',
} as const;

export const PLAYER_NAME = { min: 2, max: 16 } as const;
export const PLAYER_STORAGE_KEY = 'si.player';
