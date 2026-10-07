import { describe, it, expect } from 'vitest';
import { previewUpgrade, loadoutSummary } from '../engine/Preview';
import { STAT_INFO, formatStat, formatStatDelta } from '../data/statInfo';
import { PASSIVES } from '../data/passives';
import { KEYSTONES } from '../data/keystones';
import { WEAPONS } from '../data/weapons';
import { INITIAL_STATS } from '../constants';
import { makeState } from './helpers';

const passive = (id: string) => PASSIVES.find(p => p.id === id)!;
const weapon = (id: string) => WEAPONS.find(w => w.id === id)!;

describe('prévisualisation des améliorations', () => {
  it("ne modifie pas l'état réel", () => {
    const s = makeState({ weaponIds: ['ion_blaster'] });
    const snapshot = JSON.stringify({ w: s.activeWeapons, p: s.activePassives, k: s.keystones, st: s.player.runtimeStats, lvl: s.level });
    previewUpgrade(s, { type: 'passive', item: passive('hardened_hull') });
    previewUpgrade(s, { type: 'weapon', item: weapon('ion_blaster') });
    previewUpgrade(s, { type: 'keystone', item: KEYSTONES[0] });
    expect(JSON.stringify({ w: s.activeWeapons, p: s.activePassives, k: s.keystones, st: s.player.runtimeStats, lvl: s.level })).toBe(snapshot);
  });

  it('passif : +20 coque max, marqué favorable', () => {
    const s = makeState();
    const p = previewUpgrade(s, { type: 'passive', item: passive('hardened_hull') });
    const c = p.changes.find(x => x.key === 'maxHull')!;
    expect(c.after - c.before).toBeCloseTo(20);
    expect(c.good).toBe(true);
  });

  it('Calibre Lourd : +dégâts favorable, −cadence défavorable', () => {
    const s = makeState();
    const p = previewUpgrade(s, { type: 'passive', item: passive('heavy_caliber') });
    expect(p.changes.find(x => x.key === 'damageMult')!.good).toBe(true);
    expect(p.changes.find(x => x.key === 'fireRate')!.good).toBe(false);
  });

  it('baisse de chaleur générée = favorable', () => {
    const s = makeState();
    const p = previewUpgrade(s, { type: 'passive', item: passive('radiator') });
    expect(p.changes.find(x => x.key === 'heatGenMult')!.good).toBe(true);
  });

  it('nouvelle arme / Tech : le DPS du build augmente', () => {
    const s = makeState({ weaponIds: ['ion_blaster'] });
    const add = previewUpgrade(s, { type: 'weapon', item: weapon('auto_cannon') });
    expect(add.loadoutAfter.weapons).toHaveLength(2);
    expect(add.loadoutAfter.dps).toBeGreaterThan(add.loadoutBefore.dps);
    const up = previewUpgrade(s, { type: 'weapon', item: weapon('ion_blaster') });
    expect(up.loadoutAfter.weapons[0].level).toBe(2);
    expect(up.loadoutAfter.dps).toBeGreaterThan(up.loadoutBefore.dps);
  });

  it('synergie franchie : son bonus apparaît dans la prévisualisation', () => {
    // 1 arme cinétique + un 2e objet cinétique → palier Balistique 2 (+6 % critique)
    const s = makeState({ weaponIds: ['auto_cannon'] });
    const p = previewUpgrade(s, { type: 'weapon', item: weapon('gauss_repeater') });
    expect(p.changes.find(x => x.key === 'critChance')!.after - INITIAL_STATS.critChance).toBeCloseTo(0.06);
  });

  it('résumé thermique : soutenable avec une arme, surchauffe avec beaucoup', () => {
    const one = makeState({ weaponIds: ['ion_blaster'] });
    expect(loadoutSummary(one).secondsToOverheat).toBe(Infinity);
    const many = makeState({ weaponIds: ['auto_cannon', 'gauss_repeater', 'mass_driver', 'railgun_mk2', 'siege_slug', 'fusion_rocket'] });
    expect(Number.isFinite(loadoutSummary(many).secondsToOverheat)).toBe(true);
  });

  it('formats', () => {
    expect(formatStat('critChance', 0.12)).toBe('12 %');
    expect(formatStat('damageMult', 1.15)).toBe('+15 %');
    expect(formatStatDelta('maxHull', 100, 120)).toBe('+20');
    expect(formatStatDelta('fireRate', 1, 0.95)).toBe('−5 %');
    Object.values(STAT_INFO).forEach(i => expect(i!.label.length).toBeGreaterThan(0));
  });
});
