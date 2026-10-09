import type { FeedbackContext, FeedbackElement, FeedbackKind, FeedbackPayload, FeedbackSnapshot } from '../../types';
import { FEEDBACK_LIMITS } from './text';

/** Parties pures (sans React) de la fonction « Avis » : testables sous Node. */

export const truncate = (s: string, max: number): string => (s.length > max ? s.slice(0, max) : s);

/** Forme minimale d’un élément DOM (permet les tests sans navigateur). */
export interface ElementLike {
  tagName: string;
  id?: string;
  classList?: ArrayLike<string>;
  parentElement?: ElementLike | null;
  textContent?: string | null;
}

const segment = (el: ElementLike): string => {
  const tag = el.tagName.toLowerCase();
  if (el.id) return `${tag}#${el.id}`;
  const cls = el.classList && el.classList.length > 0 ? el.classList[0] : '';
  return cls ? `${tag}.${cls}` : tag;
};

/** Chemin lisible, du plus haut au plus bas, limité à `depth` niveaux (ex. `div.hud > div.weapons > span`). */
export const elementPath = (el: ElementLike, depth: number = FEEDBACK_LIMITS.pathDepth): string => {
  const parts: string[] = [];
  for (let cur: ElementLike | null | undefined = el; cur && parts.length < depth; cur = cur.parentElement) {
    const tag = cur.tagName.toLowerCase();
    if (tag === 'body' || tag === 'html') break;
    parts.unshift(segment(cur));
  }
  return parts.length ? parts.join(' > ') : segment(el);
};

/** Texte visible de l’élément : espaces compactés, ≤ 300 caractères. */
export const elementText = (el: ElementLike, max: number = FEEDBACK_LIMITS.elementText): string =>
  truncate((el.textContent ?? '').replace(/\s+/g, ' ').trim(), max);

export const describeElement = (el: ElementLike): FeedbackElement => ({ text: elementText(el), path: elementPath(el) });

/** Élément « zone de jeu » : chemin 'canvas' + coordonnées monde du point cliqué. */
export const canvasElement = (world: { x: number; y: number }): FeedbackElement => ({
  text: '', path: 'canvas', world: { x: Math.round(world.x), y: Math.round(world.y) },
});

export interface FeedbackForm { kind: FeedbackKind; message: string; name: string; website: string; element?: FeedbackElement }

export const isFormValid = (form: Pick<FeedbackForm, 'message'>): boolean => form.message.trim().length > 0;

export const buildContext = (
  input: { status: string; startTime: number; now: number; touch: boolean; width: number; height: number; build: string },
): FeedbackContext => ({
  status: input.status,
  playtimeMin: Math.max(0, Math.round(((input.now - input.startTime) / 60000) * 10) / 10),
  device: input.touch ? 'telephone' : 'ordinateur',
  viewport: `${Math.round(input.width)}x${Math.round(input.height)}`,
  build: input.build,
});

export const buildPayload = (form: FeedbackForm, snapshot: FeedbackSnapshot, context: FeedbackContext): FeedbackPayload => {
  const payload: FeedbackPayload = {
    kind: form.kind,
    message: truncate(form.message.trim(), FEEDBACK_LIMITS.message),
    name: truncate(form.name.trim(), FEEDBACK_LIMITS.name),
    website: form.website,
    snapshot,
    context,
  };
  if (form.element) payload.element = { ...form.element, text: truncate(form.element.text, FEEDBACK_LIMITS.elementText) };
  return payload;
};
