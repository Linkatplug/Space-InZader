import { describe, it, expect } from 'vitest';
import { canvasElement, buildContext, buildPayload, elementPath, elementText, isFormValid, truncate, ElementLike } from '../components/feedback/logic';
import { messageForStatus, sendFeedback } from '../components/feedback/api';
import { FEEDBACK_KINDS, FEEDBACK_LIMITS, FEEDBACK_TEXT } from '../components/feedback/text';
import type { FeedbackSnapshot } from '../types';

const el = (tagName: string, classes: string[] = [], parent: ElementLike | null = null, extra: Partial<ElementLike> = {}): ElementLike =>
  ({ tagName: tagName.toUpperCase(), classList: classes, parentElement: parent, ...extra });

const snapshot: FeedbackSnapshot = { status: 'playing', wave: 3 };
const context = buildContext({ status: 'playing', startTime: 0, now: 90_000, touch: false, width: 1280.4, height: 720, build: '162' });

describe('chemin d’élément', () => {
  it('liste tag.classe du haut vers le bas', () => {
    const root = el('div', ['hud']);
    const mid = el('div', ['weapons', 'x'], root);
    expect(elementPath(el('span', [], mid))).toBe('div.hud > div.weapons > span');
  });
  it('limite à 5 niveaux et s’arrête avant body', () => {
    let cur = el('body');
    const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    for (const n of names) cur = el('div', [n], cur);
    expect(elementPath(cur).split(' > ')).toEqual(['div.c', 'div.d', 'div.e', 'div.f', 'div.g']);
    expect(elementPath(el('div', ['solo'], el('body')))).toBe('div.solo');
  });
  it('préfère l’id', () => {
    expect(elementPath(el('button', ['btn'], null, { id: 'ok' }))).toBe('button#ok');
  });
});

describe('troncatures', () => {
  it('truncate coupe sans modifier le court', () => {
    expect(truncate('abc', 5)).toBe('abc');
    expect(truncate('abcdef', 3)).toBe('abc');
  });
  it('texte d’élément compacté et ≤ 300', () => {
    expect(elementText(el('p', [], null, { textContent: '  a \n  b  ' }))).toBe('a b');
    expect(elementText(el('p', [], null, { textContent: 'x'.repeat(500) })).length).toBe(FEEDBACK_LIMITS.elementText);
  });
  it('élément canvas : chemin et monde arrondi', () => {
    expect(canvasElement({ x: 10.6, y: 3.2 })).toEqual({ text: '', path: 'canvas', world: { x: 11, y: 3 } });
  });
});

describe('message selon le code', () => {
  it('201 ok, erreurs claires', () => {
    expect(messageForStatus(201)).toEqual({ ok: true, message: FEEDBACK_TEXT.messages.sent });
    expect(messageForStatus(400).message).toBe(FEEDBACK_TEXT.messages.invalid);
    expect(messageForStatus(413).message).toBe(FEEDBACK_TEXT.messages.tooBig);
    expect(messageForStatus(429).message).toBe(FEEDBACK_TEXT.messages.tooMany);
    expect(messageForStatus(507).message).toBe(FEEDBACK_TEXT.messages.full);
  });
  it('indisponible : réseau, 404, 502', () => {
    for (const c of [0, 404, 502]) expect(messageForStatus(c)).toEqual({ ok: false, message: FEEDBACK_TEXT.messages.unavailable });
    expect(messageForStatus(500).message).toBe(FEEDBACK_TEXT.messages.unknown);
  });
  it('sendFeedback : réponse HTTP et réseau en échec', async () => {
    const payload = buildPayload({ kind: 'bug', message: 'x', name: '', website: '' }, snapshot, context);
    const ok = await sendFeedback(payload, (async () => ({ status: 201 })) as unknown as typeof fetch);
    expect(ok.ok).toBe(true);
    const down = await sendFeedback(payload, (async () => { throw new TypeError('network'); }) as unknown as typeof fetch);
    expect(down).toEqual({ ok: false, message: FEEDBACK_TEXT.messages.unavailable });
  });
});

describe('payload', () => {
  it('contexte : temps de jeu, appareil, viewport, build', () => {
    expect(context).toEqual({ status: 'playing', playtimeMin: 1.5, device: 'ordinateur', viewport: '1280x720', build: '162' });
    expect(buildContext({ status: 'menu', startTime: 0, now: 0, touch: true, width: 390, height: 844, build: 'x' }).device).toBe('telephone');
  });
  it('rogne les champs aux limites et garde l’instantané', () => {
    const p = buildPayload({
      kind: 'idee', message: ` ${'m'.repeat(4000)} `, name: ' '.concat('n'.repeat(80)), website: '',
      element: { text: 't'.repeat(400), path: 'div' },
    }, snapshot, context);
    expect(p.message.length).toBe(FEEDBACK_LIMITS.message);
    expect(p.name.length).toBe(FEEDBACK_LIMITS.name);
    expect(p.element?.text.length).toBe(FEEDBACK_LIMITS.elementText);
    expect(p.snapshot).toBe(snapshot);
    expect(p.kind).toBe('idee');
  });
  it('sans élément : pas de clé element', () => {
    expect('element' in buildPayload({ kind: 'bug', message: 'a', name: '', website: '' }, snapshot, context)).toBe(false);
  });
  it('message vide invalide', () => {
    expect(isFormValid({ message: '  \n ' })).toBe(false);
    expect(isFormValid({ message: 'ok' })).toBe(true);
  });
  it('un libellé par type', () => {
    for (const k of FEEDBACK_KINDS) expect(FEEDBACK_TEXT.kinds[k]).toBeTruthy();
  });
});
