import { describe, it, expect } from 'vitest';
import { previewUpgrade, LoadoutSummary } from '../engine/Preview';
import { statGroups, buildIndicators, thermalView, cardHeat, fmt1, totalDefense, CORE_STATS, PRIMARY_GROUPS, BuildSnapshot } from '../components/Menu/levelUpModel';
import { PASSIVES } from '../data/passives';
import { KEYSTONES } from '../data/keystones';
import { WEAPONS } from '../data/weapons';
import { makeState } from './helpers';

const passive = (id: string) => PASSIVES.find(p => p.id === id)!;
const weapon = (id: string) => WEAPONS.find(w => w.id === id)!;
const keystone = (id: string) => KEYSTONES.find(k => k.id === id)!;

const loadout = (o: Partial<LoadoutSummary>): LoadoutSummary => ({
  weapons: [], dps: 100, sustainedDps: 100, heatPerSec: 14, coolingPerSec: 25, secondsToOverheat: Infinity, throttledRate: 1, ...o,
});
const STATS = makeState().player.runtimeStats;
const snap = (o: Partial<LoadoutSummary>, stats = STATS): BuildSnapshot => ({ stats, loadout: loadout(o) });

describe('level-up : panneau de stats', () => {
  it('sans aperçu : stats principales affichées, aucune valeur modifiée', () => {
    const s = makeState({ weaponIds: ['ion_blaster'] });
    const groups = statGroups(s.player.runtimeStats);
    const keys = groups.flatMap(g => g.rows.map(r => r.key));
    CORE_STATS.forEach(k => expect(keys).toContain(k));
    expect(groups.slice(0, 3).map(g => g.group)).toEqual(PRIMARY_GROUPS);
    expect(groups.every(g => g.changed === 0)).toBe(true);
  });

  it('Calibre Lourd : dégâts en vert, cadence en rouge, le reste neutre', () => {
    const s = makeState({ weaponIds: ['ion_blaster'] });
    const p = previewUpgrade(s, { type: 'passive', item: passive('heavy_caliber') });
    const rows = statGroups(p.before, p.changes).flatMap(g => g.rows);
    expect(rows.find(r => r.key === 'damageMult')).toMatchObject({ good: true });
    expect(rows.find(r => r.key === 'fireRate')).toMatchObject({ good: false });
    expect(rows.find(r => r.key === 'fireRate')!.delta).toMatch(/^−/);
    expect(rows.find(r => r.key === 'maxHull')!.delta).toBeUndefined();
  });

  it('keystone : ses modificateurs apparaissent comme changements', () => {
    const s = makeState({ weaponIds: ['ion_blaster'] });
    const p = previewUpgrade(s, { type: 'keystone', item: keystone('overclock_core') });
    const changed = statGroups(p.before, p.changes).flatMap(g => g.rows).filter(r => r.delta).map(r => r.key);
    expect(changed).toEqual(expect.arrayContaining(['damageMult', 'fireRate', 'heatGenMult']));
  });

  it('une stat secondaire modifiée est ajoutée même si elle était neutre', () => {
    const before = makeState().player.runtimeStats;
    const groups = statGroups(before, [{ key: 'xpMult', before: 1, after: 1.15, good: true }]);
    expect(groups.find(g => g.group === 'Utilitaire')!.rows.find(r => r.key === 'xpMult')!.next).toBeDefined();
  });
});

describe('level-up : indicateurs du build et chaleur', () => {
  it('sans aperçu : DPS, cadence soutenable, défense totale, sans écart', () => {
    const inds = buildIndicators(snap({}));
    expect(inds.map(i => i.id)).toEqual(['dps', 'sustain', 'defense']);
    expect(inds.every(i => i.delta === undefined)).toBe(true);
    expect(inds.find(i => i.id === 'sustain')!.value).toBe('100 %');
    expect(inds.find(i => i.id === 'defense')!.value).toBe(String(totalDefense(STATS)));
  });

  it('cadence soutenable qui baisse : rouge ; qui remonte : vert', () => {
    const worse = buildIndicators(snap({}), snap({ throttledRate: 0.82, heatPerSec: 60 }));
    expect(worse.find(i => i.id === 'sustain')).toMatchObject({ next: '82 %', delta: '−18 %', good: false });
    const better = buildIndicators(snap({ throttledRate: 0.82 }), snap({ throttledRate: 1 }));
    expect(better.find(i => i.id === 'sustain')).toMatchObject({ next: '100 %', good: true });
  });

  it('défense totale : +20 coque → écart favorable', () => {
    const tougher = { ...STATS, maxHull: STATS.maxHull + 20 };
    expect(buildIndicators(snap({}), snap({}, tougher)).find(i => i.id === 'defense')).toMatchObject({ delta: '+20', good: true });
  });

  it('bloc chaleur : production, refroidissement (à chaud plus élevé) et cadence avant → après', () => {
    const t = thermalView(loadout({ heatPerSec: 40, coolingPerSec: 37 }));
    expect(t).toMatchObject({ produced: 40, cooled: 37, rate: '100 %' });
    expect(t.cooledMax).toBeGreaterThan(37);
    expect(t.scale).toBeGreaterThanOrEqual(Math.max(t.produced, t.cooledMax));
    const t2 = thermalView(loadout({}), loadout({ heatPerSec: 70, throttledRate: 0.6 }));
    expect(t2).toMatchObject({ rate: '100 %', rateNext: '60 %', good: false, producedBefore: 14 });
  });

  it('carte d\'arme nouvelle : « Chaleur +X/s »', () => {
    const s = makeState({ weaponIds: ['ion_blaster'] });
    const p = previewUpgrade(s, { type: 'weapon', item: weapon('auto_cannon') });
    const h = cardHeat(p, 'auto_cannon');
    expect(h.weapon!.before).toBeUndefined();
    expect(h.weapon!.after).toBeGreaterThan(0);
  });

  it('carte Tech+1 : chaleur/s de l\'arme inchangée', () => {
    const s = makeState({ weaponIds: ['ion_blaster'] });
    const p = previewUpgrade(s, { type: 'weapon', item: weapon('ion_blaster') });
    expect(cardHeat(p, 'ion_blaster').weapon).toMatchObject({ unchanged: true });
  });

  it('carte de passif : pas de ligne d\'arme', () => {
    const s = makeState({ weaponIds: ['ion_blaster'] });
    expect(cardHeat(previewUpgrade(s, { type: 'passive', item: passive('heavy_caliber') })).weapon).toBeUndefined();
  });

  it('fmt1 : virgule française', () => {
    expect(fmt1(14.46)).toBe('14,5');
    expect(fmt1(40)).toBe('40');
  });
});

describe('level-up : ajustement à l\'écran', () => {
  it('fitScale : limité par la hauteur ou la largeur, borné', async () => {
    const { fitScale, FIT_DEFAULTS } = await import('../components/Menu/FitToScreen');
    const pad = FIT_DEFAULTS.pad;
    // Contenu 1200×800 dans 1920×970 : la hauteur limite
    expect(fitScale(1200, 800, 1920, 970)).toBeCloseTo((970 - 2 * pad) / 800);
    // Très grand écran : plafonné
    expect(fitScale(1200, 400, 5000, 3000)).toBe(FIT_DEFAULTS.max);
    // Fenêtre minuscule : plancher (on accepte alors de défiler)
    expect(fitScale(1200, 800, 600, 300)).toBe(FIT_DEFAULTS.min);
    // Contenu non mesuré : neutre
    expect(fitScale(1200, 0, 1920, 970)).toBe(1);
  });
});
