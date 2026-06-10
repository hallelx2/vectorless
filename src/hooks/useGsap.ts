'use client';

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Run a GSAP setup function scoped to a ref. The setup receives the root
 * element so animations don't need to close over `ref.current` directly.
 */
export function useGsapEffect<T extends HTMLElement>(
  ref: RefObject<T | null>,
  setup: (root: T) => void | (() => void),
  deps: unknown[] = []
) {
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const cleanup = setup(el);
      if (typeof cleanup === 'function') return cleanup;
    }, el);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function useScopedRef<T extends HTMLElement>() {
  return useRef<T | null>(null);
}

export { gsap, ScrollTrigger };
