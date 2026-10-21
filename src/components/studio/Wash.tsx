'use client';
import { useId, type CSSProperties } from 'react';
import styles from './studio.module.css';

export interface WashProps { color: string; className?: string; style?: CSSProperties; seed?: number; opacity?: number }

/** SVG watercolour bloom: turbulence-displaced edge, soft body, darker dried rim, granulation. */
export function Wash({ color, className, style, seed = 7, opacity = 0.75 }: WashProps) {
  const fid = `studio-wc-${useId().replace(/:/g, '')}`;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={[styles.wash, className].filter(Boolean).join(' ')}
      style={style}
      viewBox="0 0 400 300"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id={fid} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={4} seed={seed} result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale={70} xChannelSelector="R" yChannelSelector="G" result="shape" />
          <feGaussianBlur in="shape" stdDeviation={3} result="soft" />
          <feMorphology in="shape" operator="erode" radius={6} result="inner" />
          <feGaussianBlur in="inner" stdDeviation={8} result="innerSoft" />
          <feComposite in="soft" in2="innerSoft" operator="out" result="rim" />
          <feComponentTransfer in="soft" result="body"><feFuncA type="linear" slope={0.8} /></feComponentTransfer>
          <feComponentTransfer in="rim" result="rimDark"><feFuncA type="linear" slope={0.9} /></feComponentTransfer>
          <feMerge result="paint"><feMergeNode in="body" /><feMergeNode in="rimDark" /></feMerge>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed + 3} result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.7 1.15" result="grainMask" />
          <feComposite in="paint" in2="grainMask" operator="in" />
        </filter>
      </defs>
      <ellipse cx="200" cy="150" rx="150" ry="100" fill={color} opacity={opacity} filter={`url(#${fid})`} />
    </svg>
  );
}
