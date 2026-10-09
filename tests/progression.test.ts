import { describe, it, expect } from 'vitest';
import { WEAPONS } from '../data/weapons';
import { PASSIVES } from '../data/passives';
import { KEYSTONES } from '../data/keystones';
import { MAX_WEAPON_SLOTS, xpForLevel } from '../constants';
import { ENEMIES } from '../data/enemies';
import { applyUpgrade, availableUpgrades, rollUpgradeOptions, MAX_WEAPON_LEVEL, KEYSTONE_LEVEL_INTERVAL } from '../engine/Progression';
import { makeState } from './helpers';

describe('Progression', () => {
  it('3 choix distincts par défaut', () => {
    const s = makeState();
    const o = rollUpgradeOptions(s);
    expect(o).toHaveLength(3);
    expect(new Set(o.map(x => x.item.id)).size).toBe(3);
  });

  it(`pas de nouvelle arme quand les ${MAX_WEAPON_SLOTS} emplacements sont pleins`, () => {
    const s = makeState({ weaponIds: WEAPONS.slice(0, MAX_WEAPON_SLOTS).map(w => w.id) });
    const owned = new Set(s.activeWeapons.map(w => w.id));
    availableUpgrades(s).filter(o => o.type === 'weapon').forEach(o => expect(owned.has(o.item.id)).toBe(true));
  });

  it(`une arme au niveau ${MAX_WEAPON_LEVEL} n'est plus proposée`, () => {
    const s = makeState({ weaponIds: ['ion_blaster'] });
    s.activeWeapons[0].level = MAX_WEAPON_LEVEL;
    expect(availableUpgrades(s).some(o => o.item.id === 'ion_blaster')).toBe(false);
  });

  it('un passif au max de stacks n\'est plus proposé', () => {
    const s = makeState();
    const p = PASSIVES[0];
    s.activePassives.push({ passive: p, stacks: p.maxStacks });
    expect(availableUpgrades(s).some(o => o.item.id === p.id)).toBe(false);
  });

  it(`keystones proposés tous les ${KEYSTONE_LEVEL_INTERVAL} niveaux`, () => {
    const s = makeState();
    s.level = KEYSTONE_LEVEL_INTERVAL - 1;
    const o = rollUpgradeOptions(s);
    expect(o.length).toBe(Math.min(3, KEYSTONES.length));
    o.forEach(x => expect(x.type).toBe('keystone'));
  });

  it("courbe d'XP : croissante, et le 1er niveau demande plus que quelques ennemis de base", () => {
    const basicXp = ENEMIES.basic.drops.count * ENEMIES.basic.drops.xp;
    expect(xpForLevel(1)).toBeGreaterThanOrEqual(basicXp * 4);
    for (let l = 1; l < 40; l++) expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
    const s = makeState();
    s.experience = s.expToNextLevel;
    applyUpgrade(s, { type: 'passive', item: PASSIVES[0] });
    expect(s.expToNextLevel).toBe(xpForLevel(2));
  });

  it('appliquer une amélioration : niveau +1, XP consommée, stats recalculées', () => {
    const s = makeState();
    s.experience = s.expToNextLevel + 5;
    const xpNeeded = s.expToNextLevel;
    const hull = PASSIVES.find(p => p.id === 'hardened_hull')!;
    applyUpgrade(s, { type: 'passive', item: hull });
    expect(s.level).toBe(2);
    expect(s.experience).toBe(5);
    expect(s.expToNextLevel).toBeGreaterThan(xpNeeded);
    expect(s.player.runtimeStats.maxHull).toBeGreaterThan(100);
  });

  it('améliorer une arme possédée augmente son niveau sans la dupliquer', () => {
    const s = makeState({ weaponIds: ['ion_blaster'] });
    applyUpgrade(s, { type: 'weapon', item: WEAPONS.find(w => w.id === 'ion_blaster')! });
    expect(s.activeWeapons).toHaveLength(1);
    expect(s.activeWeapons[0].level).toBe(2);
  });
});
