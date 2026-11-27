"use client";

import React from "react";

export function RadarChart({
  data,
  size = 250,
  color = "#22d3ee",
}: {
  data: { label: string; value: number }[];
  size?: number;
  color?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.34;
  const levels = [0.25, 0.5, 0.75, 1];
  const count = Math.max(data.length, 3);

  const getPoint = (index: number, ratio: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return {
      x: cx + r * ratio * Math.cos(angle),
      y: cy + r * ratio * Math.sin(angle),
    };
  };

  const polygonPoints = data
    .map((d, i) => {
      const pt = getPoint(i, Math.max(0.08, Math.min(1, d.value / 100)));
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[270px] mx-auto overflow-visible"
      role="img"
      aria-label="Cognitive and Psychometric Radar Profile"
    >
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.16" />
        </radialGradient>
      </defs>
      {levels.map((lvl) => {
        const pts = Array.from({ length: count })
          .map((_, i) => {
            const pt = getPoint(i, lvl);
            return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
          })
          .join(" ");
        return (
          <polygon
            key={lvl}
            points={pts}
            fill="none"
            stroke="rgba(148,163,184,0.22)"
            strokeWidth="1"
          />
        );
      })}
      {data.map((d, i) => {
        const outer = getPoint(i, 1);
        const labelPt = getPoint(i, 1.24);
        return (
          <g key={d.label}>
            <line
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(148,163,184,0.2)"
              strokeWidth="1"
            />
            <text
              x={labelPt.x}
              y={labelPt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] font-semibold fill-slate-500 dark:fill-slate-400"
            >
              {d.label}
            </text>
          </g>
        );
      })}
      <polygon
        points={polygonPoints}
        fill="url(#radarFill)"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {data.map((d, i) => {
        const pt = getPoint(i, Math.max(0.08, Math.min(1, d.value / 100)));
        return (
          <circle
            key={`pt-${d.label}`}
            cx={pt.x}
            cy={pt.y}
            r="3.8"
            fill={color}
            stroke="var(--bg-card)"
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
}

export function DonutGauge({
  value,
  max = 100,
  label,
  sublabel,
  color = "#22d3ee",
  size = 112,
}: {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  color?: string;
  size?: number;
}) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const offset = circ * (1 - pct);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(148,163,184,0.16)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold tracking-tight">{value}</span>
          {sublabel && <span className="text-[10px] text-slate-400">{sublabel}</span>}
        </div>
      </div>
      <span className="mt-2 text-xs font-medium text-slate-400">{label}</span>
    </div>
  );
}

export function MiniSparkline({
  values,
  color = "#22d3ee",
  height = 32,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  const width = 100;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * width;
      const y = height - ((v - min) / span) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-16 h-7 shrink-0 overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function AreaTrendChart({
  labels,
  seriesA,
  seriesB,
  labelA = "Automations",
  labelB = "Assessments",
}: {
  labels: string[];
  seriesA: number[];
  seriesB: number[];
  labelA?: string;
  labelB?: string;
}) {
  const w = 520;
  const h = 190;
  const padX = 28;
  const padY = 20;
  const maxVal = Math.max(...seriesA, ...seriesB, 10) * 1.15;

  const toCoords = (vals: number[]) =>
    vals.map((v, i) => ({
      x: padX + (i / Math.max(1, vals.length - 1)) * (w - padX * 2),
      y: h - padY - (v / maxVal) * (h - padY * 2),
    }));

  const ptsA = toCoords(seriesA);
  const ptsB = toCoords(seriesB);
  const lineA = ptsA.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const lineB = ptsB.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaA = `${padX},${h - padY} ${lineA} ${w - padX},${h - padY}`;

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          {labelA}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
          {labelB}
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h + 18}`} className="w-full h-48 overflow-visible">
        <defs>
          <linearGradient id="areaCyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {[0, 0.33, 0.66, 1].map((t) => {
          const y = h - padY - t * (h - padY * 2);
          return (
            <line
              key={t}
              x1={padX}
              y1={y}
              x2={w - padX}
              y2={y}
              stroke="rgba(148,163,184,0.12)"
              strokeDasharray="3 3"
            />
          );
        })}
        <polygon points={areaA} fill="url(#areaCyan)" />
        <polyline
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.5"
          strokeLinejoin="round"
          points={lineA}
        />
        <polyline
          fill="none"
          stroke="#818cf8"
          strokeWidth="2.2"
          strokeDasharray="5 3"
          strokeLinejoin="round"
          points={lineB}
        />
        {ptsA.map((p, i) => (
          <g key={labels[i]}>
            <circle cx={p.x} cy={p.y} r="3.2" fill="#22d3ee" />
            <text
              x={p.x}
              y={h + 4}
              textAnchor="middle"
              className="text-[10px] fill-slate-400"
            >
              {labels[i]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * Deterministic visual QR code pattern derived from any string (URL or Employee ID)
 */
export function QrCodeSvg({ value, size = 128 }: { value: string; size?: number }) {
  const cells = 21;
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const isFinder = (r: number, c: number) => {
    const inTopLeft = r < 7 && c < 7;
    const inTopRight = r < 7 && c >= cells - 7;
    const inBottomLeft = r >= cells - 7 && c < 7;
    if (!inTopLeft && !inTopRight && !inBottomLeft) return null;
    const lr = r >= cells - 7 ? r - (cells - 7) : r;
    const lc = c >= cells - 7 ? c - (cells - 7) : c;
    if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
    if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
    return false;
  };

  const rects: React.ReactElement[] = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const finder = isFinder(r, c);
      let filled = false;
      if (finder !== null) {
        filled = finder;
      } else if (
        (r === 7 && c < 8) ||
        (c === 7 && r < 8) ||
        (r === 7 && c >= cells - 8) ||
        (c === cells - 8 && r < 8) ||
        (r === cells - 8 && c < 8) ||
        (c === 7 && r >= cells - 8)
      ) {
        filled = false; // quiet separator around finder patterns
      } else if (r === 6 || c === 6) {
        filled = (r + c) % 2 === 0; // QR timing pattern
      } else {
        let mix = (hash ^ Math.imul(r + 11, 374761393) ^ Math.imul(c + 23, 668265263)) >>> 0;
        mix = Math.imul(mix ^ (mix >>> 13), 1274126177) >>> 0;
        mix = (mix ^ (mix >>> 16)) >>> 0;
        filled = (mix & 1) === 1;
      }
      if (filled) {
        rects.push(<rect key={`${r}-${c}`} x={c + 1} y={r + 1} width="1" height="1" rx="0.15" />);
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cells + 2} ${cells + 2}`}
      className="bg-white text-slate-950 rounded-xl p-1.5 shadow-md"
      fill="currentColor"
      role="img"
      aria-label={`QR Code for ${value}`}
    >
      {rects}
    </svg>
  );
}
