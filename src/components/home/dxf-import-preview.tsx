import { FileCheck2, TriangleAlert } from "lucide-react";
import type { DxfPreview } from "@/api/contracts/design";
import { formatDxfWarning } from "./dxf-feedback";

export function DxfImportPreview({ preview }: { preview: DxfPreview }) {
  const warnings = [...new Set(preview.warnings)];

  return (
    <section
      aria-label="Pré-visualização do DXF"
      className="space-y-4 rounded-lg border bg-background p-4 text-sm"
    >
      <div className="flex items-start gap-2.5">
        <FileCheck2
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-primary"
        />
        <div className="min-w-0 space-y-1">
          <h3 className="font-semibold">Resumo do DXF</h3>
          <p className="break-all text-xs text-muted-foreground">
            {preview.fileName}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 rounded-md bg-muted/60 p-3">
        {[
          [
            preview.segmentCount,
            preview.segmentCount === 1 ? "trecho" : "trechos",
          ],
          [preview.nodeCount, preview.nodeCount === 1 ? "nó" : "nós"],
          [
            preview.outletCodes.length,
            preview.outletCodes.length === 1 ? "saída" : "saídas",
          ],
        ].map(([count, label]) => (
          <div key={label} className="flex flex-col-reverse gap-1">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-xl font-semibold tabular-nums">{count}</dd>
          </div>
        ))}
      </dl>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          {preview.outletCodes.length === 1
            ? "Saída da rede"
            : "Saídas da rede"}
        </p>
        {preview.outletCodes.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Saídas da rede">
            {preview.outletCodes.map((code) => (
              <li
                key={code}
                className="max-w-full rounded border bg-muted/40 px-2 py-1 font-mono text-xs break-all"
              >
                {code}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Nenhuma saída identificada.</p>
        )}
      </div>

      {warnings.length > 0 ? (
        <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="flex items-center gap-2 font-medium">
            <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
            Revise antes de importar
          </p>
          <ul className="space-y-3">
            {warnings.map((warning) => {
              const { title, description, affectedNodes } =
                formatDxfWarning(warning);
              return (
                <li key={warning} className="space-y-1.5">
                  <p className="text-xs font-semibold">{title}</p>
                  <p className="text-xs leading-relaxed">{description}</p>
                  {affectedNodes ? (
                    <p className="break-words text-xs leading-relaxed">
                      <span className="font-medium">Nós para conferir: </span>
                      <span className="font-mono break-all">
                        {affectedNodes}
                      </span>
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nenhum aviso na leitura do arquivo.
        </p>
      )}

      <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
        {warnings.length > 0
          ? "Após revisar, confirme a importação."
          : "Confira o resumo e confirme a importação."}{" "}
        Depois, preencha os parâmetros hidráulicos e os dados de campo no
        projeto.
      </p>
    </section>
  );
}
