import { GameState } from '../types';
import { CONTROLS } from '../constants';
import { updateAbilities } from './AbilitySystem';
import { updateWeapons } from './WeaponSystem';
import { nearestEnemy } from './Combat';

export const handlePlayerControls = (
  state: GameState,
  deltaTime: number,
  time: number,
  keys: Set<string>,
  mouseWorld: { x: number, y: number }
) => {
  const { player } = state;

  // 1. Mouvement (diagonales normalisées)
  const isUp = CONTROLS.MOVE_UP.some(k => keys.has(k));
  const isDown = CONTROLS.MOVE_DOWN.some(k => keys.has(k));
  const isLeft = CONTROLS.MOVE_LEFT.some(k => keys.has(k));
  const isRight = CONTROLS.MOVE_RIGHT.some(k => keys.has(k));

  let moveX = (isRight ? 1 : 0) - (isLeft ? 1 : 0);
  let moveY = (isDown ? 1 : 0) - (isUp ? 1 : 0);
  if (moveX !== 0 && moveY !== 0) { moveX *= Math.SQRT1_2; moveY *= Math.SQRT1_2; }
  // Joystick analogique (tactile) prioritaire s'il est actif
  const am = state.analogMove;
  const amLen = Math.hypot(am.x, am.y);
  if (amLen > 0.15) {
    const k = Math.min(1, amLen) / amLen;
    moveX = am.x * k;
    moveY = am.y * k;
  }

  player.vx = moveX * player.runtimeStats.speed;
  player.vy = moveY * player.runtimeStats.speed;

  // Forces externes (gravité, recul) ajoutées puis amorties
  player.kx = (player.kx || 0) * 0.88;
  player.ky = (player.ky || 0) * 0.88;
  player.x += player.vx + player.kx;
  player.y += player.vy + player.ky;

  // Rotation vers la souris, ou vers l'ennemi le plus proche en visée auto
  let aim = mouseWorld;
  if (state.autoAim) {
    const target = nearestEnemy(state, player.x, player.y, 1400);
    if (target) aim = target;
    else if (Math.hypot(player.vx, player.vy) > 0.1) aim = { x: player.x + player.vx, y: player.y + player.vy };
    else aim = { x: player.x + Math.cos(player.rotation), y: player.y + Math.sin(player.rotation) };
  }
  player.rotation = Math.atan2(aim.y - player.y, aim.x - player.x);

  // 2. Compétences
  updateAbilities(state, deltaTime, keys);

  // 3. Tir (maintenu ou automatique)
  const isFiring = state.autoFire || CONTROLS.FIRE.some(k => keys.has(k));
  updateWeapons(state, deltaTime, time, isFiring, aim);
};
