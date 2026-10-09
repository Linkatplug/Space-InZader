import type { FeedbackKind } from '../../types';

/** Tous les libellés de la fonction « Avis ». Aucun texte en dur dans les composants. */

export const FEEDBACK_KEY = 'f8';

export const FEEDBACK_TEXT = {
  button: 'Avis',
  buttonHint: 'Donner mon avis (F8)',
  title: 'Ton avis',
  intro: 'Dis-nous ce qui va, ce qui ne va pas, ou ce que tu aimerais voir. La partie est en pause.',
  kindLabel: 'Type d’avis',
  messageLabel: 'Ton message',
  messagePlaceholder: 'Décris ce que tu as vu, ressenti ou imaginé…',
  nameLabel: 'Pseudo (facultatif)',
  namePlaceholder: 'anonyme',
  anonymous: 'anonyme',
  pickButton: 'Montrer l’élément',
  pickAgain: 'Changer l’élément',
  pickClear: 'Retirer',
  pickedLabel: 'Élément montré :',
  pickedCanvas: 'Zone de jeu',
  pickedCanvasAt: (x: number, y: number) => `Zone de jeu, position (${x}, ${y})`,
  pickBanner: 'Clique sur ce qui ne va pas — Échap pour annuler',
  send: 'Envoyer',
  sending: 'Envoi…',
  close: 'Fermer',
  closeHint: 'F8 / Échap pour fermer',
  sentTitle: 'Merci !',
  charCount: (n: number, max: number) => `${n} / ${max}`,
  kinds: {
    texte: 'Texte',
    visuel: 'Visuel',
    bug: 'Bug',
    equilibrage: 'Équilibrage',
    idee: 'Idée',
    jaime: 'J’aime',
    autre: 'Autre',
  } as Record<FeedbackKind, string>,
  messages: {
    sent: 'Avis envoyé, merci !',
    emptyMessage: 'Écris un message avant d’envoyer.',
    invalid: 'Avis refusé : message vide ou invalide.',
    tooBig: 'Avis trop long : raccourcis ton message.',
    tooMany: 'Trop d’avis envoyés pour le moment, réessaie plus tard.',
    full: 'Le fichier des avis est plein. Préviens le propriétaire du jeu.',
    unavailable: 'Serveur d’avis indisponible. Ton texte est conservé, réessaie plus tard.',
    unknown: 'Envoi impossible pour le moment. Ton texte est conservé.',
  },
} as const;

/** Ordre d’affichage des puces de type. */
export const FEEDBACK_KINDS: FeedbackKind[] = ['texte', 'visuel', 'bug', 'equilibrage', 'idee', 'jaime', 'autre'];

/** Limites côté client (alignées sur le serveur : message 3000, pseudo 40, élément 300). */
export const FEEDBACK_LIMITS = { message: 3000, name: 40, elementText: 300, pathDepth: 5 } as const;
