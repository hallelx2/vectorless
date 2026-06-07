import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

/** Vectorless logo — the real V mark (matches vectorless-dashboard's
 *  icon.tsx / VectorlessIcon): a blue tile with a white V + pink focal dot.
 *  Do NOT invent a different mark. */
function VectorlessMark() {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <rect width="24" height="24" rx="6" fill="#1456F0" />
        <path
          d="M6 6 L12 18 L18 6"
          stroke="#ffffff"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="18" r="1.8" fill="#EA5EC1" />
      </svg>
      <span className="font-medium tracking-tight text-[0.95rem]">{appName}</span>
    </span>
  );
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <VectorlessMark />,
    },
    links: [
      {
        text: 'Documentation',
        url: '/docs',
        active: 'nested-url',
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
