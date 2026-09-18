/** Keep the compressed film in memory; only decode a small moving window.
 * Downloads never wait for a scroll event and obsolete frames never repaint. */
export class MotionSequence {
  readonly count = 425;
  readonly bitmaps = new Map<number, ImageBitmap>();
  readonly previews = new Map<number, ImageBitmap>();
  private blobs = new Map<number, Blob>();
  private requests = new Map<number, AbortController>();
  private decoding = new Set<number>();
  private previewing = new Set<number>();
  private errors = new Map<number, number>();
  private priority: number[] = [];
  private cursor = 0;
  private target = 0;
  private direction = 1;
  private stride = 1;
  private disposed = false;

  constructor(private base: string, private limit: number, private changed: () => void, private failed: () => void, private progress: (loaded: number) => void) {}

  request(position: number) {
    const target = Math.min(this.count - 1, Math.max(0, Math.floor(position)));
    if (target !== this.target) {
      this.direction = target > this.target ? 1 : -1;
      this.stride = Math.min(24, Math.max(1, Math.abs(target - this.target)));
    }
    this.target = target;
    const order = [target, Math.min(target + 1, this.count - 1)];
    // Predict the next display samples during a fast native wheel/PageDown.
    // Decoding every intervening frame would fall behind a large scroll delta.
    for (let i = 1; i <= 6; i++) {
      const next = target + i * this.stride * this.direction;
      order.push(next, next + 1);
    }
    for (let i = 1; i <= 7; i++) order.push(target + i * this.direction, target - i * this.direction);
    this.priority = [...new Set(order)].filter(index => index >= 0 && index < this.count).slice(0, this.limit - 2);
    if ((this.errors.get(target) ?? 0) >= 2) { this.failed(); return; }
    this.download();
    this.decode();
    this.preview();
  }

  private download() {
    if (this.disposed) return;
    const available = (i: number) => !this.blobs.has(i) && !this.requests.has(i) && (this.errors.get(i) ?? 0) < 2;
    while (this.requests.size < 4) {
      let index = this.priority.find(available);
      if (index === undefined) {
        while (this.cursor < this.count && !available(this.cursor)) this.cursor++;
        if (this.cursor >= this.count) break;
        index = this.cursor++;
      }
      void this.fetch(index);
    }
  }

  private async fetch(index: number) {
    const controller = new AbortController();
    this.requests.set(index, controller);
    try {
      const response = await fetch(`${this.base}/${String(index).padStart(4, '0')}.webp?v=rife-1`, { signal: controller.signal, cache: 'force-cache' });
      if (!response.ok) throw new Error(`Frame ${index}: ${response.status}`);
      const blob = await response.blob();
      if (this.disposed) return;
      this.blobs.set(index, blob);
      this.progress(this.blobs.size);
    } catch {
      if (!this.disposed) {
        this.errors.set(index, (this.errors.get(index) ?? 0) + 1);
        if (Math.abs(index - this.target) <= 1 && (this.errors.get(index) ?? 0) >= 2) this.failed();
      }
    } finally {
      this.requests.delete(index);
      if (!this.disposed) { this.decode(); this.preview(); this.download(); }
    }
  }

  // A compact, predecoded film makes fast jumps independent of full-size
  // decoding. Detail is restored as soon as the exact display pair is ready.
  private preview() {
    if (this.disposed) return;
    const available = (i: number) => !this.previews.has(i) && !this.previewing.has(i) && this.blobs.has(i);
    while (this.previewing.size < 2) {
      const index = this.priority.find(available) ?? [...this.blobs.keys()].find(available);
      if (index === undefined) break;
      this.previewing.add(index);
      void createImageBitmap(this.blobs.get(index)!, { resizeWidth: this.base.endsWith('mobile') ? 320 : 480, resizeQuality: 'low' }).then(bitmap => {
        if (this.disposed) { bitmap.close(); return; }
        this.previews.set(index, bitmap);
        if (Math.abs(index - this.target) <= 1) this.changed();
      }).catch(() => {}).finally(() => { this.previewing.delete(index); this.preview(); });
    }
  }

  private decode() {
    if (this.disposed) return;
    for (const index of this.priority) {
      if (this.decoding.size >= 2) break;
      const blob = this.blobs.get(index);
      if (!blob || this.bitmaps.has(index) || this.decoding.has(index)) continue;
      this.decoding.add(index);
      void createImageBitmap(blob).then(bitmap => {
        if (this.disposed) { bitmap.close(); return; }
        this.bitmaps.set(index, bitmap);
        const rank = (key: number) => { const i = this.priority.indexOf(key); return i < 0 ? 1000 + Math.abs(key - this.target) : i; };
        const distant = [...this.bitmaps.keys()].sort((a, b) => rank(b) - rank(a));
        while (this.bitmaps.size > this.limit) {
          const remove = distant.shift()!;
          this.bitmaps.get(remove)?.close(); this.bitmaps.delete(remove);
        }
        if (Math.abs(index - this.target) <= 1) this.changed();
      }).catch(() => { if (!this.disposed) this.failed(); }).finally(() => { this.decoding.delete(index); this.decode(); });
    }
  }

  destroy() {
    this.disposed = true;
    this.requests.forEach(request => request.abort());
    this.bitmaps.forEach(bitmap => bitmap.close());
    this.previews.forEach(bitmap => bitmap.close());
    this.bitmaps.clear(); this.previews.clear(); this.blobs.clear();
  }
}
