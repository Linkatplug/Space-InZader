import { describe, it, expect } from 'vitest';
import {
  applyDeadzone, readPad, diffActions, aimScreenPoint, mergeAnalog, GAMEPAD_BUTTONS, GAMEPAD_CONFIG, PadSnapshot,
} from '../engine/GamepadInput';

const snap = (axes: number[] = [0, 0, 0, 0], down: number[] = []): PadSnapshot => ({
  axes,
  buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: down.includes(i), value: down.includes(i) ? 1 : 0 })),
});

describe('manette : zone morte', () => {
  it('sous le seuil → zéro, au seuil exact aussi', () => {
    expect(applyDeadzone(0.1, 0.1)).toEqual({ x: 0, y: 0 });
    expect(applyDeadzone(GAMEPAD_CONFIG.deadzone, 0)).toEqual({ x: 0, y: 0 });
  });
  it('ré-étalement continu : juste au-dessus du seuil ≈ 0, plein débattement = 1', () => {
    expect(Math.hypot(...Object.values(applyDeadzone(GAMEPAD_CONFIG.deadzone + 0.01, 0)))).toBeLessThan(0.05);
    const full = applyDeadzone(0.6, 0.8);
    expect(Math.hypot(full.x, full.y)).toBeCloseTo(1);
    expect(full.x / full.y).toBeCloseTo(0.75); // la direction est conservée
  });
  it('radiale : une diagonale à 0.2/0.2 (longueur 0.28) passe, contrairement à une zone morte par axe', () => {
    const v = applyDeadzone(0.2, 0.2);
    expect(v.x).toBeGreaterThan(0);
    expect(v.x).toBeCloseTo(v.y);
  });
  it('valeurs aberrantes (NaN) → zéro', () => {
    expect(applyDeadzone(NaN, 1)).toEqual({ x: 0, y: 0 });
  });
});

describe('manette : lecture', () => {
  it('au repos : rien', () => {
    const s = readPad(snap());
    expect(s.move).toEqual({ x: 0, y: 0 });
    expect(s.aimActive).toBe(false);
    expect(s.held.size).toBe(0);
  });
  it('stick gauche = déplacement, stick droit = visée', () => {
    const s = readPad(snap([1, 0, 0, -1]));
    expect(s.move.x).toBeCloseTo(1);
    expect(s.aimActive).toBe(true);
    expect(s.aim.y).toBeCloseTo(-1);
  });
  it('petit mouvement du stick droit : visée auto (aimActive faux)', () => {
    expect(readPad(snap([0, 0, 0.25, 0])).aimActive).toBe(false);
  });
  it('boutons du mapping : A dash, B nova, Y tir auto, Start pause, Select avis', () => {
    const pressed = (b: number) => [...readPad(snap(undefined, [b])).held];
    expect(pressed(0)).toEqual(expect.arrayContaining(['dash', 'confirm']));
    expect(pressed(1)).toEqual(expect.arrayContaining(['nova', 'back']));
    expect(pressed(3)).toContain('autoFire');
    expect(pressed(9)).toContain('pause');
    expect(pressed(8)).toContain('feedback');
  });
  it('gâchette analogique : tire à partir du seuil', () => {
    const s = snap();
    (s.buttons as any)[7] = { pressed: false, value: 0.4 };
    expect(readPad(s).held.has('fire')).toBe(false);
    (s.buttons as any)[7] = { pressed: false, value: 0.7 };
    expect(readPad(s).held.has('fire')).toBe(true);
  });
  it('croix directionnelle et stick gauche (menus)', () => {
    expect(readPad(snap(undefined, [14])).held.has('left')).toBe(true);
    expect(readPad(snap([0.9, 0.1, 0, 0])).held.has('right')).toBe(true);
    expect(readPad(snap([0.3, 0, 0, 0])).held.has('right')).toBe(false);
    expect(readPad(snap([0.1, -0.9, 0, 0])).held.has('up')).toBe(true);
  });
  it('mapping piloté par une table de données', () => {
    const custom = { ...GAMEPAD_BUTTONS, dash: [2] };
    expect(readPad(snap(undefined, [2]), custom).held.has('dash')).toBe(true);
    expect(readPad(snap(undefined, [0]), custom).held.has('dash')).toBe(false);
  });
  it('manette à moins de boutons : pas de plantage', () => {
    expect(() => readPad({ axes: [], buttons: [] })).not.toThrow();
  });
});

describe('manette : fronts, visée, fusion', () => {
  it('fronts montants et descendants', () => {
    const a = new Set(['dash', 'fire'] as const);
    const b = new Set(['fire', 'nova'] as const);
    expect(diffActions(a, b)).toEqual({ pressed: ['nova'], released: ['dash'] });
  });
  it('point de visée : à rayon fixe dans la direction du stick', () => {
    const p = aimScreenPoint({ x: 500, y: 300 }, { x: 0, y: -0.4 }, 200);
    expect(p).toEqual({ x: 500, y: 100 });
  });
  it('fusion tactile / manette : la manette gagne quand elle est sollicitée', () => {
    expect(mergeAnalog({ x: 1, y: 0 }, { x: 0, y: 0 })).toEqual({ x: 1, y: 0 });
    expect(mergeAnalog({ x: 1, y: 0 }, { x: 0, y: 0.5 })).toEqual({ x: 0, y: 0.5 });
  });
});
