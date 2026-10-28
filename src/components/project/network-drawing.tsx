"use client";

import { useState } from "react";
import { isCalculated, type NetworkDesign } from "@/api/contracts/design";
import type { ProjectDetailResponse } from "@/api/contracts/spring";
import { headNodes, profilePath } from "./network-geometry";

const WIDTH = 800;
const HEIGHT = 420;
const PAD = 40;
const selectClass =
  "h-9 rounded-md border border-input bg-background px-2 text-sm";
const format = (value: number, digits = 2) =>
  value.toLocaleString("pt-BR", { maximumFractionDigits: digits });

function statusColor(design: NetworkDesign | undefined, segmentId: string) {
  const outcome = design?.segments.find((s) => s.segmentId === segmentId);
  if (!outcome) return "#94a3b8";
  if (
    !isCalculated(outcome) ||
    outcome.nonconformities.some((n) => n.severity === "CRITICAL")
  )
    return "#e11d48";
  return outcome.nonconformities.some((n) => n.severity === "WARNING")
    ? "#d97706"
    : "#0d9488";
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
  // Keep the drawing's aspect ratio: one scale for both axes.
  const span = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
    1,
  );
  const unit = (Math.min(WIDTH, HEIGHT) - 2 * PAD) / span;
  const x = (value: number) => PAD + (value - Math.min(...xs)) * unit;
  const y = (value: number) => HEIGHT - PAD - (value - Math.min(...ys)) * unit;
  const byId = new Map(network.nodes.map((node) => [node.id, node]));
  return (
    <figure className="space-y-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Planta da rede"
        className="w-full rounded-md border bg-background"
      >
        {network.segments.map((segment) => {
          const from = byId.get(segment.upstreamNodeId);
          const to = byId.get(segment.downstreamNodeId);
          if (!from || !to) return null;
          return (
            <g key={segment.id}>
              <title>{segment.code}</title>
              <line
                x1={x(from.x)}
                y1={y(from.y)}
                x2={x(to.x)}
                y2={y(to.y)}
                stroke={statusColor(design, segment.id)}
                strokeWidth={3}
              />
              <text
                x={(x(from.x) + x(to.x)) / 2}
                y={(y(from.y) + y(to.y)) / 2 - 6}
                fontSize={10}
                textAnchor="middle"
                className="fill-muted-foreground"
              >
                {segment.code}
              </text>
            </g>
          );
        })}
        {network.nodes.map((node) => (
          <g key={node.id}>
            <title>{node.code}</title>
            <circle
              cx={x(node.x)}
              cy={y(node.y)}
              r={4}
              className="fill-foreground"
            />
            <text
              x={x(node.x) + 6}
              y={y(node.y) + 12}
              fontSize={10}
              className="fill-foreground"
            >
              {node.code}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(
          [
            ["#0d9488", "Conforme"],
            ["#d97706", "Em atenção"],
            ["#e11d48", "Não conforme"],
            ["#94a3b8", "Sem cálculo"],
          ] as const
        ).map(([color, text]) => (
          <span key={text} className="flex items-center gap-1">
            <span
              className="inline-block h-1 w-4"
              style={{ background: color }}
            />
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
  if (path.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum caminho de escoamento a partir deste nó.
      </p>
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
  return (
    <figure className="space-y-3">
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
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Perfil longitudinal"
        className="w-full rounded-md border bg-background"
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
        {stations.map((s) => (
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
            <text
              x={x(s.from) + 3}
              y={HEIGHT - 8}
              fontSize={10}
              className="fill-muted-foreground"
            >
              {byId.get(s.segment.upstreamNodeId)?.code}
            </text>
          </g>
        ))}
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
      <figcaption className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>— Terreno (cinza)</span>
        <span>— Cota de fundo (azul)</span>
        <span>- - Geratriz superior (DN calculado)</span>
        {!design && <span>Sem cálculo: cotas importadas do DXF.</span>}
      </figcaption>
    </figure>
  );
}
