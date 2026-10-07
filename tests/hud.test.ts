import { describe, it, expect } from 'vitest';
import {
  hudLayout, HUD_BASE, formatClock, heatInfo, weaponSlots, synergyRows, keystoneInfo,
  bossIncoming, bossInfo, activeBuffs, synergyGains, upgradeKind, weaponStats, techNote, TAG_LABELS, DAMAGE_LABELS,
} from '../components/hud/model';
import { MAX_WEAPON_SLOTS } from '../constants';
import { KEYSTONES } from '../data/keystones';
import { PASSIVES } from '../data/passives';
import { WEAPONS } from '../data/weapons';
import { DamageType, Tag } from '../types';
import { makeState, addEnemy } from './helpers';

const ks = (id: string) => KEYSTONES.find(k => k.id === id)!;
const weapon = (id: string) => WEAPONS.find(w => w.id === id)!;

describe('HUD : mise à l\'échelle', () => {
  it('bureau : 1280×720 → ×1, 1920×1080 → ×1.5, 2560×1440 → ×2', () => {
    expect(hudLayout(1280, 720)).toMatchObject({ scale: 1, compact: false });
    expect(hudLayout(1920, 1080)).toMatchObject({ scale: 1.5, compact: false });
    expect(hudLayout(2560, 1440)).toMatchObject({ scale: 2, compact: false });
  });

  it('le viewport virtuel du bureau n\'est jamais plus petit que la référence', () => {
    for (const [w, h] of [[1280, 720], [1366, 768], [1920, 1200], [3440, 1440], [1600, 900]]) {
      const l = hudLayout(w, h);
      expect(l.compact).toBe(false);
      expect(l.width).toBeGreaterThanOrEqual(HUD_BASE.width - 0.01);
      expect(l.height).toBeGreaterThanOrEqual(HUD_BASE.height - 0.01);
    }
  });

  it('téléphone (portrait et paysage) : disposition compacte, texte pas réduit sous 75%', () => {
    for (const [w, h] of [[375, 812], [812, 375], [360, 640], [768, 1024]]) {
      const l = hudLayout(w, h);
      expect(l.compact).toBe(true);
      expect(l.scale).toBeGreaterThanOrEqual(0.75);
      expect(l.width * l.scale).toBeCloseTo(w);
    }
  });
});

describe('HUD : formats et chaleur', () => {
  it('formatClock', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(65_400)).toBe('01:05');
    expect(formatClock(-50)).toBe('00:00');
  });

  it('niveaux de chaleur', () => {
    const s = makeState();
    s.heat = 0;
    expect(heatInfo(s).level).toBe('ok');
    s.heat = s.maxHeat * 0.7;
    expect(heatInfo(s)).toMatchObject({ level: 'warm', percent: 70 });
    s.heat = s.maxHeat * 0.9;
    expect(heatInfo(s).level).toBe('critical');
    s.isOverheated = true;
    expect(heatInfo(s).level).toBe('overheated');
    expect(heatInfo(s).recovery).toBeGreaterThan(0);
  });
});

describe('HUD : armes', () => {
  it('un emplacement par slot, null si libre, recharge entre 0 et 1', () => {
    const s = makeState({ weaponIds: ['ion_blaster', 'railgun_mk2'] });
    s.time = 10_000;
    s.activeWeapons[1].lastFired = s.time; // vient de tirer
    const slots = weaponSlots(s);
    expect(slots).toHaveLength(MAX_WEAPON_SLOTS);
    expect(slots[0]?.readiness).toBe(1);
    expect(slots[1]?.readiness).toBe(0);
    expect(slots.slice(2).every(x => x === null)).toBe(true);
  });

  it('techNote : bonus de Tech II puis Tech III', () => {
    const w = { ...weapon('ion_blaster'), techNotes: ['bonus II', 'bonus III'] as [string, string] };
    expect(techNote(w, 2)).toBe('bonus II');
    expect(techNote(w, 3)).toBe('bonus III');
    expect(techNote({ ...w, techNotes: undefined }, 2)).toBeUndefined();
  });

  it('stats affichées tiennent compte du niveau Tech', () => {
    const w = weapon('ion_blaster');
    expect(weaponStats(w, 2).damage).toBeGreaterThan(weaponStats(w, 1).damage);
  });
});

