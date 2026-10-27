"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { type ChangeEvent, useState } from "react";
import type { z } from "zod";
import {
  invalidateProjectDependents,
  projectQueryKeys,
} from "@/api/client/query-keys";
import { expectNoContent, parseClientJson } from "@/api/client/response";
import {
  nodeRequestSchema,
  nodeTypeSchema,
  segmentRequestSchema,
} from "@/api/contracts/resources";
import {
  type HydraulicNodeResponse,
  hydraulicNodeResponseSchema,
  projectDetailResponseSchema,
  type SegmentResponse,
  segmentResponseSchema,
} from "@/api/contracts/spring";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";
const nodeTypeLabels = {
  PV: "Poço de visita (PV)",
  TIL: "Terminal de inspeção e limpeza (TIL)",
  TL: "Terminal de limpeza (TL)",
  CP: "Caixa de passagem (CP)",
} as const;

type NodeDraft = Record<
  | "code"
  | "type"
  | "x"
  | "y"
  | "invertElevation"
  | "terrainElevation"
  | "angle",
  string
> & { hasDropTube: boolean };
type SegmentDraft = Record<
  | "code"
  | "upstreamNodeId"
  | "downstreamNodeId"
  | "upstreamInvert"
  | "downstreamInvert",
  string
>;
const emptyNode: NodeDraft = {
  code: "",
  type: "PV",
  hasDropTube: false,
  x: "",
  y: "",
  invertElevation: "",
  terrainElevation: "",
  angle: "",
};
const emptySegment: SegmentDraft = {
  code: "",
  upstreamNodeId: "",
  downstreamNodeId: "",
  upstreamInvert: "",
  downstreamInvert: "",
};
const text = (value: number | null) => (value === null ? "" : String(value));
const required = (value: string) =>
  value.trim() === "" ? Number.NaN : Number(value);
const optional = (value: string) =>
  value.trim() === "" ? null : Number(value);

export const toNodeRequest = (draft: NodeDraft) =>
  nodeRequestSchema.safeParse({
    code: draft.code,
    type: draft.type,
    hasDropTube: draft.hasDropTube,
    x: required(draft.x),
    y: required(draft.y),
    invertElevation: required(draft.invertElevation),
    terrainElevation: optional(draft.terrainElevation),
    angle: optional(draft.angle),
  });
export const toSegmentRequest = (draft: SegmentDraft) =>
  segmentRequestSchema.safeParse({
    code: draft.code,
    upstreamNodeId: draft.upstreamNodeId,
    downstreamNodeId: draft.downstreamNodeId,
    upstreamInvert: required(draft.upstreamInvert),
    downstreamInvert: required(draft.downstreamInvert),
  });
const nodeDraft = (node: HydraulicNodeResponse): NodeDraft => ({
  code: node.code,
  type: node.type,
  hasDropTube: node.hasDropTube,
  x: String(node.x),
  y: String(node.y),
  invertElevation: String(node.invertElevation),
  terrainElevation: text(node.terrainElevation),
  angle: text(node.angle),
});
const segmentDraft = (segment: SegmentResponse): SegmentDraft => ({
  code: segment.code,
  upstreamNodeId: segment.upstreamNodeId,
  downstreamNodeId: segment.downstreamNodeId,
  upstreamInvert: String(segment.upstreamInvert),
  downstreamInvert: String(segment.downstreamInvert),
});

function useEntityMutations<T>(
  projectId: string,
  collection: "nodes" | "segments",
  schema: z.ZodType<T>,
) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const base = `/api/projects/${projectId}/${collection}`;
  const done = async () => {
    await queryClient.invalidateQueries({
      queryKey: projectQueryKeys.network(projectId),
    });
    await invalidateProjectDependents(queryClient, projectId);
    router.refresh();
  };
  const save = useMutation({
    mutationFn: async ({ id, body }: { id?: string; body: unknown }) =>
      parseClientJson(
        await fetch(id ? `${base}/${id}` : base, {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        schema,
        "Não foi possível salvar a alteração da rede.",
      ),
    onSuccess: done,
  });
  const remove = useMutation({
    mutationFn: async (id: string) =>
      expectNoContent(
        await fetch(`${base}/${id}`, { method: "DELETE" }),
        "Não foi possível excluir o item da rede.",
      ),
    onSuccess: done,
  });
  return { save, remove };
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Input
      type="number"
      step="any"
      aria-label={label}
      placeholder={label}
      value={value}
      onChange={onChange}
    />
  );
}

