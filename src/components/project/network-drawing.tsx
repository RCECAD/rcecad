"use client";

import { useState } from "react";
import { isCalculated, type NetworkDesign } from "@/api/contracts/design";
import type { ProjectDetailResponse } from "@/api/contracts/spring";
import { headNodes, profilePath, spacedLabels } from "./network-geometry";

const WIDTH = 800;
const HEIGHT = 420;
const PAD = 40;
const selectClass =
  "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
// Phones would shrink the 800-unit viewBox until the 10px labels are unreadable.
const svgFrameClass = "overflow-x-auto overscroll-x-contain rounded-md border";
const svgClass = "w-full min-w-[640px] bg-background";
const format = (value: number, digits = 2) =>
  value.toLocaleString("pt-BR", { maximumFractionDigits: digits });

// Dash patterns keep the status readable without relying on color alone.
const statusStyles = {
  ok: { stroke: "#0d9488", dash: undefined, text: "Conforme" },
  warning: { stroke: "#d97706", dash: "10 4", text: "Em atenção" },
  critical: { stroke: "#e11d48", dash: "10 3 2 3", text: "Não conforme" },
  none: { stroke: "#94a3b8", dash: "2 4", text: "Sem cálculo" },
} as const;

function segmentStatus(
  design: NetworkDesign | undefined,
  segmentId: string,
): keyof typeof statusStyles {
  const outcome = design?.segments.find((s) => s.segmentId === segmentId);
  if (!outcome) return "none";
  if (
    !isCalculated(outcome) ||
    outcome.nonconformities.some((n) => n.severity === "CRITICAL")
  )
    return "critical";
  return outcome.nonconformities.some((n) => n.severity === "WARNING")
    ? "warning"
    : "ok";
}

function Swatch({ stroke, dash }: { stroke: string; dash?: string }) {
  return (
    <svg width="24" height="6" aria-hidden="true">
      <line
        x1={0}
        y1={3}
        x2={24}
        y2={3}
        stroke={stroke}
        strokeWidth={2}
        strokeDasharray={dash}
      />
    </svg>
  );
}

function scale(values: number[], size: number, invert = false) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return (value: number) => {
    const ratio = (value - min) / span;
    return PAD + (invert ? 1 - ratio : ratio) * (size - 2 * PAD);
  };
}

