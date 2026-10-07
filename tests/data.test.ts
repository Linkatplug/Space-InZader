import { describe, it, expect } from 'vitest';
import { WEAPONS } from '../data/weapons';
import { PASSIVES } from '../data/passives';
import { KEYSTONES } from '../data/keystones';
import { ENEMIES, BOSS_ROTATION, BOSS_WAVE_INTERVAL, bossForWave, pickEnemyType } from '../data/enemies';
import { FIRE_HANDLERS } from '../engine/WeaponSystem';
import { AI_BEHAVIORS } from '../ai/EnemyAI';
import { ATTACK_PATTERNS } from '../engine/EnemyAttacks';
import { INITIAL_STATS } from '../constants';
import { STARTING_WEAPON_ID } from '../engine/GameFactory';

/** Intégrité du contenu : attrape les fautes de frappe dans data/ avant qu'elles cassent le jeu. */

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe('données — armes', () => {
  it('ids uniques', () => expect(unique(WEAPONS.map(w => w.id))).toBe(true));
  it("l'arme de départ existe", () => expect(WEAPONS.some(w => w.id === STARTING_WEAPON_ID)).toBe(true));
  it.each(WEAPONS.map(w => [w.id, w] as const))('%s : comportement valide et stats positives', (_id, w) => {
    expect(FIRE_HANDLERS[w.behavior.kind]).toBeTypeOf('function');
    expect(w.damage).toBeGreaterThan(0);
    expect(w.fireRate).toBeGreaterThan(0);
    expect(w.range).toBeGreaterThan(0);
    expect(w.heatPerShot).toBeGreaterThanOrEqual(0);
    if (w.behavior.kind === 'projectile') expect(w.bulletSpeed).toBeGreaterThan(0);
  });
});

describe('données — passifs & keystones', () => {
  it('ids uniques', () => {
    expect(unique(PASSIVES.map(p => p.id))).toBe(true);
    expect(unique(KEYSTONES.map(k => k.id))).toBe(true);
  });
  it('chaque modificateur cible une stat existante', () => {
    for (const item of [...PASSIVES, ...KEYSTONES]) {
      for (const m of item.modifiers) expect(Object.keys(INITIAL_STATS), `${item.id} → ${m.property}`).toContain(m.property);
    }
  });
  it('maxStacks ≥ 1', () => PASSIVES.forEach(p => expect(p.maxStacks).toBeGreaterThanOrEqual(1)));
});

describe('données — ennemis', () => {
  it('la clé correspond à l\'id', () => Object.entries(ENEMIES).forEach(([k, d]) => expect(d.id).toBe(k)));
  it.each(Object.values(ENEMIES).map(d => [d.id, d] as const))('%s : références valides', (_id, d) => {
    expect(AI_BEHAVIORS[d.ai]).toBeTypeOf('function');
    for (const a of d.attacks ?? []) {
      expect(ATTACK_PATTERNS[a.pattern]).toBeTypeOf('function');
      if (a.pattern === 'summon') expect(ENEMIES[a.summonId!]).toBeDefined();
    }
    if (d.splitInto) expect(ENEMIES[d.splitInto.id]).toBeDefined();
    expect(d.hull).toBeGreaterThan(0);
    expect(d.radius).toBeGreaterThan(0);
  });
  it('les boss en rotation existent et sont des boss', () => {
    BOSS_ROTATION.forEach(id => expect(ENEMIES[id]?.isBoss).toBe(true));
    expect(bossForWave(BOSS_WAVE_INTERVAL)).toBe(BOSS_ROTATION[0]);
    expect(bossForWave(BOSS_WAVE_INTERVAL * 2)).toBe(BOSS_ROTATION[1]);
    // La rotation boucle après le dernier boss
    expect(bossForWave(BOSS_WAVE_INTERVAL * (BOSS_ROTATION.length + 1))).toBe(BOSS_ROTATION[0]);
  });
  it('le tirage ne renvoie que des ennemis autorisés pour la vague', () => {
    for (const wave of [1, 2, 5, 10, 30]) {
      for (let r = 0; r < 1; r += 0.01) {
        const id = pickEnemyType(wave, r);
        expect(ENEMIES[id].spawnWeight(wave), `vague ${wave} → ${id}`).toBeGreaterThan(0);
        expect(ENEMIES[id].isBoss).toBeFalsy();
      }
    }
  });
  it('vague 1 : uniquement des drones de base', () => {
    for (let r = 0; r < 1; r += 0.05) expect(pickEnemyType(1, r)).toBe('basic');
  });
});
