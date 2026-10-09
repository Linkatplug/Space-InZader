import { GameState, FeedbackSnapshot } from '../types';
import { synergyStatus } from './Synergies';
import { runningEvents } from './EventSystem';

/**
 * Instantané de la partie joint à un avis de testeur (F8), figé à l'ouverture de la fenêtre.
 * Pur et compact : valeurs arrondies, identifiants plutôt que noms, 5 premières sources de dégâts subis.
 * Au menu (aucune partie en cours) : seulement le statut et le vaisseau choisi.
 */
export const buildFeedbackSnapshot = (state: GameState): FeedbackSnapshot => {
  if (state.status === 'menu') return { status: state.status, ship: state.shipId };
  const { player } = state;
  const st = player.runtimeStats;
  const pair = (v: number, max: number): [number, number] => [Math.round(v), Math.round(max)];
  const ev = runningEvents(state)[0];
  return {
    status: state.status,
    ship: state.shipId,
    wave: state.wave,
    level: state.level,
    timeSec: Math.round(state.time / 1000),
    hull: pair(player.defense.hull, st.maxHull),
    shield: pair(player.defense.shield, st.maxShield),
    armor: pair(player.defense.armor, st.maxArmor),
    heat: Math.round(state.maxHeat > 0 ? (state.heat / state.maxHeat) * 100 : 0),
    weapons: state.activeWeapons.map(w => ({ id: w.id, level: w.level })),
    passives: state.activePassives.map(p => ({ id: p.passive.id, stacks: p.stacks })),
    keystones: state.keystones.map(k => k.id),
    synergies: synergyStatus(state).filter(s => s.activeTiers.length > 0).map(s => `${s.synergy.id}:${s.activeTiers.length}`),
    kills: state.totalKills,
    score: Math.round(state.score),
    enemies: state.enemies.length,
    bossAlive: state.enemies.some(e => e.type === 'boss'),
    event: ev ? ev.type : null,
    lastHitBy: state.lastHitBy ?? null,
    topDamage: Object.entries(state.damageBySource)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, dmg]) => ({ source, dmg: Math.round(dmg) })),
  };
};
