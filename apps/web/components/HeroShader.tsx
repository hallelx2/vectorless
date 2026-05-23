'use client';

import { useEffect, useRef, useState } from 'react';
import { GrainGradient } from '@paper-design/shaders-react';

/**
 * Animated brand-colored hero background (WebGL).
 *
 * Adapted from the Axion shader idea, recolored to Vectorless brand
 * (blue #1456f0 → pink #ea5ec1) and tuned for performance so it never
 * lags the page.
 *
 * Performance design:
 *   1. ONE shader canvas, not a stack. GrainGradient already gives the
 *      blue→pink color flow *and* grain in a single pass — the earlier
 *      Swirl layer doubled the GPU cost for a look the readability mask
 *      + CSS gradient already provide.
 *   2. maxPixelCount caps the framebuffer (~0.9MP). On a 2× retina
 *      display a full-screen canvas is otherwise ~8–13 MP per frame;
 *      the cap cuts fragment-shader work by 10×+. CSS upscales the
 *      result — invisible for a soft gradient.
 *   3. minPixelRatio=1 prevents supersampling on hi-DPI screens.
 *   4. IntersectionObserver pauses rendering when the hero is scrolled
 *      out of view (the shader unmounts → zero GPU while reading the
 *      rest of the page).
 *
 * Guards: disabled under prefers-reduced-motion; mounts after hydration
 * (no SSR/WebGL mismatch); only used on lg+ via the parent wrapper.
 */
export default function HeroShader() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [motionOk, setMotionOk] = useState(false);
  const [inView, setInView] = useState(true);

  // Respect prefers-reduced-motion.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setMotionOk(!mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMotionOk(!e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Pause the shader when the hero scrolls out of view.
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
          className="absolute inset-0 h-full w-full"
          colorBack="#ffffff"
          colors={['#1456f0', '#ea5ec1']}
          shape="wave"
          softness={1}
          intensity={0.4}
          noise={0.12}
          speed={0.3}
          minPixelRatio={1}
          maxPixelCount={921600 /* ~1280×720 */}
          style={{ width: '100%', height: '100%' }}
        />
      )}

      {/* Readability mask: fade the shader toward center so the headline
          and CTAs sit on calmer ground. Also acts as the visual base
          when the shader is paused/disabled. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(255,255,255,0.4)_55%,rgba(255,255,255,0.72)_100%)]" />
    </div>
  );
}
