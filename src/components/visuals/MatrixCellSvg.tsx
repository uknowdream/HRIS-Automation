"use client";

import React from "react";
import type { MatrixCellSpec } from "@/types/hris";

function renderShape(
  spec: MatrixCellSpec,
  cx: number,
  cy: number,
  radius: number,
  patternId: string
) {
  const fillVal =
    spec.fill === "solid"
      ? spec.color
      : spec.fill === "striped"
      ? `url(#${patternId})`
      : "none";
  const strokeVal = spec.color;
  const strokeW = spec.fill === "solid" ? 1.5 : 2.6;
  const transform = `rotate(${spec.rotation} ${cx} ${cy})`;

  switch (spec.shape) {
    case "circle":
      return (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth={strokeW}
        />
      );
    case "square":
      return (
        <rect
          x={cx - radius}
          y={cy - radius}
          width={radius * 2}
          height={radius * 2}
          rx={2.5}
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth={strokeW}
          transform={transform}
        />
      );
    case "triangle": {
      const p1 = `${cx},${cy - radius * 1.1}`;
      const p2 = `${cx + radius * 1.05},${cy + radius * 0.9}`;
      const p3 = `${cx - radius * 1.05},${cy + radius * 0.9}`;
      return (
        <polygon
          points={`${p1} ${p2} ${p3}`}
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth={strokeW}
          strokeLinejoin="round"
          transform={transform}
        />
      );
    }
    case "diamond": {
      const pts = `${cx},${cy - radius * 1.15} ${cx + radius * 0.95},${cy} ${cx},${
        cy + radius * 1.15
      } ${cx - radius * 0.95},${cy}`;
      return (
        <polygon
          points={pts}
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth={strokeW}
          strokeLinejoin="round"
          transform={transform}
        />
      );
    }
    case "hexagon": {
      const pts = Array.from({ length: 6 })
        .map((_, i) => {
          const a = (Math.PI / 3) * i - Math.PI / 6;
          return `${(cx + radius * Math.cos(a)).toFixed(1)},${(
            cy +
            radius * Math.sin(a)
          ).toFixed(1)}`;
        })
        .join(" ");
      return (
        <polygon
          points={pts}
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth={strokeW}
          strokeLinejoin="round"
          transform={transform}
        />
      );
    }
    case "cross": {
      const t = radius * 0.36;
      const d = `M${cx - t},${cy - radius} H${cx + t} V${cy - t} H${cx + radius} V${
        cy + t
      } H${cx + t} V${cy + radius} H${cx - t} V${cy + t} H${cx - radius} V${
        cy - t
      } H${cx - t} Z`;
      return (
        <path
          d={d}
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth={strokeW}
          strokeLinejoin="round"
          transform={transform}
        />
      );
    }
    case "star": {
      const pts = Array.from({ length: 10 })
        .map((_, i) => {
          const r = i % 2 === 0 ? radius * 1.15 : radius * 0.5;
          const a = (Math.PI / 5) * i - Math.PI / 2;
          return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
        })
        .join(" ");
      return (
        <polygon
          points={pts}
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth={strokeW}
          strokeLinejoin="round"
          transform={transform}
        />
      );
    }
    case "bar":
      return (
        <rect
          x={cx - radius * 1.15}
          y={cy - radius * 0.32}
          width={radius * 2.3}
          height={radius * 0.64}
          rx={3}
          fill={fillVal}
          stroke={strokeVal}
          strokeWidth={strokeW}
          transform={transform}
        />
      );
    default:
      return null;
  }
}

export function MatrixCellSvg({
  spec,
  uid,
  size = 86,
}: {
  spec: MatrixCellSpec | null;
  uid: string;
  size?: number;
}) {
  if (!spec) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border-2 border-dashed border-cyan-400/70 bg-cyan-500/10 font-black text-2xl text-cyan-400"
        style={{ width: size, height: size }}
      >
        ?
      </div>
    );
  }

  const patternId = `stripe-${uid}`;
  const positions: { x: number; y: number; r: number }[] =
    spec.count === 1
      ? [{ x: 50, y: 50, r: 23 }]
      : spec.count === 2
      ? [
          { x: 32, y: 50, r: 15 },
          { x: 68, y: 50, r: 15 },
        ]
      : spec.count === 3
      ? [
          { x: 50, y: 30, r: 13 },
          { x: 30, y: 67, r: 13 },
          { x: 70, y: 67, r: 13 },
        ]
      : [
          { x: 32, y: 32, r: 12 },
          { x: 68, y: 32, r: 12 },
          { x: 32, y: 68, r: 12 },
          { x: 68, y: 68, r: 12 },
        ];

  const dotCoord =
    spec.dotPos === "top"
      ? { x: 50, y: 12 }
      : spec.dotPos === "right"
      ? { x: 88, y: 50 }
      : spec.dotPos === "bottom"
      ? { x: 50, y: 88 }
      : spec.dotPos === "left"
      ? { x: 12, y: 50 }
      : spec.dotPos === "center"
      ? { x: 50, y: 50 }
      : null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="matrix-dark-board rounded-xl bg-slate-950/90 border border-slate-700/60"
    >
      <defs>
        <pattern
          id={patternId}
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke={spec.color} strokeWidth="2.4" />
        </pattern>
      </defs>
      {positions.map((p, idx) => (
        <g key={idx}>{renderShape(spec, p.x, p.y, p.r, patternId)}</g>
      ))}
      {dotCoord && (
        <circle
          cx={dotCoord.x}
          cy={dotCoord.y}
          r={spec.dotPos === "center" ? 4.5 : 5.5}
          fill="#f8fafc"
          stroke={spec.color}
          strokeWidth="2"
        />
      )}
    </svg>
  );
}