function NodeForm({
  projectId,
  nodes,
}: {
  projectId: string;
  nodes: HydraulicNodeResponse[];
}) {
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState<NodeDraft>(emptyNode);
  const [invalid, setInvalid] = useState(false);
  const { save, remove } = useEntityMutations(
    projectId,
    "nodes",
    hydraulicNodeResponseSchema,
  );
  const bind = (key: Exclude<keyof NodeDraft, "hasDropTube">) => ({
    value: draft[key],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDraft({ ...draft, [key]: event.target.value }),
  });
  const reset = () => {
    setEditing("");
    setDraft(emptyNode);
  };
  const submit = () => {
    const parsed = toNodeRequest(draft);
    setInvalid(!parsed.success);
    if (parsed.success)
      save.mutate(
        { id: editing || undefined, body: parsed.data },
        { onSuccess: reset },
      );
  };
  return (
    <fieldset aria-label="Nó" className="space-y-3 rounded-md border p-4">
      <legend className="px-1 text-sm font-medium">Nós</legend>
      <select
        aria-label="Nó a editar"
        className={selectClass}
        value={editing}
        onChange={(event) => {
          const node = nodes.find((item) => item.id === event.target.value);
          setEditing(event.target.value);
          setDraft(node ? nodeDraft(node) : emptyNode);
        }}
      >
        <option value="">Novo nó</option>
        {nodes.map((node) => (
          <option key={node.id} value={node.id}>
            {node.code}
          </option>
        ))}
      </select>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          aria-label="Código do nó"
          placeholder="Código (ex.: PV-02)"
          maxLength={50}
          {...bind("code")}
        />
        <select
          aria-label="Tipo do nó"
          className={selectClass}
          {...bind("type")}
        >
          {nodeTypeSchema.options.map((type) => (
            <option key={type} value={type}>
              {nodeTypeLabels[type]}
            </option>
          ))}
        </select>
        <NumberField label="Coordenada X" {...bind("x")} />
        <NumberField label="Coordenada Y" {...bind("y")} />
        <NumberField label="Cota de fundo (m)" {...bind("invertElevation")} />
        <NumberField
          label="Cota de terreno (m)"
          {...bind("terrainElevation")}
        />
        <NumberField label="Ângulo (graus)" {...bind("angle")} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.hasDropTube}
            onChange={(event) =>
              setDraft({ ...draft, hasDropTube: event.target.checked })
            }
          />
          Possui tubo de queda
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={save.isPending} onClick={submit}>
          {editing ? "Salvar nó" : "Adicionar nó"}
        </Button>
        {editing && (
          <Button
            size="sm"
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => {
              if (window.confirm(`Excluir o nó ${draft.code}?`))
                remove.mutate(editing, { onSuccess: reset });
            }}
          >
            Excluir nó
          </Button>
        )}
      </div>
      {(invalid || save.isError || remove.isError) && (
        <p role="alert" className="text-sm text-destructive">
          {invalid
            ? "Informe código, tipo, coordenadas e cota de fundo numéricas."
            : (save.error?.message ?? remove.error?.message)}
        </p>
      )}
    </fieldset>
  );
}

