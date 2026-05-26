'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

type SplatPlacement = {
  left: string;
  top: string;
  width: string;
  color: string;
  opacity: number;
  rotate: number;
};

type AnimatedPathProps = {
  d: string;
  start: number;
  end: number;
  strokeWidth?: number;
  opacity?: number;
  color?: string;
  colorOpacity?: number;
};

type AnimatedMaskStrokeProps = {
  d: string;
  start: number;
  end: number;
  strokeWidth: number;
  opacity?: number;
};

const SPLATTERS: SplatPlacement[] = [
  { left: '-10%', top: '13%', width: '34vw', color: '#f480b7', opacity: 0.28, rotate: -18 },
  { left: '68%', top: '-13%', width: '31vw', color: '#77d7c8', opacity: 0.3, rotate: 34 },
  { left: '88%', top: '51%', width: '36vw', color: '#5b91ff', opacity: 0.24, rotate: -42 },
  { left: '18%', top: '82%', width: '24vw', color: '#f6cd66', opacity: 0.28, rotate: 16 },
  { left: '47%', top: '34%', width: '18vw', color: '#ff9870', opacity: 0.16, rotate: 71 },
  { left: '4%', top: '64%', width: '13vw', color: '#77d7c8', opacity: 0.2, rotate: 103 },
  { left: '61%', top: '76%', width: '16vw', color: '#f480b7', opacity: 0.16, rotate: -8 },
];

const SKETCH_DURATION = '10s';
const ORIGINAL_TIMELINE_END = 0.88;
const DRAW_PHASE_END = 0.38;
const PAINT_FADE_START = 0.4;
const PAINT_FADE_END = 0.44;
const PAINT_SOURCE_START = 0.6;
const PAINT_SOURCE_END = 0.92;
const PAINT_TARGET_START = 0.42;
const PAINT_TARGET_END = 0.9;

function mapSketchTime(value: number) {
  return Math.min(DRAW_PHASE_END, (value / ORIGINAL_TIMELINE_END) * DRAW_PHASE_END);
}

function mapPaintTime(value: number) {
  const progress = (value - PAINT_SOURCE_START) / (PAINT_SOURCE_END - PAINT_SOURCE_START);
  const clamped = Math.max(0, Math.min(1, progress));
  return PAINT_TARGET_START + clamped * (PAINT_TARGET_END - PAINT_TARGET_START);
}

