
export class InputManager {
  private keys: Set<string> = new Set();
  private mousePos = { x: 0, y: 0 };
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
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
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
  }
}

export const input = new InputManager();
