
export class InputManager {
  private keys: Set<string> = new Set();
  private mousePos = { x: 0, y: 0 };
  private canvas: HTMLCanvasElement | null = null;

  private attached = false;

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
    }
  };

  // --- Commandes virtuelles (tactile) ---
  private analog = { x: 0, y: 0 };
  public setAnalog(x: number, y: number) { this.analog = { x, y }; }
  public getAnalog() { return this.analog; }
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
    this.keys.clear();
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
  }
}

export const input = new InputManager();
