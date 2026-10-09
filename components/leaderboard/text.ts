/** Libellés du classement en ligne (aucun texte en dur dans les composants). */
export const LEADERBOARD_TEXT = {
  title: 'Classement',
  loading: 'Chargement du classement…',
  unavailable: 'Classement indisponible',
  empty: 'Aucun score pour le moment.',
  newPersonalBest: 'Nouveau record perso !',
  you: 'toi',
  columns: { rank: '#', name: 'Pilote', score: 'Score', wave: 'Vague', time: 'Durée', ship: 'Vaisseau' },
  messages: {
    invalid: 'Score refusé par le serveur.',
    tooBig: 'Score refusé : envoi trop gros.',
    tooMany: 'Trop d’envois pour le moment, réessaie plus tard.',
    unavailable: 'Classement indisponible',
    unknown: 'Classement indisponible pour le moment.',
  },
  /** « Tu es 37e sur 120 » */
  yourRank: (rank: number, total: number, ordinal: string) => `Tu es ${ordinal} sur ${total}`,
} as const;

export const LEADERBOARD_TOP = 10;
