"use client";

import { useEffect, useRef } from "react";

const MEADOW_HEIGHT = 150;
const STEM_SPACING = 34;
const MIN_STEMS = 9;

/** Spring wildflowers along the bottom of the card, drawn once per size on a canvas. */
export function Meadow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function draw(target: HTMLCanvasElement) {
      const ratio = window.devicePixelRatio || 1;
      const width = target.clientWidth;
      target.width = width * ratio;
      target.height = MEADOW_HEIGHT * ratio;
      const ctx = target.getContext("2d");
      if (!ctx) return;
      ctx.scale(ratio, ratio);
      // Fixed seed: the meadow looks the same on every visit.
      let seed = 7;
      const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

      const leaf = (x: number, y: number, angle: number, size: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = "rgba(169,179,154,0.75)";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(size * 0.5, -size * 0.35, size, 0);
        ctx.quadraticCurveTo(size * 0.5, size * 0.35, 0, 0);
        ctx.fill();
        ctx.restore();
      };
      const blossom = (
        x: number,
        y: number,
        r: number,
        petal: string,
        centre: string,
      ) => {
        for (let i = 0; i < 5; i++) {
          const a = (Math.PI * 2 * i) / 5 + rand();
          ctx.fillStyle = petal;
          ctx.beginPath();
          ctx.ellipse(
            x + Math.cos(a) * r * 0.75,
            y + Math.sin(a) * r * 0.75,
            r * 0.62,
            r * 0.42,
            a,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.fillStyle = centre;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
      };

      const stems = Math.max(MIN_STEMS, Math.round(width / STEM_SPACING));
      for (let i = 0; i < stems; i++) {
        const x = (i + 0.5) * (width / stems) + (rand() - 0.5) * 18;
        // Taller at the edges so the flowers frame the card.
        const edge = Math.abs(x - width / 2) / (width / 2);
        const stemHeight = 40 + edge * 80 + rand() * 20;
        const bend = (rand() - 0.5) * 24;
        ctx.strokeStyle = "rgba(142,154,127,0.8)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x, MEADOW_HEIGHT);
        ctx.quadraticCurveTo(
          x + bend,
          MEADOW_HEIGHT - stemHeight / 2,
          x + bend * 0.6,
          MEADOW_HEIGHT - stemHeight,
        );
        ctx.stroke();
        for (let l = 1; l <= 3; l++) {
          const ly = MEADOW_HEIGHT - (stemHeight * l) / 4;
          leaf(x + bend * (l / 4), ly, -0.6 - rand() * 0.5, 10 + rand() * 6);
          leaf(
            x + bend * (l / 4),
            ly + 6,
            Math.PI + 0.6 + rand() * 0.5,
            9 + rand() * 6,
          );
        }
        const daisy = rand() > 0.62;
        blossom(
          x + bend * 0.6,
          MEADOW_HEIGHT - stemHeight,
          daisy ? 7 : 5.5,
          daisy ? "rgba(255,253,250,0.95)" : "rgba(235,180,175,0.85)",
          daisy ? "rgba(226,190,120,0.9)" : "rgba(214,161,155,0.95)",
        );
        if (rand() > 0.5) {
          blossom(
            x + bend * 0.4 + 6,
            MEADOW_HEIGHT - stemHeight * 0.7,
            3.6,
            "rgba(235,180,175,0.8)",
            "rgba(214,161,155,0.9)",
          );
        }
      }
    }

    draw(canvas);
    const observer = new ResizeObserver(() => draw(canvas));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="-mx-6 mt-1 block h-[150px] w-[calc(100%+3rem)]"
    />
  );
}
