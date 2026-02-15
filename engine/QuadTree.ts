
export interface Boundary {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class QuadTree<T extends { x: number, y: number, radius?: number }> {
  private capacity: number;
  private boundary: Boundary;
  private points: T[] = [];
  private divided: boolean = false;

  private northwest?: QuadTree<T>;
  private northeast?: QuadTree<T>;
  private southwest?: QuadTree<T>;
  private southeast?: QuadTree<T>;

  constructor(boundary: Boundary, capacity: number = 8) {
    this.boundary = boundary;
    this.capacity = capacity;
  }

  private subdivide() {
    const { x, y, w, h } = this.boundary;
    const nw = { x: x - w / 2, y: y - h / 2, w: w / 2, h: h / 2 };
    this.northwest = new QuadTree<T>(nw, this.capacity);
    const ne = { x: x + w / 2, y: y - h / 2, w: w / 2, h: h / 2 };
    this.northeast = new QuadTree<T>(ne, this.capacity);
    const sw = { x: x - w / 2, y: y + h / 2, w: w / 2, h: h / 2 };
    this.southwest = new QuadTree<T>(sw, this.capacity);
    const se = { x: x + w / 2, y: y + h / 2, w: w / 2, h: h / 2 };
    this.southeast = new QuadTree<T>(se, this.capacity);
    this.divided = true;
  }

  // Added contains method to check if a point is within the current boundary
  private contains(point: T): boolean {
    return (
      point.x >= this.boundary.x - this.boundary.w &&
      point.x < this.boundary.x + this.boundary.w &&
      point.y >= this.boundary.y - this.boundary.h &&
      point.y < this.boundary.y + this.boundary.h
    );
  }

  // Fixed insert method to properly call insert on children and return boolean
  public insert(point: T): boolean {
    if (!this.contains(point)) return false;

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) this.subdivide();

    return (
      this.northwest!.insert(point) ||
      this.northeast!.insert(point) ||
      this.southwest!.insert(point) ||
      this.southeast!.insert(point)
    );
  }

  // Added query method for spatial searches
  public query(range: Boundary, found: T[] = []): T[] {
    if (!this.intersects(range)) return found;

    for (const p of this.points) {
      if (this.pointInRange(p, range)) {
        found.push(p);
      }
    }

    if (this.divided) {
      this.northwest!.query(range, found);
      this.northeast!.query(range, found);
      this.southwest!.query(range, found);
      this.southeast!.query(range, found);
    }

    return found;
  }

  private intersects(range: Boundary): boolean {
    return !(
      range.x - range.w > this.boundary.x + this.boundary.w ||
      range.x + range.w < this.boundary.x - this.boundary.w ||
      range.y - range.h > this.boundary.y + this.boundary.h ||
      range.y + range.h < this.boundary.y - this.boundary.h
    );
  }

  private pointInRange(point: T, range: Boundary): boolean {
    return (
      point.x >= range.x - range.w &&
      point.x < range.x + range.w &&
      point.y >= range.y - range.h &&
      point.y < range.y + range.h
    );
  }
}
