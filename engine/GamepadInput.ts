/**
 * Manette : logique PURE (aucun accès à navigator / window), testable sous Node.
 * Le sondage de navigator.getGamepads() et l'envoi des actions sont dans InputManager.
 *
 * Layout « standard » (Xbox / PlayStation) : axes 0-1 = stick gauche, 2-3 = stick droit ;
 * boutons 0 A/✕, 1 B/○, 2 X/□, 3 Y/△, 4 LB, 5 RB, 6 LT, 7 RT, 8 Select/View, 9 Start,
 * 12-15 croix directionnelle (haut, bas, gauche, droite).
 */

export type PadAction =
  | 'dash' | 'nova' | 'pause' | 'autoFire' | 'feedback' | 'fire'
  | 'up' | 'down' | 'left' | 'right' | 'confirm' | 'back';

/** Boutons (indices du layout standard) déclenchant chaque action. Modifier cette table suffit pour changer le mapping. */
export const GAMEPAD_BUTTONS: Record<PadAction, number[]> = {
  dash: [0],        // A
  nova: [1],        // B
  autoFire: [3],    // Y
  pause: [9],       // Start
  feedback: [8],    // Select / View
  fire: [7, 5],     // RT / RB (maintenu)
  up: [12], down: [13], left: [14], right: [15],
  confirm: [0],     // A (menus)
  back: [1],        // B (menus)
};

/** Actions « maintenues » (état continu) ; les autres sont des impulsions sur front montant. */
export const HELD_ACTIONS: ReadonlySet<PadAction> = new Set<PadAction>(['fire']);

export const GAMEPAD_CONFIG = {
  deadzone: 0.22,        // zone morte radiale des sticks
  aimActive: 0.3,        // déviation du stick droit à partir de laquelle on vise à la main
  menuStick: 0.6,        // le stick gauche sert de croix directionnelle dans les menus au-delà de ce seuil
  triggerThreshold: 0.5, // gâchettes analogiques : seuil d'appui
};

export interface PadSnapshot {
  axes: readonly number[];
  buttons: readonly { pressed: boolean; value: number }[];
}

export interface Vec2 { x: number; y: number }

/** Zone morte radiale : sous le seuil → (0,0) ; au-delà, la valeur est ré-étalée de 0 à 1 (pas de saut). Longueur max 1. */
export const applyDeadzone = (x: number, y: number, deadzone = GAMEPAD_CONFIG.deadzone): Vec2 => {
  const len = Math.hypot(x, y);
  if (!Number.isFinite(len) || len <= deadzone) return { x: 0, y: 0 };
  const scaled = Math.min(1, (len - deadzone) / (1 - deadzone));
  return { x: (x / len) * scaled, y: (y / len) * scaled };
};

const axis = (s: PadSnapshot, i: number) => s.axes[i] ?? 0;

const buttonDown = (s: PadSnapshot, i: number) => {
  const b = s.buttons[i];
  return !!b && (b.pressed || b.value > GAMEPAD_CONFIG.triggerThreshold);
};

export interface PadState {
  move: Vec2;           // déplacement analogique, longueur ≤ 1
  aim: Vec2;            // direction de visée (stick droit), longueur ≤ 1
  aimActive: boolean;   // true si le stick droit est assez dévié (sinon : visée auto)
  held: Set<PadAction>; // actions actuellement actives
}

/** État de la manette à un instant donné. */
export const readPad = (s: PadSnapshot, map = GAMEPAD_BUTTONS): PadState => {
  const move = applyDeadzone(axis(s, 0), axis(s, 1));
  const aim = applyDeadzone(axis(s, 2), axis(s, 3));
  const held = new Set<PadAction>();
  (Object.keys(map) as PadAction[]).forEach(a => {
    if (map[a].some(i => buttonDown(s, i))) held.add(a);
  });
  // Le stick gauche joue aussi le rôle de croix directionnelle (menus)
  const raw = { x: axis(s, 0), y: axis(s, 1) };
  if (Math.hypot(raw.x, raw.y) >= GAMEPAD_CONFIG.menuStick) {
    if (Math.abs(raw.x) >= Math.abs(raw.y)) held.add(raw.x > 0 ? 'right' : 'left');
    else held.add(raw.y > 0 ? 'down' : 'up');
  }
  const aimActive = Math.hypot(axis(s, 2), axis(s, 3)) >= GAMEPAD_CONFIG.aimActive;
  return { move, aim, aimActive, held };
};

/** Fronts montants / descendants entre deux états (impulsions des actions non maintenues). */
export const diffActions = (prev: ReadonlySet<PadAction>, now: ReadonlySet<PadAction>) => ({
  pressed: [...now].filter(a => !prev.has(a)),
  released: [...prev].filter(a => !now.has(a)),
});

/** Visée à l'écran : point à `radius` px du centre dans la direction du stick droit. */
export const aimScreenPoint = (center: Vec2, aim: Vec2, radius: number): Vec2 => {
  const len = Math.hypot(aim.x, aim.y) || 1;
  return { x: center.x + (aim.x / len) * radius, y: center.y + (aim.y / len) * radius };
};

/** Fusion du déplacement tactile et manette : la manette gagne dès qu'elle est sollicitée. */
export const mergeAnalog = (touch: Vec2, pad: Vec2): Vec2 =>
  Math.hypot(pad.x, pad.y) > 0 ? pad : touch;
