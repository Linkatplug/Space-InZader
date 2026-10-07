import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WEAPONS } from '../data/weapons';
import { makeState, addEnemy, run, seedRandom, totalHp } from './helpers';

let rnd: ReturnType<typeof seedRandom>;
beforeEach(() => { rnd = seedRandom(123); });
afterEach(() => rnd.mockRestore());

/**
 * Chaque arme, seule, en tir automatique, doit blesser un ennemi qui approche
 * du joueur dans l'axe de visée. Détecte une arme « morte » (mauvais paramètres, routine cassée).
 */
describe('armes — chacune inflige des dégâts', () => {
  it.each(WEAPONS.map(w => [w.id] as const))('%s', (id) => {
    const s = makeState({ noSpawn: true, weaponIds: [id] });
    s.autoFire = true;
    s.player.isGodMode = true;
    const e = addEnemy(s, 'tank', 350);
    e.defense.hull *= 50; // ne doit pas mourir pendant le test
    e.baseStats.maxHull = e.defense.hull;
    const before = totalHp(e);
    // 8s : laisse le temps aux mines (posées derrière le vaisseau) d'être atteintes
    run(s, 8, { mouse: { x: e.x, y: e.y } });
    expect(totalHp(e)).toBeLessThan(before);
  });
});

describe('armes — comportements spécifiques', () => {
  const setup = (id: string) => {
    const s = makeState({ noSpawn: true, weaponIds: [id] });
    s.autoFire = true;
    s.player.isGodMode = true;
    return s;
  };

  it('railgun : transperce plusieurs ennemis alignés', () => {
    const s = setup('railgun_mk2');
    const a = addEnemy(s, 'tank', 300); const b = addEnemy(s, 'tank', 420); const c = addEnemy(s, 'tank', 540);
    [a, b, c].forEach(e => { e.defense.hull *= 50; e.baseStats.speed = 0; });
    const hp = [a, b, c].map(totalHp);
    run(s, 0.5, { mouse: { x: s.player.x + 1000, y: s.player.y } });
    [a, b, c].forEach((e, i) => expect(totalHp(e), `cible ${i}`).toBeLessThan(hp[i]));
  });

  it('missile guidé : touche une cible hors de l\'axe de visée', () => {
    const s = setup('overload_missile');
    const e = addEnemy(s, 'tank', 0, 400);
    e.defense.hull *= 50; e.baseStats.speed = 0;
    const hp = totalHp(e);
    run(s, 3, { mouse: { x: s.player.x + 1000, y: s.player.y } }); // vise à droite, cible en bas
    expect(totalHp(e)).toBeLessThan(hp);
  });

  it('arc électrique : rebondit sur plusieurs cibles', () => {
    const s = setup('arc_disruptor');
    const es = [addEnemy(s, 'tank', 300), addEnemy(s, 'tank', 450), addEnemy(s, 'tank', 600, 100)];
    es.forEach(e => { e.defense.hull *= 50; e.baseStats.speed = 0; });
    const hp = es.map(totalHp);
    run(s, 0.2, { mouse: { x: es[0].x, y: es[0].y } });
    es.forEach((e, i) => expect(totalHp(e), `cible ${i}`).toBeLessThan(hp[i]));
  });

  it('drones : tirent sans que le joueur tire et sans chaleur', () => {
    const s = makeState({ noSpawn: true, weaponIds: ['em_drone_wing'] });
    s.player.isGodMode = true;
    const e = addEnemy(s, 'tank', 400);
    e.defense.hull *= 50; e.baseStats.speed = 0;
    const hp = totalHp(e);
    run(s, 3);
    expect(s.drones.length).toBe(2);
    expect(totalHp(e)).toBeLessThan(hp);
    expect(s.heat).toBe(0);
  });

  it('bombe gravité : attire les ennemis vers le puits', () => {
    const s = setup('gravity_bomb');
    const target = addEnemy(s, 'tank', 400);
    target.defense.hull *= 50; target.baseStats.speed = 0;
    run(s, 1.5, { mouse: { x: target.x, y: target.y } });
    expect(s.zones.some(z => z.kind === 'gravity') || s.projectiles.some(p => p.kind === 'gravity')).toBe(true);
  });

  it('la surchauffe bloque le tir puis se résorbe', () => {
    const s = setup('auto_cannon');
    s.heat = s.maxHeat;
    s.isOverheated = true;
    run(s, 0.5);
    expect(s.projectiles.filter(p => p.ownerId === 'player').length).toBe(0);
    run(s, 15);
    expect(s.isOverheated).toBe(false);
  });

  it('niveau Tech III : plus de dégâts qu\'en Tech I', () => {
    const dmgAt = (level: number) => {
      const s = setup('ion_blaster');
      s.activeWeapons[0].level = level;
      const e = addEnemy(s, 'tank', 300);
      e.defense.hull *= 100; e.baseStats.speed = 0;
      const hp = totalHp(e);
      run(s, 3, { mouse: { x: e.x, y: e.y } });
      return hp - totalHp(e);
    };
    expect(dmgAt(3)).toBeGreaterThan(dmgAt(1) * 1.5);
  });
});
