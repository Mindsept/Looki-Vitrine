import { useEffect, useRef, useState } from 'react';
import { MEDIA, FPS, chapters, desktopStops, mobileStops, framePosition, progressAt, chapterAt, annotationOpacity, restingFrame } from '@/lib/technology';
import { MotionSequence } from '@/lib/motion-sequence';
import './TechnologyExperience.css';

function Still({ name, eager = false }: { name: string; eager?: boolean }) {
  return <picture>
    <source media="(max-width: 767px)" srcSet={`${MEDIA}/${name}-mobile.webp`} />
    <img src={`${MEDIA}/${name}-desktop.webp`} alt="" width="1920" height="1080" loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async" />
  </picture>;
}

export default function TechnologyExperience({ outroBackground }: { outroBackground: { desktop: string; mobile: string } }) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const navigate = useRef<(index: number) => void>(() => {});
  const [staticMode, setStaticMode] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(preference.matches);
    sync();
    preference.addEventListener('change', sync);
    return () => preference.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const section = root.current, surface = canvas.current;
    if (!section || !surface || staticMode || reduced || matchMedia('(prefers-reduced-motion: reduce)').matches || failed) {
      setEnhanced(false); return;
    }
    const context = surface.getContext('2d', { alpha: false });
    if (!context || typeof createImageBitmap !== 'function') { setFailed(true); return; }
    let alive = true, raf = 0, start = 0, distance = 1, previousChapter = -1;
    let lastProgress = 0, insideScene = true;
    let settleTimer = 0, snapRaf = 0, snapping = false, touching = false;
    let direction: -1 | 0 | 1 = 0, lastScrollY = scrollY;
    let hasPainted = false, previousPosition = -1, previousDetail = false, maxPaint = 0, paints = 0, misses = 0;
    const variant = innerWidth < 768 ? 'mobile' : 'desktop';
    let portrait = innerWidth < 768;
    const annotations = Array.from(section.querySelectorAll<HTMLElement>('.technology-annotation'));
    const sequence = new MotionSequence(`${MEDIA}/motion/${variant}`, variant === 'mobile' ? 20 : 24,
      schedule, () => { if (alive) setFailed(true); }, count => { section.dataset.buffered = String(count); });

    function paint(sourcePosition: number) {
      if (!context || !surface || !section) return;
      const desired = Math.max(0, Math.min(424, sourcePosition * 4));
      sequence.request(desired);
      const lo = Math.floor(desired), hi = Math.min(424, lo + 1);
      const detail = sequence.bitmaps.has(lo) && sequence.bitmaps.has(hi);
      const a = detail ? sequence.bitmaps.get(lo) : sequence.previews.get(lo) ?? sequence.bitmaps.get(lo);
      const b = detail ? sequence.bitmaps.get(hi) : sequence.previews.get(hi) ?? sequence.bitmaps.get(hi);
      if (!a) { section.dataset.decodeMisses = String(++misses); return; }
      const blend = b ? desired - lo : 0;
      const actual = (lo + blend) / 4;
      if (Math.abs(actual - previousPosition) < .00001 && detail === previousDetail) return;
      const began = performance.now();
      const width = variant === 'mobile' ? 900 : 1440, height = variant === 'mobile' ? 506 : 810;
      if (surface.width !== width || surface.height !== height) {
        surface.width = width; surface.height = height;
      }
      context.globalAlpha = 1;
      context.drawImage(a, 0, 0, width, height);
      if (b && blend > .001) { context.globalAlpha = blend; context.drawImage(b, 0, 0, width, height); context.globalAlpha = 1; }
      previousPosition = actual;
      previousDetail = detail;
      section.dataset.detail = String(detail);
      section.dataset.previews = String(sequence.previews.size);
      section.dataset.frame = String(Math.round(actual));
      section.dataset.denseFrame = (actual * 4).toFixed(2);
      section.dataset.time = (actual / FPS).toFixed(3);
      const chapter = chapterAt(actual);
      const reveal = annotationOpacity(actual);
      for (let i = 0; i < annotations.length; i++) {
        const opacity = i === chapter ? reveal : 0;
        annotations[i].style.opacity = String(opacity);
        annotations[i].style.setProperty('--tab-reveal', String(opacity));
        annotations[i].setAttribute('aria-hidden', String(i !== chapter));
      }
      section.dataset.chapter = String(chapter);
      if (previousChapter !== chapter) { previousChapter = chapter; setActive(chapter); }
      if (!hasPainted) { hasPainted = true; setReady(true); }
      maxPaint = Math.max(maxPaint, performance.now() - began);
      section.dataset.maxPaintMs = maxPaint.toFixed(2);
      section.dataset.paints = String(++paints);
    }
    function update() {
      raf = 0;
      if (!alive || !section) return;
      const raw = (scrollY - start) / distance;
      insideScene = raw >= 0 && raw <= 1.001;
      const progress = Math.max(0, Math.min(1, raw));
      lastProgress = progress;
      section.style.setProperty('--journey-progress', String(progress));
      paint(framePosition(progress, portrait ? mobileStops : desktopStops));
    }
    function schedule() { if (alive && !raf) raf = requestAnimationFrame(update); }
    function cancelSnap() {
      window.clearTimeout(settleTimer);
      cancelAnimationFrame(snapRaf);
      snapping = false;
      if (section) section.dataset.settling = 'false';
    }
    function settle() {
      if (!alive || touching || snapping) return;
      const progress = (scrollY - start) / distance;
      // Never pull the visitor back into the scene after they have left it.
      if (progress < 0 || progress > 1) return;
      const stops = portrait ? mobileStops : desktopStops;
      const targetFrame = restingFrame(framePosition(progress, stops), stops, direction);
      const targetY = start + progressAt(targetFrame, stops) * distance;
      const fromY = scrollY, delta = targetY - fromY;
      if (Math.abs(delta) < 1) return;
      snapping = true;
      section!.dataset.settling = 'true';
      section!.dataset.restingFrame = String(targetFrame);
      const began = performance.now();
      const duration = Math.min(680, 360 + Math.abs(delta) * .3);
      function tick(now: number) {
        if (!alive || !snapping) return;
        const t = Math.min(1, (now - began) / duration);
        // Zero velocity at each end; the film and page keep the same timeline.
        const eased = t * t * (3 - 2 * t);
        window.scrollTo({ top: fromY + delta * eased, behavior: 'instant' });
        lastScrollY = scrollY;
        schedule();
        if (t < 1) snapRaf = requestAnimationFrame(tick);
        else { snapping = false; section!.dataset.settling = 'false'; }
      }
      snapRaf = requestAnimationFrame(tick);
    }
    function onScroll() {
      const delta = scrollY - lastScrollY;
      lastScrollY = scrollY;
      schedule();
      if (snapping) return;
      if (Math.abs(delta) > .5) direction = delta > 0 ? 1 : -1;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 180);
    }
    function onWheel(event: WheelEvent) {
      if (!event.deltaY || event.ctrlKey) return;
      cancelSnap();
      direction = event.deltaY > 0 ? 1 : -1;
      settleTimer = window.setTimeout(settle, 180);
    }
    function onPointerDown() { touching = true; cancelSnap(); }
    function onPointerUp() { touching = false; settleTimer = window.setTimeout(settle, 180); }
    function onKeyDown(event: KeyboardEvent) {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Escape'].includes(event.key)) cancelSnap();
    }
    function measure() {
      if (!section) return;
      portrait = innerWidth < 768;
      start = section.getBoundingClientRect().top + scrollY;
      distance = Math.max(1, section.offsetHeight - section.querySelector<HTMLElement>('.technology-scene')!.offsetHeight);
      schedule();
    }
    function resize() {
      cancelSnap();
      direction = 0;
      const keep = insideScene, progress = lastProgress;
      measure();
      if (keep) window.scrollTo({ top: start + progress * distance, behavior: 'instant' });
      lastScrollY = scrollY;
      if (keep) settleTimer = window.setTimeout(settle, 180);
    }
    navigate.current = index => {
      cancelSnap();
      direction = 0;
      window.scrollTo({ top: start + progressAt(chapters[index].frame, portrait ? mobileStops : desktopStops) * distance, behavior: 'instant' });
      lastScrollY = scrollY;
      schedule();
    };
    setEnhanced(true);
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', resize, { passive: true });
    measure();
    settleTimer = window.setTimeout(settle, 180);
    return () => {
      cancelSnap();
      alive = false; cancelAnimationFrame(raf); sequence.destroy(); observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', resize);
      setReady(false);
    };
  }, [staticMode, reduced, failed]);

  function switchPresentation() {
    setStaticMode(value => !value);
    window.scrollTo({ top: root.current ? root.current.getBoundingClientRect().top + scrollY : 0, behavior: 'instant' });
  }

  return <>
    <section ref={root} className="technology-experience" data-enhanced={enhanced} data-ready={ready && enhanced} aria-labelledby="technology-title">
      <a className="skip-link technology-skip" href="#suite-technologie">Passer la visite technologique</a>
      <div className="technology-scene">
        <div className="technology-masthead">
          <h1 id="technology-title">La technologie LOOKi</h1>
          <span>Une exploration en cinq étapes</span>
        </div>
        <div className="technology-media" ref={media} aria-hidden="true">
          <Still name="poster" eager />
          <canvas ref={canvas} />
        </div>
        <div className="technology-annotations">
          {chapters.map((chapter, index) => <article key={chapter.label} className="technology-annotation" data-chapter={index} aria-hidden={index !== (enhanced ? active : 0)} style={{ opacity: index === 0 ? 1 : 0 }}>
            <p className="technology-label"><span className="technology-index">0{index + 1}</span>{chapter.label}</p>
            <div className="technology-tab-body">
              <h2>{chapter.before}<em>{chapter.accent}</em>{chapter.after}</h2>
              <p className="technology-copy">{chapter.text}</p>
            </div>
          </article>)}
        </div>
        <div className="technology-scroll-hint" aria-hidden="true"><span>↓</span> Explorer au fil du scroll</div>
        <div className="technology-controls">
          <nav aria-label="Étapes de la technologie" className="technology-chapters">
            {chapters.map((chapter, index) => <button key={chapter.short} type="button" onClick={() => navigate.current(index)} aria-label={`Étape ${index + 1} : ${chapter.label.toLowerCase()}`} aria-current={active === index ? 'step' : undefined}><span>0{index + 1}</span><span className="technology-chapter-name">{chapter.short}</span></button>)}
          </nav>
          <button type="button" className="technology-mode" aria-pressed={staticMode} onClick={switchPresentation} hidden={reduced || failed}>{staticMode ? 'Explorer au défilement ↗' : 'Version sans animation ↗'}</button>
        </div>
        <div className="technology-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
    <div className="technology-static" data-visible={!enhanced}>
      {failed && <p className="technology-fallback" role="status">La visite se poursuit en images fixes.</p>}
      {chapters.slice(1).map((chapter, index) => <section key={chapter.label} className="technology-step" aria-labelledby={`technology-step-${index + 1}`}>
        <div className="technology-step-media"><Still name={chapter.still} /></div>
        <div className="technology-step-copy">
          <p className="technology-label"><span className="technology-index">0{index + 2} / 05</span>{chapter.label}</p>
          <h2 id={`technology-step-${index + 1}`}>{chapter.before}<em>{chapter.accent}</em>{chapter.after}</h2>
          <p>{chapter.text}</p>
        </div>
      </section>)}
    </div>
    <section className="technology-outro" id="suite-technologie" tabIndex={-1} aria-labelledby="technology-outro-title">
      <picture className="technology-outro-background" aria-hidden="true">
        <source media="(max-width: 767px)" srcSet={outroBackground.mobile} />
        <img src={outroBackground.desktop} width="1672" height="941" alt="" loading="lazy" decoding="async" />
      </picture>
      <p className="technology-label">LE PROJET CONTINUE</p>
      <h2 id="technology-outro-title">Une technologie.<br />Un projet <em>humain.</em></h2>
      <p>LOOKi est en développement. Ces images illustrent les principes du projet ; le design des lunettes n’est pas figé.</p>
      <a className="btn btn--ghost" href="/#solution">Découvrir la solution <span aria-hidden="true">↗</span></a>
    </section>
  </>;
}
