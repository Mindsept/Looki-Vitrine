/** Frame-accurate editorial boundaries, inspected against the supplied 24 fps film. */
export const FRAME_COUNT = 107;
export const FPS = 24;
export const MEDIA = '/assets/technology';
export const chapters = [
  { label: 'LUNETTES CONNECTÉES', short: 'Lunettes', before: 'La technologie au niveau du ', accent: 'regard.', after: '', text: 'Une caméra intégrée pour capter l’environnement depuis les lunettes.', first: 0, last: 13, still: 'poster', frame: 0 },
  { label: 'ÉLECTRONIQUE EMBARQUÉE', short: 'Électronique', before: 'Chaque ', accent: 'composant', after: ' a sa place.', text: 'Optique, capteur et électronique réunis dans un format pensé pour le quotidien.', first: 14, last: 43, still: 'electronics', frame: 31 },
  { label: 'CAPTURE VISUELLE', short: 'Optique', before: 'De la ', accent: 'lumière', after: ' à l’information.', text: 'Le module caméra fournit les images destinées à l’analyse de l’environnement.', first: 44, last: 75, still: 'optics', frame: 60 },
  { label: 'VISION PAR ORDINATEUR', short: 'Intelligence', before: 'L’', accent: 'intelligence', after: ' prend le relais.', text: 'Le smartphone accueille les traitements d’IA pour interpréter les éléments de la scène.', first: 76, last: 85, still: 'phone', frame: 83 },
  { label: 'SERVICES CLOUD', short: 'Cloud', before: 'Une architecture ', accent: 'connectée.', after: '', text: 'Les services cloud complètent les lunettes et l’application mobile.', first: 86, last: 106, still: 'cloud', frame: 106 },
] as const;

export type Stop = readonly [progress: number, frame: number];
// Tune scroll space independently of video time. The phone receives 22% of the
// desktop journey and 28% on portrait/mobile, despite lasting just ten frames.
// Frames 82–84 show the entire phone; give these the most reading room.
export const desktopStops: readonly Stop[] = [[0, 0], [.08, 4], [.15, 13], [.19, 20], [.33, 35], [.38, 43], [.43, 51], [.56, 67], [.60, 75], [.63, 76], [.67, 80], [.70, 82], [.78, 83], [.82, 84], [.85, 86], [.94, 100], [1, 106]];
export const mobileStops: readonly Stop[] = [[0, 0], [.09, 4], [.16, 13], [.20, 20], [.32, 35], [.36, 43], [.40, 51], [.51, 67], [.55, 75], [.58, 76], [.62, 80], [.65, 82], [.78, 83], [.83, 84], [.86, 86], [.95, 100], [1, 106]];

/** Monotone cubic interpolation: continuous velocity without overshooting shots. */
export function framePosition(progress: number, stops: readonly Stop[]) {
  const p = Math.max(0, Math.min(1, progress));
  const next = stops.findIndex(stop => stop[0] >= p);
  if (next <= 0) return stops[0][1];
  const slope = (i: number) => (stops[i + 1][1] - stops[i][1]) / (stops[i + 1][0] - stops[i][0]);
  const tangent = (i: number) => {
    if (i === 0) return slope(0);
    if (i === stops.length - 1) return slope(i - 1);
    const a = slope(i - 1), b = slope(i);
    if (a <= 0 || b <= 0) return 0;
    const h0 = stops[i][0] - stops[i - 1][0], h1 = stops[i + 1][0] - stops[i][0];
    const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / a + w1 / b);
  };
  const [p0, f0] = stops[next - 1], [p1, f1] = stops[next];
  const h = p1 - p0, t = (p - p0) / h;
  return (2*t*t*t - 3*t*t + 1)*f0 + (t*t*t - 2*t*t + t)*h*tangent(next - 1)
    + (-2*t*t*t + 3*t*t)*f1 + (t*t*t - t*t)*h*tangent(next);
}

export const frameAt = (progress: number, stops: readonly Stop[]) => Math.round(framePosition(progress, stops));

/** Rest only on inspected, readable compositions, never on a camera transition. */
export function restingFrame(frame: number, stops?: readonly Stop[], direction: -1 | 0 | 1 = 0) {
  const position = (value: number) => stops ? progressAt(value, stops) : value;
  const current = position(frame);
  // Allow subpixel rounding at an exact anchor; otherwise follow the gesture.
  const tolerance = stops ? .0003 : .001;
  if (direction > 0) return chapters.find(chapter => position(chapter.frame) >= current - tolerance)?.frame ?? 106;
  if (direction < 0) return [...chapters].reverse().find(chapter => position(chapter.frame) <= current + tolerance)?.frame ?? 0;
  return chapters.reduce<number>((nearest, chapter) =>
    Math.abs(position(chapter.frame) - current) < Math.abs(position(nearest) - current) ? chapter.frame : nearest,
  chapters[0].frame);
}

export function progressAt(frame: number, stops: readonly Stop[]) {
  let lo = 0, hi = 1;
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2;
    if (framePosition(mid, stops) < frame) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

export const chapterAt = (frame: number) => chapters.findIndex(chapter => Math.round(frame) >= chapter.first && Math.round(frame) <= chapter.last);

export function annotationOpacity(frame: number) {
  const index = chapterAt(frame), chapter = chapters[index];
  const fade = index === 3 ? 1.5 : 2.5;
  const ease = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
  const start = index === 0 ? 1 : ease((frame - chapter.first + .5) / fade);
  const end = index === 4 ? 1 : ease((chapter.last + .5 - frame) / fade);
  return Math.min(start, end);
}