export function NetworkPlan({
  network,
  design,
}: {
  network: ProjectDetailResponse;
  design?: NetworkDesign;
}) {
  const xs = network.nodes.map((node) => node.x);
  const ys = network.nodes.map((node) => node.y);
  const spanX = Math.max(Math.max(...xs) - Math.min(...xs), 1);
  const spanY = Math.max(Math.max(...ys) - Math.min(...ys), 1);
  // One scale for both axes keeps the drawing's proportions; the slack centres it.
  const unit = Math.min((WIDTH - 2 * PAD) / spanX, (HEIGHT - 2 * PAD) / spanY);
  const offsetX = (WIDTH - spanX * unit) / 2;
  const offsetY = (HEIGHT - spanY * unit) / 2;
  const x = (value: number) => offsetX + (value - Math.min(...xs)) * unit;
  const y = (value: number) =>
    HEIGHT - offsetY - (value - Math.min(...ys)) * unit;
  const byId = new Map(network.nodes.map((node) => [node.id, node]));
  const segmentMid = network.segments.map((segment) => {
    const from = byId.get(segment.upstreamNodeId);
    const to = byId.get(segment.downstreamNodeId);
    return from && to
      ? { x: (x(from.x) + x(to.x)) / 2, y: (y(from.y) + y(to.y)) / 2 - 6 }
      : { x: Number.NaN, y: Number.NaN };
  });
  const shown = spacedLabels(
    [
      ...network.nodes.map((node) => ({ x: x(node.x) + 6, y: y(node.y) + 12 })),
      ...segmentMid,
    ],
    32,
  );
  const nodeLabel = (index: number) => shown[index];
  const segmentLabel = (index: number) => shown[network.nodes.length + index];
  return (
    <figure className="space-y-2">
      <div className={svgFrameClass}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Planta da rede"
          className={svgClass}
        >
          {network.segments.map((segment, index) => {
            const from = byId.get(segment.upstreamNodeId);
            const to = byId.get(segment.downstreamNodeId);
            if (!from || !to) return null;
            const status = statusStyles[segmentStatus(design, segment.id)];
            return (
              <g key={segment.id}>
                <title>{segment.code}</title>
                <line
                  x1={x(from.x)}
                  y1={y(from.y)}
                  x2={x(to.x)}
                  y2={y(to.y)}
                  stroke={status.stroke}
                  strokeDasharray={status.dash}
                  strokeWidth={3}
                />
                {segmentLabel(index) && (
                  <text
                    x={segmentMid[index].x}
                    y={segmentMid[index].y}
                    fontSize={10}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                  >
                    {segment.code}
                  </text>
                )}
              </g>
            );
          })}
          {network.nodes.map((node, index) => (
            <g key={node.id}>
              <title>{node.code}</title>
              <circle
                cx={x(node.x)}
                cy={y(node.y)}
                r={4}
                className="fill-foreground"
              />
              {nodeLabel(index) && (
                <text
                  x={x(node.x) + 6}
                  y={y(node.y) + 12}
                  fontSize={10}
                  className="fill-foreground"
                >
                  {node.code}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <p className="text-xs text-muted-foreground">
        Rótulos próximos demais ficam ocultos; todos os códigos estão em
        Resultados por Trecho.
      </p>
      <figcaption className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {Object.values(statusStyles).map(({ stroke, dash, text }) => (
          <span key={text} className="flex items-center gap-1">
            <Swatch stroke={stroke} dash={dash} />
            {text}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

export function LongitudinalProfile({
  network,
  design,
}: {
  network: ProjectDetailResponse;
  design?: NetworkDesign;
}) {
  const heads = headNodes(network);
  const [start, setStart] = useState(heads[0]?.id ?? "");
  const path = profilePath(network, start);
  const picker = (
    <label className="flex items-center gap-2 text-sm">
      Início do perfil
      <select
        className={selectClass}
        value={start}
        onChange={(event) => setStart(event.target.value)}
      >
        {heads.map((node) => (
          <option key={node.id} value={node.id}>
            {node.code}
          </option>
        ))}
      </select>
    </label>
  );
  if (path.length === 0)
    return (
      <div className="space-y-3">
        {picker}
        <p className="text-sm text-muted-foreground">
          Nenhum caminho de escoamento a partir deste nó.
        </p>
      </div>
    );
  const byId = new Map(network.nodes.map((node) => [node.id, node]));
  const stations = path.map(({ segment, start: distance }) => {
    const outcome = design?.segments.find((s) => s.segmentId === segment.id);
    const choice = outcome && isCalculated(outcome) ? outcome.choice : null;
    const upInvert = choice?.upstreamInvertM ?? segment.upstreamInvert;
    const downInvert = choice
      ? choice.upstreamInvertM - choice.slope * segment.length
      : segment.downstreamInvert;
    const diameter = (choice?.diameterMm ?? 0) / 1000;
    return {
      segment,
      from: distance,
      to: distance + segment.length,
      upInvert,
      downInvert,
      diameter,
      upGround: byId.get(segment.upstreamNodeId)?.terrainElevation ?? null,
      downGround: byId.get(segment.downstreamNodeId)?.terrainElevation ?? null,
    };
  });
  const elevations = stations.flatMap((s) =>
    [
      s.upInvert,
      s.downInvert,
      s.upInvert + s.diameter,
      s.upGround,
      s.downGround,
    ].filter((value): value is number => value !== null),
  );
  const total = stations[stations.length - 1].to;
  const x = scale([0, total], WIDTH);
  const y = scale(elevations, HEIGHT, true);
  const line = (points: [number, number | null][]) =>
    points
      .filter((point): point is [number, number] => point[1] !== null)
      .map(([distance, elevation]) => `${x(distance)},${y(elevation)}`)
      .join(" ");
  // The outlet is checked first so it keeps its label; then from upstream.
  const labelX = [...stations.map((s) => x(s.from)), x(total)];
  const ordered = spacedLabels(
    [labelX[labelX.length - 1], ...labelX.slice(0, -1)].map((value) => ({
      x: value,
      y: 0,
    })),
    52,
  );
  const nodeLabels = [...ordered.slice(1), ordered[0]];
  return (
    <figure className="space-y-3">
      {picker}
      <div className={svgFrameClass}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Perfil longitudinal"
          className={svgClass}
        >
          <polyline
            points={line(
              stations.flatMap((s) => [
                [s.from, s.upGround] as [number, number | null],
                [s.to, s.downGround] as [number, number | null],
              ]),
            )}
            fill="none"
            stroke="#78716c"
            strokeWidth={2}
          />
          {stations.map((s, index) => (
            <g key={s.segment.id}>
              <title>
                {`${s.segment.code}: CF ${format(s.upInvert, 3)} → ${format(s.downInvert, 3)} m`}
              </title>
              <line
                x1={x(s.from)}
                y1={y(s.upInvert)}
                x2={x(s.to)}
                y2={y(s.downInvert)}
                stroke="#2563eb"
                strokeWidth={2}
              />
              {s.diameter > 0 && (
                <line
                  x1={x(s.from)}
                  y1={y(s.upInvert + s.diameter)}
                  x2={x(s.to)}
                  y2={y(s.downInvert + s.diameter)}
                  stroke="#2563eb"
                  strokeDasharray="4 3"
                />
              )}
              <line
                x1={x(s.from)}
                x2={x(s.from)}
                y1={PAD / 2}
                y2={HEIGHT - PAD / 2}
                stroke="#e2e8f0"
              />
              {nodeLabels[index] && (
                <text
                  x={x(s.from) + 3}
                  y={HEIGHT - 8}
                  fontSize={10}
                  className="fill-muted-foreground"
                >
                  {byId.get(s.segment.upstreamNodeId)?.code}
                </text>
              )}
            </g>
          ))}
          {nodeLabels[stations.length] && (
            <text
              x={x(total) - 3}
              y={HEIGHT - 8}
              fontSize={10}
              textAnchor="end"
              className="fill-muted-foreground"
            >
              {
                byId.get(stations[stations.length - 1].segment.downstreamNodeId)
                  ?.code
              }
            </text>
          )}
          <text x={PAD} y={14} fontSize={10} className="fill-muted-foreground">
            {format(Math.max(...elevations), 2)} m
          </text>
          <text
            x={PAD}
            y={HEIGHT - PAD + 12}
            fontSize={10}
            className="fill-muted-foreground"
          >
            {format(Math.min(...elevations), 2)} m · {format(total, 1)} m de
            extensão
          </text>
        </svg>
      </div>
      <figcaption className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(
          [
            ["#78716c", undefined, "Terreno"],
            ["#2563eb", undefined, "Cota de fundo"],
            ["#2563eb", "4 3", "Geratriz superior (DN calculado)"],
          ] as const
        ).map(([stroke, dash, text]) => (
          <span key={text} className="flex items-center gap-1">
            <Swatch stroke={stroke} dash={dash} />
            {text}
          </span>
        ))}
        {!design && <span>Sem cálculo: cotas importadas do DXF.</span>}
      </figcaption>
    </figure>
  );
}
