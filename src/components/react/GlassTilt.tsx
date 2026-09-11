/**
 * Inclinaison douce au pointeur — adaptation du composant « Tilted Card » (React Bits).
 *
 * Adaptations LOOKi :
 *  - amplitude réduite (4° par défaut), réponse vive mais amortie : le visuel suit
 *    le pointeur sans traîner ;
 *  - ni reflet, ni info-bulle, ni changement d'échelle : seulement l'inclinaison ;
 *  - désactivé sur écrans tactiles et en mouvement réduit ; le contenu (enfants)
 *    reste rendu côté serveur.
 */
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface GlassTiltProps {
  children: ReactNode;
  amplitude?: number;
  className?: string;
  radius?: string;
}

const spring = { damping: 26, stiffness: 320, mass: 0.6 };

export default function GlassTilt({ children, amplitude = 4, className = '', radius = '32px' }: GlassTiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);

  const rotateX = useSpring(useMotionValue(0), spring);
  const rotateY = useSpring(useMotionValue(0), spring);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    setActive(fine && !reduce);
  }, [reduce]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!active || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    rotateX.set((0.5 - py) * amplitude * 2);
    rotateY.set((px - 0.5) * amplitude * 2);
  };
  const onLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <div
      ref={ref}
      className={`glass-tilt ${className}`}
      style={{ perspective: '1400px' }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d', position: 'relative', borderRadius: radius }}>
        {children}
      </motion.div>
    </div>
  );
}
