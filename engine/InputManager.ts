
import { CONTROLS } from '../constants';
import { HELD_ACTIONS, PadAction, PadState, Vec2, aimScreenPoint, diffActions, mergeAnalog, readPad } from './GamepadInput';

/** Distance (px) du centre de l'écran où se place le point de visée quand on vise au stick droit. */
const PAD_AIM_RADIUS = 280;

/** Touches simulées par les boutons de la manette (réutilise les raccourcis clavier existants). */
const PAD_KEYS: Partial<Record<PadAction, string>> = {
  pause: CONTROLS.PAUSE, autoFire: CONTROLS.AUTO_FIRE, feedback: 'f8',
};

export class InputManager {
  private keys: Set<string> = new Set();
  private mousePos = { x: 0, y: 0 };
  private canvas: HTMLCanvasElement | null = null;

  private attached = false;
  private rafId = 0;
  private padHeld = new Set<PadAction>();
  private padMove: Vec2 = { x: 0, y: 0 };
  private padAimActive = false;
  private padId: string | null = null;
  private lastDevice: 'mouse' | 'gamepad' = 'mouse';
  private padListeners = new Set<(connected: boolean, id: string | null) => void>();

  constructor() {
    this.attach();
  }

  // Idempotent : peut être rappelé après dispose() (React StrictMode monte/démonte/remonte les effets en dev)
  public attach() {
    if (this.attached) return;
    this.attached = true;
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    // On utilise l'évènement mousedown sur le window pour capturer l'intention,
    // mais on filtre strictement la cible.
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('gamepadconnected', this.handlePadConnect);
    window.addEventListener('gamepaddisconnected', this.handlePadDisconnect);
    this.rafId = requestAnimationFrame(this.pollLoop);
  }

  public setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  // Évite les touches "collées" quand la fenêtre perd le focus
  private handleBlur = () => {
    this.keys.clear();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    // Ne pas capturer les touches si on tape dans un input (ex: recherche dev menu)
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    this.keys.add(e.key.toLowerCase());
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private handleMouseDown = (e: MouseEvent) => {
    // CRITIQUE : Seul le clic direct sur le canvas de simulation active le tir
    if (this.canvas && (e.target === this.canvas)) {
      this.keys.add('mousedown');
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    this.keys.delete('mousedown');
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      this.lastDevice = 'mouse';
    }
  };

  // --- Manette (Gamepad API) ---
  private handlePadConnect = (e: GamepadEvent) => {
    this.padId = e.gamepad.id;
    this.padListeners.forEach(cb => cb(true, this.padId));
  };

  private handlePadDisconnect = () => {
    this.padId = null;
    this.releasePad();
    this.padListeners.forEach(cb => cb(false, null));
  };

  private releasePad() {
    this.padHeld.forEach(a => this.applyPadAction(a, false));
    this.padHeld.clear();
    this.padMove = { x: 0, y: 0 };
    this.padAimActive = false;
  }

  private pollLoop = () => {
    this.pollGamepad();
    this.rafId = requestAnimationFrame(this.pollLoop);
  };

  /** Premier pad « standard » connecté (les pads exotiques sans mapping standard sont ignorés). */
  private activePad(): Gamepad | null {
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p && p.connected && p.mapping === 'standard') return p;
    return null;
  }

  /** Lit la manette (appelé à chaque frame) : déplacement, visée, boutons. */
  public pollGamepad() {
    const pad = this.activePad();
    if (!pad) {
      if (this.padHeld.size || this.padAimActive) this.releasePad();
      return;
    }
    if (this.padId !== pad.id) {
      // Manette déjà branchée au chargement (l'événement n'a pas eu lieu) ou changée
      this.padId = pad.id;
      this.padListeners.forEach(cb => cb(true, pad.id));
    }
    const state: PadState = readPad({ axes: pad.axes, buttons: pad.buttons });
    this.padMove = state.move;
    this.padAimActive = state.aimActive;
    if (state.aimActive || state.held.size || Math.hypot(state.move.x, state.move.y) > 0) this.lastDevice = 'gamepad';
    if (state.aimActive && this.canvas) {
      const c = { x: (this.canvas.clientWidth || window.innerWidth) / 2, y: (this.canvas.clientHeight || window.innerHeight) / 2 };
      this.mousePos = aimScreenPoint(c, state.aim, PAD_AIM_RADIUS);
    }
    const { pressed, released } = diffActions(this.padHeld, state.held);
    pressed.forEach(a => this.applyPadAction(a, true));
    released.forEach(a => this.applyPadAction(a, false));
    this.padHeld = state.held;
  }

  /** Traduit une action de manette en entrée existante (touche maintenue, impulsion ou raccourci clavier). */
  private applyPadAction(a: PadAction, down: boolean) {
    if (HELD_ACTIONS.has(a)) {
      if (down) this.keys.add(' ');
      else this.keys.delete(' ');
      return;
    }
    if (!down) return;
    if (a === 'dash') this.tap(CONTROLS.ABILITY_1);
    else if (a === 'nova') this.tap(CONTROLS.ABILITY_2);
    else {
      const key = PAD_KEYS[a];
      if (key) this.emitKey(key);
    }
  }

  /** Raccourci clavier simulé (les écouteurs de App.tsx le reçoivent comme une vraie touche). */
  private emitKey(key: string) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    window.dispatchEvent(new KeyboardEvent('keyup', { key }));
  }

  /** Abonnement aux branchements / débranchements (message « Manette connectée »). Retourne la fonction de désabonnement. */
  public onGamepadChange(cb: (connected: boolean, id: string | null) => void) {
    this.padListeners.add(cb);
    return () => { this.padListeners.delete(cb); };
  }
  public getGamepadId() { return this.padId; }
  /** Actions de manette en cours (menus : croix, A, B…). */
  public getPadActions(): ReadonlySet<PadAction> { return this.padHeld; }
  /** True si la dernière entrée utilisée est la manette. */
  public isGamepadActive() { return this.lastDevice === 'gamepad'; }
  /** Manette utilisée et stick droit au repos : la visée doit être automatique (comme sur mobile). */
  public wantsAutoAim() { return this.padId !== null && this.lastDevice === 'gamepad' && !this.padAimActive; }

  // --- Commandes virtuelles (tactile) ---
  private analog = { x: 0, y: 0 };
  public setAnalog(x: number, y: number) { this.analog = { x, y }; }
  public getAnalog() { return mergeAnalog(this.analog, this.padMove); }
  /** Appui virtuel bref sur une touche (boutons tactiles). */
  public tap(key: string, ms = 120) {
    this.keys.add(key);
    setTimeout(() => this.keys.delete(key), ms);
  }

  public isPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  public getMousePos() {
    return this.mousePos;
  }

  public getKeys() {
    return this.keys;
  }

  public dispose() {
    this.attached = false;
    cancelAnimationFrame(this.rafId);
    this.releasePad();
    this.keys.clear();
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('gamepadconnected', this.handlePadConnect);
    window.removeEventListener('gamepaddisconnected', this.handlePadDisconnect);
  }
}

export const input = new InputManager();
