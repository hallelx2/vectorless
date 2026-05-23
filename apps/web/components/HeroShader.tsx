'use client';

import { useEffect, useState } from 'react';
import { Swirl, GrainGradient } from '@paper-design/shaders-react';

/**
 * Animated WebGL hero background — adapted from the Axion shader idea
 * but recolored to Vectorless brand (blue #1456f0 → pink #ea5ec1) and
 * kept deliberately subtle so the headline and document card stay
 * readable.
 *
 * The Axion spec named Swirl + ChromaFlow + FilmGrain. In the installed
 * @paper-design/shaders-react (v0.0.76) the equivalent is:
 *   - Swirl          → soft light base (blue-white)
 *   - GrainGradient  → brand color flow WITH built-in grain
 *                      (covers both ChromaFlow's color momentum and
 *                       FilmGrain's texture in one shader)
 * We skip FlutedGlass entirely — its refraction reads too "agency"
 * for a dev tool (and it isn't in this version anyway).
 *
 * Guards:
 *   - Disabled under prefers-reduced-motion (accessibility + battery).
 *   - Rendered inside the parent's `hidden lg:block` so mobile keeps
 *     only the lightweight CSS gradient fallback.
 *   - Mounts after hydration to avoid SSR/WebGL mismatch.
 */
export default function HeroShader() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;
    setEnabled(true);

    const onChange = (e: MediaQueryListEvent) => setEnabled(!e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!enabled) return null;

  const fill = { width: '100%', height: '100%' } as const;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base flowing light — soft blue/pink-tinted white swirl */}
      <Swirl
        className="absolute inset-0 h-full w-full"
        colorBack="#ffffff"
        colors={['#ffffff', '#eaf0ff', '#f6ecfb']}
        bandCount={2}
        twist={0.3}
        center={0.2}
        proportion={0.5}
        softness={1}
        speed={0.15}
        style={fill}
      />

      {/* Brand color flow + grain — blue→pink wash on white */}
      <GrainGradient
        className="absolute inset-0 h-full w-full mix-blend-multiply opacity-70"
        colorBack="#ffffff"
        colors={['#1456f0', '#ea5ec1']}
        shape="wave"
        softness={1}
        intensity={0.4}
        noise={0.15}
        speed={0.35}
        style={fill}
      />

      {/* Readability mask: fade the shader toward center so the headline
          and CTAs sit on calmer ground. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(255,255,255,0.4)_55%,rgba(255,255,255,0.72)_100%)]" />
    </div>
  );
}
