'use client';

import { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
  next: Point | null;
}

interface PointList {
  first: Point;
}

interface Circle {
  centerX: number;
  centerY: number;
  maxRad: number;
  minRad: number;
  color: CanvasGradient;
  param: number;
  changeSpeed: number;
  phase: number;
  globalPhase: number;
  pointList1: PointList;
  pointList2: PointList;
}

const TWO_PI = 2 * Math.PI;

function setLinePoints(iterations: number): PointList {
  const pointList: PointList = { first: { x: 0, y: 1, next: null } };
  const lastPoint: Point = { x: 1, y: 1, next: null };
  let minY = 1;
  let maxY = 1;

  pointList.first.next = lastPoint;

  for (let i = 0; i < iterations; i++) {
    let point: Point | null = pointList.first;
    while (point?.next) {
      const nextPoint = point.next;
      const dx = nextPoint.x - point.x;
      const newX = 0.5 * (point.x + nextPoint.x);
      let newY = 0.5 * (point.y + nextPoint.y);
      newY += dx * (Math.random() * 2 - 1);

      const newPoint: Point = { x: newX, y: newY, next: nextPoint };
      if (newY < minY) minY = newY;
      else if (newY > maxY) maxY = newY;
      point.next = newPoint;
      point = nextPoint;
    }
  }

  if (maxY !== minY) {
    const normalizeRate = 1 / (maxY - minY);
    let point: Point | null = pointList.first;
    while (point) {
      point.y = normalizeRate * (point.y - minY);
      point = point.next;
    }
  } else {
    let point: Point | null = pointList.first;
    while (point) {
      point.y = 1;
      point = point.next;
    }
  }

  return pointList;
}

export function FractalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let timerId: ReturnType<typeof setInterval> | null = null;
    let delayId: ReturnType<typeof setTimeout> | null = null;
    const pauseBeforeRestartMs = 60000; // 1 minute static before loop restarts
    const maxMaxRad = 380;
    const minMaxRad = 380;
    const minRadFactor = 0;
    const iterations = 10;
    const drawsPerFrame = 8;
    const lineWidth = 1.01;
    const xSqueeze = 0.92;

    let drawCount = 0;
    let circles: Circle[] = [];
    let displayWidth = 0;
    let displayHeight = 0;

    function resize() {
      displayWidth = window.innerWidth;
      displayHeight = window.innerHeight;
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    function setCircles() {
      circles = [];
      const maxR = minMaxRad + Math.random() * (maxMaxRad - minMaxRad);
      const minR = minRadFactor * maxR;
      const grad = context.createRadialGradient(0, 0, minR, 0, 0, maxR);
      grad.addColorStop(1, 'rgba(0,170,200,0.2)');
      grad.addColorStop(0, 'rgba(0,20,170,0.2)');

      const newCircle: Circle = {
        centerX: 120,
        centerY: displayHeight + 80,
        maxRad: maxR,
        minRad: minR,
        color: grad,
        param: 0,
        changeSpeed: 1 / 250,
        phase: Math.random() * TWO_PI,
        globalPhase: Math.random() * TWO_PI,
        pointList1: setLinePoints(iterations),
        pointList2: setLinePoints(iterations),
      };
      circles.push(newCircle);
    }

    function startGenerate() {
      drawCount = 0;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, displayWidth, displayHeight);
      setCircles();
    }

    function onTimer() {
      for (let j = 0; j < drawsPerFrame; j++) {
        drawCount++;
        for (let i = 0; i < circles.length; i++) {
          const c = circles[i];
          c.param += c.changeSpeed;
          if (c.param >= 1) {
            c.param = 0;
            c.pointList1 = c.pointList2;
            c.pointList2 = setLinePoints(iterations);
          }

          const cosParam = 0.5 - 0.5 * Math.cos(Math.PI * c.param);
          context.strokeStyle = c.color;
          context.lineWidth = lineWidth;
          context.beginPath();

          let point1 = c.pointList1.first;
          let point2 = c.pointList2.first;
          c.phase += 0.0002;
          let theta = c.phase;
          let rad = c.minRad + (point1.y + cosParam * (point2.y - point1.y)) * (c.maxRad - c.minRad);

          c.centerX += 0.2;
          c.centerY -= 0.2;
          const yOffset = 40 * Math.sin(c.globalPhase + (drawCount / 1000) * TWO_PI);

          if (c.centerX > displayWidth + maxMaxRad || c.centerY < -maxMaxRad) {
            if (timerId) clearInterval(timerId);
            timerId = null;
            delayId = setTimeout(() => {
              delayId = null;
              startGenerate();
              timerId = setInterval(onTimer, 1000 / 50);
            }, pauseBeforeRestartMs);
            return;
          }

          context.setTransform(xSqueeze, 0, 0, 1, c.centerX, c.centerY + yOffset);

          let x0 = xSqueeze * rad * Math.cos(theta);
          let y0 = rad * Math.sin(theta);
          context.lineTo(x0, y0);

          while (point1.next) {
            point1 = point1.next;
            point2 = point2.next!;
            theta = TWO_PI * (point1.x + cosParam * (point2.x - point1.x)) + c.phase;
            rad = c.minRad + (point1.y + cosParam * (point2.y - point1.y)) * (c.maxRad - c.minRad);
            x0 = xSqueeze * rad * Math.cos(theta);
            y0 = rad * Math.sin(theta);
            context.lineTo(x0, y0);
          }
          context.closePath();
          context.stroke();
        }
      }
    }

    resize();
    startGenerate();
    timerId = setInterval(onTimer, 1000 / 50);

    const handleResize = () => {
      if (delayId) clearTimeout(delayId);
      delayId = null;
      if (timerId) clearInterval(timerId);
      resize();
      startGenerate();
      timerId = setInterval(onTimer, 1000 / 50);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (timerId) clearInterval(timerId);
      if (delayId) clearTimeout(delayId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      aria-hidden
    />
  );
}
