/**
 * Apparition de texte, mot à mot — synthèse de « Split Text » et « Blur Text » (React Bits).
 * Réécrit avec `motion` pour partager une seule dépendance d'animation dans le site.
 *
 * - mode "rise" : chaque mot monte derrière un masque (Split Text, type lines/words) ;
 * - mode "blur" : chaque mot se met au point (Blur Text), utilisé pour les sous-titres.
 *
 * L'espace entre deux mots est une espace insécable placée dans le masque : un espace
 * ordinaire serait supprimé par la compression HTML d'Astro.
 * Rendu identique côté serveur et client (pas de branche selon l'environnement) :
 * les mots sont masqués dans le HTML initial et révélés à l'hydratation. Sans JS,
 * une règle <noscript> les affiche ; en mouvement réduit, une règle CSS globale les
 * affiche immédiatement et l'animation est réduite à zéro.
 */
import { useReducedMotion, motion } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties, type ElementType } from 'react';

interface SplitRevealProps {
  /** Une ligne, ou plusieurs lignes (chacune rendue en bloc). */
  lines: string[];
  as?: ElementType;
  mode?: 'rise' | 'blur';
  trigger?: 'mount' | 'view';
  /** Retard initial (ms) */
  delay?: number;
  /** Écart entre les mots (ms) */
  stagger?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function SplitReveal({
  lines,
  as: Tag = 'p',
  mode = 'rise',
  trigger = 'mount',
  delay = 0,
  stagger = 70,
  duration = 0.9,
  className = '',
  style,
  id,
}: SplitRevealProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [go, setGo] = useState(false);

  useEffect(() => {
    if (trigger === 'mount' || !ref.current) {
      setGo(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGo(true);
          io.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [trigger]);

  const hidden = mode === 'rise' ? { y: '110%', opacity: 0.001 } : { filter: 'blur(12px)', opacity: 0, y: 8 };
  const shown = mode === 'rise' ? { y: '0%', opacity: 1 } : { filter: 'blur(0px)', opacity: 1, y: 0 };
  let index = 0;

  return (
    <Tag ref={ref} id={id} className={`split-reveal ${className}`} style={style} aria-label={lines.join(' ')}>
      {lines.map((line, li) => (
        <span key={li} className="split-reveal__line" style={{ display: 'block' }} aria-hidden="true">
          {line.split(' ').map((w, wi, arr) => {
            const i = index++;
            return (
              <span
                key={wi}
                className="split-reveal__mask"
                style={{
                  display: 'inline-block',
                  overflow: mode === 'rise' ? 'hidden' : 'visible',
                  verticalAlign: 'bottom',
                  paddingBottom: '0.08em',
                  marginBottom: '-0.08em',
                }}
              >
                <motion.span
                  className="split-reveal__word"
                  style={{ display: 'inline-block', willChange: 'transform, opacity' }}
                  initial={false}
                  animate={go ? shown : hidden}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { duration, ease: EASE, delay: delay / 1000 + (i * stagger) / 1000 }
                  }
                >
                  {w}
                </motion.span>
                {wi < arr.length - 1 ? '\u00A0' : ''}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