describe('HUD : synergies et keystones', () => {
  it('synergies entamées seulement, actives d\'abord, avec palier courant et suivant', () => {
    const s = makeState({ weaponIds: ['fusion_rocket', 'cluster_missile', 'auto_cannon'] });
    const rows = synergyRows(s);
    const explosive = rows.find(r => r.id === 'explosive')!;
    expect(explosive.count).toBe(2);
    expect(explosive.current).toBeDefined();
    expect(explosive.next?.count).toBe(4);
    expect(explosive.tiers.filter(t => t.active)).toHaveLength(1);
    expect(rows.every(r => r.count > 0)).toBe(true);
    const firstInactive = rows.findIndex(r => !r.current);
    if (firstInactive >= 0) expect(rows.slice(firstInactive).every(r => !r.current)).toBe(true);
  });

  it('keystone conditionnelle : inactive puis active quand la coque est basse', () => {
    const s = makeState();
    const k = ks('rage_engine');
    expect(keystoneInfo(s, k)).toMatchObject({ kind: 'conditional', active: false });
    s.player.defense.hull = s.player.runtimeStats.maxHull * 0.2;
    expect(keystoneInfo(s, k)).toMatchObject({ kind: 'conditional', active: true });
  });

  it('keystone à l\'échelle : valeur plafonnée', () => {
    const s = makeState();
    s.hitStreak = 99;
    expect(keystoneInfo(s, ks('dead_eye'))).toMatchObject({ kind: 'scaling', value: 8, max: 8, active: true });
  });

  it('keystone permanente', () => {
    expect(keystoneInfo(makeState(), ks('overclock_core'))).toMatchObject({ kind: 'permanent', active: true });
  });
});

describe('HUD : choix d\'amélioration', () => {
  it('une nouvelle arme fait progresser ses synergies et signale le palier débloqué', () => {
    const s = makeState({ weaponIds: ['fusion_rocket'] });
    const gains = synergyGains(s, { type: 'weapon', item: weapon('cluster_missile') });
    const explosive = gains.find(g => g.id === 'explosive')!;
    expect(explosive).toMatchObject({ from: 1, to: 2 });
    expect(explosive.unlocks).toBeDefined();
  });

  it('améliorer une arme possédée ne compte pas deux fois', () => {
    const s = makeState({ weaponIds: ['fusion_rocket'] });
    const gains = synergyGains(s, { type: 'weapon', item: weapon('fusion_rocket') });
    expect(gains.every(g => g.from === g.to && !g.unlocks)).toBe(true);
    expect(upgradeKind(s, { type: 'weapon', item: weapon('fusion_rocket') })).toContain('Tech 1 → 2');
  });

  it('libellés : module avec cumul, keystone', () => {
    const s = makeState();
    expect(upgradeKind(s, { type: 'passive', item: PASSIVES[0] })).toContain(`0 → 1 / ${PASSIVES[0].maxStacks}`);
    expect(upgradeKind(s, { type: 'keystone', item: KEYSTONES[0] })).toContain('Keystone');
    expect(synergyGains(s, { type: 'keystone', item: KEYSTONES[0] })).toEqual([]);
  });

  it('tous les tags et types de dégâts ont un libellé français', () => {
    Object.values(Tag).forEach(t => expect(TAG_LABELS[t]).toBeTruthy());
    Object.values(DamageType).forEach(t => expect(DAMAGE_LABELS[t]).toBeTruthy());
  });
});

describe('HUD : vague et boss', () => {
  it('annonce le boss la vague précédant un multiple de 10', () => {
    const s = makeState();
    s.wave = 9;
    expect(bossIncoming(s)).toBe(true);
    s.wave = 10;
    expect(bossIncoming(s)).toBe(false);
  });

  it('barre de boss : présente seulement si un boss est en vie', () => {
    const s = makeState({ noSpawn: true });
    expect(bossInfo(s)).toBeNull();
    const boss = addEnemy(s, 'boss', 500);
    expect(bossInfo(s)).toMatchObject({ name: 'Dreadnought', ratio: 1 });
    boss.defense.hull = boss.runtimeStats.maxHull / 2;
    expect(bossInfo(s)!.ratio).toBeLessThan(1);
    expect(bossInfo(s)!.enraged).toBe(false);
    boss.enraged = true;
    expect(bossInfo(s)!.enraged).toBe(true);
    boss.dead = true;
    expect(bossInfo(s)).toBeNull();
  });

  it('bonus temporaires : temps restant en secondes, expirés masqués, plus court en premier', () => {
    const s = makeState();
    s.time = 10_000;
    s.buffs = [
      { id: 'a', name: 'Long', until: 15_000, duration: 5_000, modifiers: [], color: '#fff' },
      { id: 'b', name: 'Court', until: 11_500, duration: 5_000, modifiers: [], color: '#fff' },
      { id: 'c', name: 'Fini', until: 9_000, duration: 5_000, modifiers: [], color: '#fff' },
    ];
    expect(activeBuffs(s).map(b => [b.name, b.remaining])).toEqual([['Court', 1.5], ['Long', 5]]);
  });
});
