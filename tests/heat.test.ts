import { describe, it, expect } from 'vitest';
import { HEAT, heatThrottle, effectiveCooling, weaponHeatPerShot } from '../engine/Heat';
import { loadoutSummary } from '../engine/Preview';
import { weaponSummary } from '../engine/Preview';
import { WEAPONS } from '../data/weapons';
import { makeState, run } from './helpers';

describe('chaleur', () => {
  it('pleine cadence sous le seuil, bridage progressif au-dessus', () => {
    const s = makeState();
    s.heat = s.maxHeat * 0.5;
    expect(heatThrottle(s)).toBe(1);
    s.heat = s.maxHeat * (HEAT.THROTTLE_START + (1 - HEAT.THROTTLE_START) / 2);
    expect(heatThrottle(s)).toBeCloseTo(1 - (1 - HEAT.THROTTLE_MIN_RATE) / 2);
    s.heat = s.maxHeat;
    expect(heatThrottle(s)).toBeCloseTo(HEAT.THROTTLE_MIN_RATE);
  });

  it('le refroidissement accélère avec la chaleur', () => {
    const s = makeState();
    s.heat = 0;
    const cold = effectiveCooling(s);
    s.heat = s.maxHeat;
    expect(effectiveCooling(s)).toBeCloseTo(cold * (1 + HEAT.COOLING_BOOST));
  });

  it('chaque arme produit une chaleur/s comparable en Tech I (8 à 16/s)', () => {
    const s = makeState();
    for (const w of WEAPONS) {
      if (w.behavior.kind === 'drone') continue;
      const h = weaponSummary(s, { ...w, level: 1 }).heatPerSec;
      expect(h, w.id).toBeGreaterThanOrEqual(8);
      expect(h, w.id).toBeLessThanOrEqual(16);
    }
  });

  it('monter en Tech ne change pas la chaleur par seconde', () => {
    const s = makeState();
    for (const w of WEAPONS) {
      if (w.behavior.kind === 'drone') continue;
      const h1 = weaponSummary(s, { ...w, level: 1 }).heatPerSec;
      const h3 = weaponSummary(s, { ...w, level: 3 }).heatPerSec;
      expect(h3, w.id).toBeCloseTo(h1, 0);
      expect(weaponHeatPerShot(s, { ...w, level: 3 })).toBeLessThan(weaponHeatPerShot(s, { ...w, level: 1 }));
    }
  });

  it("la surchauffe ne se déclenche qu'à 100 %", () => {
    const s = makeState({ noSpawn: true, weaponIds: ['auto_cannon'] });
    s.autoFire = true;
    s.heat = s.maxHeat * 0.95;
    run(s, 0.05);
    expect(s.isOverheated).toBe(false);
  });

  it('résumé : 3 armes quasi soutenables, 6 armes nettement bridées', () => {
    const three = makeState({ weaponIds: ['ion_blaster', 'auto_cannon', 'gauss_repeater'] });
    expect(loadoutSummary(three).throttledRate).toBeGreaterThanOrEqual(0.9);
    const six = makeState({ weaponIds: ['ion_blaster', 'auto_cannon', 'gauss_repeater', 'mass_driver', 'railgun_mk2', 'fusion_rocket'] });
    expect(loadoutSummary(six).throttledRate).toBeLessThan(loadoutSummary(three).throttledRate);
  });

  it('DPS soutenu = DPS plein si la chaleur tient, inférieur sinon', () => {
    const three = makeState({ weaponIds: ['ion_blaster'] });
    const l1 = loadoutSummary(three);
    expect(l1.sustainedDps).toBe(l1.dps);
    const six = makeState({ weaponIds: ['ion_blaster', 'auto_cannon', 'gauss_repeater', 'mass_driver', 'railgun_mk2', 'fusion_rocket'] });
    const l6 = loadoutSummary(six);
    expect(l6.sustainedDps).toBeLessThan(l6.dps);
  });
});