function AnimatedPath({
  d,
  start,
  end,
  strokeWidth = 2.4,
  opacity = 0.84,
}: AnimatedPathProps) {
  const sketchStart = mapSketchTime(start);
  const sketchEnd = mapSketchTime(end);
  const sketchKeyTimes = `0;${sketchStart};${sketchEnd};${PAINT_FADE_START};${PAINT_FADE_END};0.92;1`;

  return (
    <path
      d={d}
      fill="none"
      pathLength={1}
      stroke="#172033"
      strokeDasharray={1}
      strokeDashoffset={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      vectorEffect="non-scaling-stroke"
      opacity={opacity}
    >
      <animate
        attributeName="stroke-dashoffset"
        dur={SKETCH_DURATION}
        keyTimes={sketchKeyTimes}
        repeatCount="indefinite"
        values="1;1;0;0;0;0;1"
      />
      <animate
        attributeName="opacity"
        dur={SKETCH_DURATION}
        keyTimes={sketchKeyTimes}
        repeatCount="indefinite"
        values={`${opacity};${opacity};${opacity};${opacity};0;0;0`}
      />
    </path>
  );
}

function AnimatedMaskStroke({ d, start, end, strokeWidth, opacity = 1 }: AnimatedMaskStrokeProps) {
  const maskStart = mapPaintTime(start);
  const maskEnd = mapPaintTime(end);

  return (
    <path
      d={d}
      fill="none"
      pathLength={1}
      stroke="#ffffff"
      strokeDasharray={1}
      strokeDashoffset={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      opacity={0}
    >
      <animate
        attributeName="stroke-dashoffset"
        dur={SKETCH_DURATION}
        keyTimes={`0;${maskStart};${maskEnd};0.92;1`}
        repeatCount="indefinite"
        values="1;1;0;0;1"
      />
      <animate
        attributeName="opacity"
        dur={SKETCH_DURATION}
        keyTimes={`0;${maskStart};${maskEnd};0.92;1`}
        repeatCount="indefinite"
        values={`0;0;${opacity};${opacity};0`}
      />
    </path>
  );
}

function LandscapeSketchAnimation() {
  return (
    <div className="inkloomLandscapeSketch" aria-hidden>
      <style>{`
        .inkloomLandscapeSketch {
          position: fixed;
          right: clamp(0.25rem, 2.5vw, 2.5rem);
          top: 54%;
          width: min(48vw, 650px);
          min-width: 430px;
          transform: translateY(-50%) rotate(-0.6deg);
          z-index: 0;
          pointer-events: none;
          opacity: 0.92;
        }

        .inkloomLandscapeSketch svg {
          display: block;
          width: 100%;
          height: auto;
          filter: drop-shadow(0 24px 48px rgba(43, 55, 74, 0.12));
          overflow: visible;
        }

        @media (max-width: 980px) {
          .inkloomLandscapeSketch {
            right: -16vw;
            width: 72vw;
            min-width: 0;
            opacity: 0.32;
          }
        }

        @media (max-width: 720px) {
          .inkloomLandscapeSketch {
            display: none;
          }
        }
      `}</style>
      <svg viewBox="0 0 820 620" role="img">
        <defs>
          <clipPath id="landscape-painting-clip">
            <rect x="70" y="38" width="680" height="546" rx="18" />
          </clipPath>
          <filter id="landscape-paint-mask-noise" x="-12%" y="-12%" width="124%" height="124%">
            <feTurbulence baseFrequency="0.017 0.11" numOctaves="2" seed="12" type="fractalNoise" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="0.55" />
          </filter>
          <mask id="landscape-paint-mask" maskUnits="userSpaceOnUse">
            <rect x="70" y="38" width="680" height="546" fill="#000000" />
            <g filter="url(#landscape-paint-mask-noise)">
              <AnimatedMaskStroke d="M28 82 C154 34 286 70 420 42 C546 18 656 48 790 34" start={0.6} end={0.68} strokeWidth={128} />
              <AnimatedMaskStroke d="M28 168 C154 112 292 148 430 116 C558 86 676 118 792 92" start={0.63} end={0.72} strokeWidth={138} />
              <AnimatedMaskStroke d="M28 256 C154 204 288 232 430 204 C556 180 676 208 790 184" start={0.66} end={0.76} strokeWidth={132} />
              <AnimatedMaskStroke d="M28 350 C158 296 304 330 446 296 C578 266 688 300 792 272" start={0.7} end={0.81} strokeWidth={142} />
              <AnimatedMaskStroke d="M26 450 C164 390 318 430 462 396 C590 366 696 400 794 374" start={0.75} end={0.86} strokeWidth={148} />
              <AnimatedMaskStroke d="M34 548 C180 488 336 528 484 496 C604 470 704 496 790 474" start={0.8} end={0.9} strokeWidth={138} />
            </g>
            <rect x="70" y="38" width="680" height="546" fill="#ffffff" opacity={0}>
              <animate attributeName="opacity" dur={SKETCH_DURATION} keyTimes="0;0.86;0.92;0.94;1" repeatCount="indefinite" values="0;0;0.72;1;0" />
            </rect>
          </mask>
        </defs>
        <rect x="70" y="38" width="680" height="546" rx="18" fill="#fffdf8" opacity="0.72" />
        <rect x="70" y="38" width="680" height="546" rx="18" fill="none" stroke="rgba(23, 32, 51, 0.1)" strokeWidth="1.2" />
        <g clipPath="url(#landscape-painting-clip)">
          <image href="/landscape-painting.png" x="70" y="38" width="680" height="546" preserveAspectRatio="xMidYMid slice" mask="url(#landscape-paint-mask)" />

          <g>
            <AnimatedPath d="M70 214 C102 196 116 202 130 182 C150 154 184 160 206 176 C202 146 230 116 266 122 C268 94 304 72 342 78 C382 84 404 112 394 144 C418 126 444 138 440 168 C468 154 500 160 506 190 C526 184 550 188 568 198 C538 206 486 204 448 210 C396 218 342 218 292 220 C242 222 176 224 114 222 C90 222 72 222 70 214 Z" start={0.1} end={0.23} strokeWidth={1.75} opacity={0.86} />
            <AnimatedPath d="M556 152 C560 126 588 104 620 114 C638 122 650 138 646 158 C666 150 686 160 682 180 C706 176 726 184 738 196 C700 202 662 202 620 198 C584 196 550 198 524 202 C530 180 548 178 566 176 C556 168 552 160 556 152 Z" start={0.17} end={0.3} strokeWidth={1.65} opacity={0.82} />

            <AnimatedPath d="M70 330 C108 312 144 294 180 272 C196 260 212 244 232 226 C248 238 266 252 282 268 C302 280 318 284 340 294" start={0.22} end={0.35} strokeWidth={2.05} opacity={0.9} />
            <AnimatedPath d="M212 270 C244 254 272 238 304 226 C324 244 348 260 378 272" start={0.27} end={0.38} strokeWidth={1.65} opacity={0.86} />
            <AnimatedPath d="M316 300 C354 276 390 248 420 210 C444 178 476 154 506 116 C552 166 596 222 656 270 C690 294 722 316 750 328" start={0.28} end={0.48} strokeWidth={2.35} opacity={0.94} />
            <AnimatedPath d="M646 270 C674 258 690 234 716 216 C742 236 764 258 792 274" start={0.38} end={0.5} strokeWidth={1.85} opacity={0.84} />

            <AnimatedPath d="M70 394 C144 386 218 386 294 390 C386 394 480 396 568 394" start={0.5} end={0.62} strokeWidth={1.7} opacity={0.84} />
            <AnimatedPath d="M70 384 C94 376 110 380 126 360 C142 356 150 360 158 372 C178 366 202 370 220 378 C236 368 258 370 272 384 C296 374 318 376 330 390 C350 378 376 378 386 392 C404 384 428 386 438 398 C456 388 482 388 492 402 C510 394 536 396 550 404" start={0.56} end={0.7} strokeWidth={1.65} opacity={0.84} />

            <AnimatedPath d="M348 396 C398 404 446 416 486 438 C448 452 410 468 378 492 C338 522 284 544 216 556" start={0.58} end={0.74} strokeWidth={2.0} opacity={0.88} />
            <AnimatedPath d="M398 400 C448 406 492 420 532 448 C492 458 452 476 420 500 C390 522 350 548 292 570" start={0.62} end={0.78} strokeWidth={1.75} opacity={0.88} />
            <AnimatedPath d="M566 434 C548 426 548 404 568 392 C562 376 576 362 594 364 C596 342 622 328 646 338 C660 322 686 336 684 358 C710 352 730 368 722 394 C742 402 744 428 724 440 C734 460 712 476 690 472 C680 492 652 494 636 480 C616 494 588 486 590 464 C568 466 552 452 566 434 Z" start={0.62} end={0.82} strokeWidth={2.0} opacity={0.9} />
            <AnimatedPath d="M634 476 C628 498 620 514 608 528 M654 472 C662 494 670 512 682 530 M606 528 C632 518 660 518 690 530" start={0.78} end={0.88} strokeWidth={1.55} opacity={0.86} />
          </g>
        </g>
      </svg>
    </div>
  );
}

function drawPaperTexture(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
  ctx.lineWidth = 1;

  for (let i = 0; i < 18; i++) {
    const y = (height / 18) * i + Math.sin(time * 0.08 + i) * 7;
    ctx.beginPath();
    ctx.moveTo(-20, y);
    for (let x = -20; x <= width + 20; x += 80) {
      ctx.lineTo(x, y + Math.sin(x * 0.012 + i * 0.7) * 5);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function drawCenterWash(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, isHome: boolean) {
  const cx = width * (isHome ? 0.66 : 0.56) + Math.sin(time * 0.06) * 10;
  const cy = height * (isHome ? 0.52 : 0.5) + Math.cos(time * 0.05) * 8;
  const radius = Math.min(width, height) * (isHome ? 0.48 : 0.42);

  const wash = ctx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius);
  wash.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  wash.addColorStop(0.36, 'rgba(255, 255, 255, 0.14)');
  wash.addColorStop(0.7, 'rgba(255, 255, 255, 0.05)');
  wash.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
}

export function FractalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const drawingCanvas = canvas;
    const drawingContext = ctx;

    let frameId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let lastDraw = 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      drawingCanvas.width = Math.floor(width * dpr);
      drawingCanvas.height = Math.floor(height * dpr);
      drawingCanvas.style.width = `${width}px`;
      drawingCanvas.style.height = `${height}px`;
      drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(timestamp: number) {
      if (!reduceMotion && timestamp - lastDraw < 50) {
        frameId = requestAnimationFrame(draw);
        return;
      }

      lastDraw = timestamp;
      const time = reduceMotion ? 18 : timestamp * 0.001;
      const isHome = pathname === '/';

      drawingContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawingContext.clearRect(0, 0, width, height);

      const backdrop = drawingContext.createLinearGradient(0, 0, width, height);
      backdrop.addColorStop(0, '#faf8f2');
      backdrop.addColorStop(0.42, '#eef5f4');
      backdrop.addColorStop(1, '#f8f2f7');
      drawingContext.fillStyle = backdrop;
      drawingContext.fillRect(0, 0, width, height);

      drawCenterWash(drawingContext, width, height, time, isHome);
      drawPaperTexture(drawingContext, width, height, time);

      const edgeShade = drawingContext.createRadialGradient(
        width * 0.5,
        height * 0.45,
        Math.min(width, height) * 0.18,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.78
      );
      edgeShade.addColorStop(0, 'rgba(255, 255, 255, 0)');
      edgeShade.addColorStop(1, 'rgba(27, 34, 46, 0.12)');
      drawingContext.fillStyle = edgeShade;
      drawingContext.fillRect(0, 0, width, height);

      if (!reduceMotion) frameId = requestAnimationFrame(draw);
    }

    resize();
    draw(0);
    if (!reduceMotion) frameId = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, [pathname]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
        aria-hidden
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
        aria-hidden
      >
        {SPLATTERS.map((splat, index) => (
          <span
            key={`${splat.left}-${splat.top}`}
            style={{
              position: 'absolute',
              left: splat.left,
              top: splat.top,
              width: splat.width,
              aspectRatio: '735 / 752',
              minWidth: index < 3 ? '220px' : '96px',
              maxWidth: index < 3 ? '420px' : '240px',
              opacity: splat.opacity,
              backgroundColor: splat.color,
              transform: `rotate(${splat.rotate}deg)`,
              transformOrigin: '50% 50%',
              WebkitMaskImage: 'url(/paint-splat-mask.png)',
              maskImage: 'url(/paint-splat-mask.png)',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
            }}
          />
        ))}
      </div>
      {isHomePage && <LandscapeSketchAnimation />}
    </>
  );
}