function SegmentForm({
  projectId,
  nodes,
  segments,
}: {
  projectId: string;
  nodes: HydraulicNodeResponse[];
  segments: SegmentResponse[];
}) {
  const [editing, setEditing] = useState("");
  const [draft, setDraft] = useState<SegmentDraft>(emptySegment);
  const [invalid, setInvalid] = useState(false);
  const { save, remove } = useEntityMutations(
    projectId,
    "segments",
    segmentResponseSchema,
  );
  const bind = (key: keyof SegmentDraft) => ({
    value: draft[key],
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDraft({ ...draft, [key]: event.target.value }),
  });
  const reset = () => {
    setEditing("");
    setDraft(emptySegment);
  };
  const submit = () => {
    const parsed = toSegmentRequest(draft);
    setInvalid(!parsed.success);
    if (parsed.success)
      save.mutate(
        { id: editing || undefined, body: parsed.data },
        { onSuccess: reset },
      );
  };
  const nodeOptions = nodes.map((node) => (
    <option key={node.id} value={node.id}>
      {node.code}
    </option>
  ));
  return (
    <fieldset aria-label="Trecho" className="space-y-3 rounded-md border p-4">
      <legend className="px-1 text-sm font-medium">Trechos</legend>
      <select
        aria-label="Trecho a editar"
        className={selectClass}
        value={editing}
        onChange={(event) => {
          const segment = segments.find(
            (item) => item.id === event.target.value,
          );
          setEditing(event.target.value);
          setDraft(segment ? segmentDraft(segment) : emptySegment);
        }}
      >
        <option value="">Novo trecho</option>
        {segments.map((segment) => (
          <option key={segment.id} value={segment.id}>
            {segment.code}
          </option>
        ))}
      </select>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          aria-label="Código do trecho"
          placeholder="Código (ex.: T-02)"
          maxLength={50}
          className="sm:col-span-2"
          {...bind("code")}
        />
        <select
          aria-label="Nó de montante"
          className={selectClass}
          {...bind("upstreamNodeId")}
        >
          <option value="">Montante...</option>
          {nodeOptions}
        </select>
        <select
          aria-label="Nó de jusante"
          className={selectClass}
          {...bind("downstreamNodeId")}
        >
          <option value="">Jusante...</option>
          {nodeOptions}
        </select>
        <NumberField
          label="Cota de fundo a montante (m)"
          {...bind("upstreamInvert")}
        />
        <NumberField
          label="Cota de fundo a jusante (m)"
          {...bind("downstreamInvert")}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={save.isPending} onClick={submit}>
          {editing ? "Salvar trecho" : "Adicionar trecho"}
        </Button>
        {editing && (
          <Button
            size="sm"
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => {
              if (window.confirm(`Excluir o trecho ${draft.code}?`))
                remove.mutate(editing, { onSuccess: reset });
            }}
          >
            Excluir trecho
          </Button>
        )}
      </div>
      {(invalid || save.isError || remove.isError) && (
        <p role="alert" className="text-sm text-destructive">
          {invalid
            ? "Informe código, nós de montante e jusante e as cotas de fundo."
            : (save.error?.message ?? remove.error?.message)}
        </p>
      )}
    </fieldset>
  );
}

export function NetworkTopologyEditor({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const network = useQuery({
    queryKey: projectQueryKeys.network(projectId),
    queryFn: async ({ signal }) =>
      parseClientJson(
        await fetch(`/api/projects/${projectId}/network`, { signal }),
        projectDetailResponseSchema,
        "Não foi possível carregar a rede.",
      ),
    retry: false,
    refetchOnWindowFocus: false,
  });
  return (
    <Card className="rounded-lg border border-border/80 bg-card/40 shadow-none ring-0">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Topologia da rede</CardTitle>
          <CardDescription>
            Adicione, corrija ou exclua nós e trechos sem reimportar o DXF. Um
            nó ligado a trechos não pode ser excluído.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? "Fechar edição" : "Editar topologia"}
        </Button>
      </CardHeader>
      {open && network.data && (
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <NodeForm projectId={projectId} nodes={network.data.nodes} />
          <SegmentForm
            projectId={projectId}
            nodes={network.data.nodes}
            segments={network.data.segments}
          />
        </CardContent>
      )}
      {open && network.isError && (
        <CardContent>
          <p role="alert" className="text-sm text-destructive">
            {network.error.message}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
