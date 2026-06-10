'use client';

import { useEffect, useRef, useState } from 'react';
import { GrainGradient } from '@paper-design/shaders-react';

/**
 * Animated brand-colored hero background (WebGL).
 * Ported from vectorless-dashboard to vectorless-docs.
 */
export default function HeroShader() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [motionOk, setMotionOk] = useState(false);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setMotionOk(!mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMotionOk(!e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '120px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const render = motionOk && inView;

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {render && (
        <GrainGradient
          className="absolute inset-0 h-full w-full opacity-40"
          colorBack="#fcfcfd"
          colors={['#1456f0', '#ea5ec1']}
          shape="wave"
          softness={1}
          intensity={0.4}
          noise={0.12}
          speed={0.3}
          minPixelRatio={1}
          maxPixelCount={921600}
          style={{ width: '100%', height: '100%' }}
        />
      )}

      {/* Readability mask */}
      <div className="absolute inset-0 hero-mask" />
    </div>
  );
}
