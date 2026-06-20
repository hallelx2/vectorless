import localFont from 'next/font/local';

// Vectorless brand typography — Geist Sans (body/UI), Geist Mono (code),
// Instrument Serif (large display / headlines).

export const geistSans = localFont({
  src: '../fonts/Geist.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-geist-sans',
});

export const geistMono = localFont({
  src: '../fonts/GeistMono.woff2',
  weight: '100 900',
  display: 'swap',
  variable: '--font-geist-mono',
});

export const instrumentSerif = localFont({
  src: [
    { path: '../fonts/InstrumentSerif.ttf', weight: '400', style: 'normal' },
    { path: '../fonts/InstrumentSerif-Italic.ttf', weight: '400', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-instrument-serif',
});

export const fontVariables = `${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`;
