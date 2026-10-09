import { describe, it, expect } from 'vitest';
import { pickNext, shouldRepeat, Box } from '../components/padNavModel';

const box = (left: number, top: number, w = 100, h = 40): Box => ({ left, top, width: w, height: h });

// Grille de 3 cartes en haut, un bouton large en dessous
const cards = [box(0, 0), box(150, 0), box(300, 0), box(100, 200, 200)];

describe('manette : navigation spatiale', () => {
  it('gauche / droite sur une rangée', () => {
    expect(pickNext(cards, 0, 'right')).toBe(1);
    expect(pickNext(cards, 1, 'right')).toBe(2);
    expect(pickNext(cards, 2, 'left')).toBe(1);
  });
  it('pas de voisin dans la direction → -1 (le focus ne bouge pas)', () => {
    expect(pickNext(cards, 0, 'left')).toBe(-1);
    expect(pickNext(cards, 2, 'right')).toBe(-1);
    expect(pickNext(cards, 3, 'down')).toBe(-1);
  });
  it('haut / bas entre rangées : préfère l\'élément le mieux aligné', () => {
    expect(pickNext(cards, 1, 'down')).toBe(3);
    expect(pickNext(cards, 3, 'up')).toBe(1); // centre 200 : la carte du milieu (centre 200) est la mieux alignée
  });
  it('focus absent ou invalide → premier élément', () => {
    expect(pickNext(cards, -1, 'down')).toBe(0);
    expect(pickNext([], -1, 'down')).toBe(-1);
  });
  it('un élément très décalé ne passe pas devant un élément aligné', () => {
    const list = [box(0, 0), box(10, 60), box(300, 50)]; // le 2e est presque en dessous, le 3e loin à droite
    expect(pickNext(list, 0, 'down')).toBe(1);
  });
});

describe('manette : répétition des directions', () => {
  it('pas de répétition avant le délai, puis cadence régulière', () => {
    expect(shouldRepeat(100, 100)).toBe(false);
    expect(shouldRepeat(400, 400)).toBe(true);
    expect(shouldRepeat(500, 50)).toBe(false);
    expect(shouldRepeat(500, 140)).toBe(true);
  });
});
