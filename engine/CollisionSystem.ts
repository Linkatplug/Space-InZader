
import { GameState, DamageType, Entity } from '../types';
import { applyDamage } from './DamageEngine';
import { emitParticles } from '../render/ParticleSystem';
import { playCollectXPSound } from './SoundEngine';
import { QuadTree, Boundary } from './QuadTree';
import { WORLD_WIDTH, WORLD_HEIGHT, DAMAGE_COLORS } from '../constants';

export const checkCollisions = (
  state: GameState, 
  time: number,
  onLevelUp: () => void, 
  onGameOver: () => void, 
  onShake: (amt: number) => void,
  createEffect: (x: number, y: number, text: string, color: string) => void
) => {
  const { player, enemies, projectiles, xpDrops } = state;

  const enemyTree = new QuadTree<Entity>({ 
    x: WORLD_WIDTH / 2, 
    y: WORLD_HEIGHT / 2, 
    w: WORLD_WIDTH / 2, 
    h: WORLD_HEIGHT / 2 
  }, 10);

  enemies.forEach(e => {
    if (!e.dead) enemyTree.insert(e);
  });

  projectiles.forEach(p => {
    if (p.dead) return;

    if (p.ownerId === 'player') {
      const searchRange: Boundary = {
        x: p.x,
        y: p.y,
        w: p.radius + 50,
        h: p.radius + 50
      };

      const candidates = enemyTree.query(searchRange);

      for (const e of candidates) {
        if (e.dead || p.dead) continue;
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const distSq = dx * dx + dy * dy;
        const radiusSum = p.radius + e.radius;

        if (distSq < radiusSum * radiusSum) {
          let finalPacket = { ...p.packet };
          
          if (p.packet.type === DamageType.KINETIC) {
            if (e.marks) e.marks.count = Math.min(5, e.marks.count + 1);
          } else if (p.packet.type === DamageType.EM && e.marks && e.marks.count > 0) {
            finalPacket.amount *= (1 + e.marks.count * 0.4);
            finalPacket.isSynergy = true;
            e.marks.count = 0;
            emitParticles(state, e.x, e.y, '#22d3ee', 15, 10);
            createEffect(e.x, e.y, "RESONANCE!", "#22d3ee");
          }

          if (p.packet.type === DamageType.THERMAL && e.marks && e.marks.count >= 3) {
            createEffect(e.x, e.y, "OVERLOAD!", "#fb923c");
            emitParticles(state, e.x, e.y, '#fb923c', 25, 15);
            onShake(10);
            const nearby = enemyTree.query({ x: e.x, y: e.y, w: 200, h: 200 });
            nearby.forEach(ne => {
              applyDamage(ne, { amount: 50, type: DamageType.EXPLOSIVE, penetration: 0, isCrit: false }, time);
            });
            e.marks.count = 0;
          }

          applyDamage(e, finalPacket, time);
          
          // FEEDBACK VISUEL : Dégâts sur Ennemi (couleur selon le type)
          const damageText = Math.floor(finalPacket.amount).toString();
          const damageColor = finalPacket.isCrit ? '#ffffff' : DAMAGE_COLORS[finalPacket.type];
          createEffect(e.x, e.y, finalPacket.isCrit ? `CRIT! ${damageText}` : damageText, damageColor);
          
          emitParticles(state, p.x, p.y, p.color, 4, 4);
          p.dead = true;

          state.heat = Math.max(0, state.heat - p.heatGenerated * 0.3);
          state.comboCount++;
          state.comboTimer = player.runtimeStats.comboWindow;

          if (e.defense.hull <= 0) {
            e.dead = true;
            state.totalKills++;
            state.waveKills++;
            state.score += (e.subtype === 'boss' ? 5000 : 50);
            emitParticles(state, e.x, e.y, e.subtype === 'boss' ? '#facc15' : '#f87171', e.subtype === 'boss' ? 100 : 15, 8);
            
            let dropCount = 2;
            let amountPerDrop = 15;
            switch (e.subtype) {
              case 'boss': dropCount = 50; amountPerDrop = 30; break;
              case 'sniper': dropCount = 4; amountPerDrop = 25; break;
              case 'kamikaze': dropCount = 3; amountPerDrop = 20; break;
              case 'swarmer': dropCount = 1; amountPerDrop = 12; break;
              default: dropCount = 2; amountPerDrop = 15; break;
            }

            for (let i = 0; i < dropCount; i++) {
              state.xpDrops.push({
                id: Math.random().toString(),
                x: e.x, y: e.y,
                amount: amountPerDrop * player.runtimeStats.xpMult,
                vx: (Math.random() - 0.5) * 14, 
                vy: (Math.random() - 0.5) * 14,
                collected: false
              });
            }
          }
        }
      }
    } else {
      const dx = p.x - player.x;
      const dy = p.y - player.y;
      const distSq = dx * dx + dy * dy;
      const radiusSum = p.radius + player.radius;

      if (distSq < radiusSum * radiusSum) {
        applyDamage(player, p.packet, time);
        
        // FEEDBACK VISUEL : Dégâts sur Joueur (Rouge)
        if (!player.isGodMode) {
          createEffect(player.x, player.y, Math.floor(p.packet.amount).toString(), "#ef4444");
        }
        
        onShake(15);
        p.dead = true;
        if (player.defense.hull <= 0) onGameOver();
      }
    }
  });

  xpDrops.forEach(drop => {
    const dx = player.x - drop.x;
    const dy = player.y - drop.y;
    const distSq = dx * dx + dy * dy;
    const radiusSum = player.radius + 15;

    if (distSq < radiusSum * radiusSum) {
      drop.collected = true;
      state.experience += drop.amount;
      playCollectXPSound();
      emitParticles(state, drop.x, drop.y, '#38bdf8', 4, 2);
      if (state.experience >= state.expToNextLevel) onLevelUp();
    }
  });

  const nearbyEnemies = enemyTree.query({ x: player.x, y: player.y, w: 150, h: 150 });
  nearbyEnemies.forEach(e => {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const distSq = dx * dx + dy * dy;
    const radiusSum = player.radius + e.radius;

    if (distSq < radiusSum * radiusSum) {
      if (e.subtype === 'kamikaze') {
        applyDamage(player, { amount: 45, type: DamageType.EXPLOSIVE, penetration: 0, isCrit: false }, time);
        if (!player.isGodMode) createEffect(player.x, player.y, "45", "#ef4444");
        e.dead = true;
        state.totalKills++;
        state.waveKills++;
        emitParticles(state, e.x, e.y, '#ef4444', 30, 15);
        onShake(30);
      } else {
        const dps = 5.0 * (1/60);
        applyDamage(player, { amount: dps, type: DamageType.KINETIC, penetration: 0, isCrit: false }, time);
        // On n'affiche pas les micro-dégâts de collision pour éviter le spam de texte
        onShake(2);
      }
      if (player.defense.hull <= 0) onGameOver();
    }
  });

  state.projectiles = state.projectiles.filter(p => !p.dead);
  state.enemies = state.enemies.filter(e => !e.dead);
  state.xpDrops = state.xpDrops.filter(d => !d.collected);
};
