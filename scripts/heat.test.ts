import { it } from 'vitest';
import { createInitialState } from '../engine/GameFactory';
import { updateGameState } from '../engine/CoreEngine';
import { applyUpgrade, rollUpgradeOptions } from '../engine/Progression';
import { loadoutSummary } from '../engine/Preview';
import { seedRandom, STEP } from '../tests/helpers';
import { heatThrottle } from '../engine/Heat';

/** Analyse de la chaleur en partie (bot simplifié immobile en god mode, tir continu). */
it('analyse chaleur', () => {
  const byWeapons: Record<number, { frames: number; over: number; cycles: number; throttleSum: number }> = {};
  for (let run = 0; run < 6; run++) {
    const rnd = seedRandom(500 + run);
    const s = createInitialState('interceptor');
    s.status = 'playing'; s.autoFire = true; s.autoAim = true; s.player.isGodMode = true;
    let wasOver = false;
    for (let i = 0; i < 60 * 600; i++) {
      updateGameState(s, STEP, new Set(), { x: s.player.x + 1, y: s.player.y },
        () => { const o = rollUpgradeOptions(s); const pick = o.find(x => x.type === 'weapon' && !s.activeWeapons.some(w => w.id === x.item.id)) ?? o.find(x => x.type === 'weapon') ?? o[0]; if (pick) applyUpgrade(s, pick); },
        () => {});
      const n = s.activeWeapons.length;
      const b = (byWeapons[n] ??= { frames: 0, over: 0, cycles: 0, throttleSum: 0 });
      b.throttleSum += s.isOverheated ? 0 : heatThrottle(s);
      b.frames++;
      if (s.isOverheated) b.over++;
      if (s.isOverheated && !wasOver) b.cycles++;
      wasOver = s.isOverheated;
    }
    rnd.mockRestore();
    if (run === 0) {
      const l = loadoutSummary(s);
      console.log('fin de partie 0 :', l.weapons.map(w => `${w.id}:${w.level} ${w.heatPerSec}/s`).join(', '), `→ ${l.heatPerSec}/s vs refroid. ${l.coolingPerSec}/s, max ${s.maxHeat}`);
    }
  }
  console.log('armes | surchauffe | surchauffes/min | cadence moyenne');
  for (const [n, b] of Object.entries(byWeapons)) {
    console.log(`  ${n}    | ${Math.round((b.over / b.frames) * 100)} %  | ${(b.cycles / (b.frames / 3600)).toFixed(1)}  | ${Math.round((b.throttleSum / b.frames) * 100)} %`);
  }
}, 600_000);
