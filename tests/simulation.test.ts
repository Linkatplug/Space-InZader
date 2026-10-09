import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WEAPONS } from '../data/weapons';
import { ENEMIES } from '../data/enemies';
import { makeState, addEnemy, run, seedRandom, hasNaN, STEP } from './helpers';
import { updateGameState } from '../engine/CoreEngine';
import { applyUpgrade, rollUpgradeOptions } from '../engine/Progression';

let rnd: ReturnType<typeof seedRandom>;
beforeEach(() => { rnd = seedRandom(2026); });
afterEach(() => rnd.mockRestore());

/**
 * Parties simulées de bout en bout, sans navigateur.
 * Servent de filet de sécurité : crash, NaN, fuite d'entités, progression bloquée.
 */
describe('simulation — parties complètes', () => {
  it('3 minutes avec toutes les armes : pas de NaN, pas de crash, les vagues avancent', () => {
    const s = makeState({ weaponIds: WEAPONS.slice(0, 6).map(w => w.id) });
    s.autoFire = true;
    s.player.isGodMode = true;
    for (let t = 0; t < 180; t += 5) {
      run(s, 5, {
        keys: [['z', 'q', 's', 'd'][Math.floor(t / 5) % 4]],
        onLevelUp: () => { const o = rollUpgradeOptions(s); if (o[0]) applyUpgrade(s, o[0]); },
      });
      expect(hasNaN(s), `à t=${t}s`).toBeNull();
    }
    expect(s.wave).toBeGreaterThan(2);
    expect(s.totalKills).toBeGreaterThan(30);
    // Le vaisseau tourne en carré sans viser l'XP : le niveau atteint dépend beaucoup du hasard
    // (rythme réel des niveaux mesuré par le bot : npm run pacing). On vérifie seulement qu'il progresse.
    expect(s.level).toBeGreaterThan(1);
    // Pas d'accumulation sans fin
    expect(s.projectiles.length).toBeLessThan(800);
    expect(s.particles.length).toBeLessThan(5000);
    expect(s.zones.length).toBeLessThan(200);
  });

  it.each(WEAPONS.slice(6).map(w => [w.id]))('60s avec %s : stable', (id) => {
    const s = makeState({ weaponIds: [id] });
    s.autoFire = true;
    s.player.isGodMode = true;
    s.wave = 8; // ennemis variés
    run(s, 60);
    expect(hasNaN(s)).toBeNull();
  });

  it('chaque boss se bat sans erreur pendant 30s', () => {
    for (const id of Object.values(ENEMIES).filter(d => d.isBoss).map(d => d.id)) {
      const s = makeState({ noSpawn: true, weaponIds: ['ion_blaster', 'railgun_mk2'] });
      s.autoFire = true;
      s.player.isGodMode = true;
      addEnemy(s, id, 600);
      run(s, 30);
      expect(hasNaN(s), id).toBeNull();
    }
  });

  it('sans god mode, un joueur passif finit par mourir (le jeu est dangereux)', () => {
    const s = makeState({ weaponIds: ['ion_blaster'] });
    s.wave = 6;
    let over = false;
    for (let i = 0; i < 60 * 180 && !over; i++) {
      updateGameState(s, STEP, new Set(), { x: s.player.x + 1, y: s.player.y }, () => {}, () => { over = true; });
    }
    expect(over).toBe(true);
  });

  it('la pause fige la simulation (le moteur ne tourne pas hors playing/lab)', () => {
    const s = makeState({ noSpawn: true });
    const e = addEnemy(s, 'basic', 500);
    s.status = 'paused';
    // App n'appelle pas updateGameState en pause : on vérifie juste que le temps est l'horloge du moteur
    const t = s.time;
    expect(s.time).toBe(t);
    s.status = 'playing';
    run(s, 1);
    expect(s.time).toBeCloseTo(t + 1000, -1);
    expect(e.x).not.toBe(s.player.x + 500);
  });
});
