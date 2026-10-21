import {
  ChartNoAxesCombined,
  CircleCheck,
  Download,
  FileText,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const documents = [
  {
    id: "calculation-report",
    title: "Memorial de Cálculo",
    description: "Documento técnico com todas as memórias de cálculo",
    icon: FileText,
  },
  {
    id: "design-spreadsheets",
    title: "Planilhas de Dimensionamento",
    description: "Tabelas com dados de todos os trechos",
    icon: Table2,
  },
  {
    id: "technical-report",
    title: "Relatório Técnico",
    description: "Documento resumido com principais resultados",
    icon: FileText,
  },
  {
    id: "charts-diagrams",
    title: "Gráfico e Diagramas",
    description: "Perfis longitudinais e diagramas de vazão",
    icon: ChartNoAxesCombined,
  },
];

const formats = [
  { id: "pdf", label: "PDF" },
  { id: "xlsx", label: "XLSX - Microsoft Excel (apenas planilhas)" },
];

export function ExportContent() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6">
      <h1 className="mb-2 text-3xl font-bold text-foreground">Exportação</h1>

      <section
        aria-labelledby="export-status"
        className="flex items-center gap-3 rounded-lg border border-border/80 bg-card/40 p-4"
      >
        <CircleCheck
          aria-hidden="true"
          className="size-6 shrink-0 text-primary"
        />
        <div className="min-w-0">
          <h2 id="export-status" className="text-sm font-medium">
            Exportação indisponível nesta versão
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Consulte a tela de Validação para conferir as pendências atuais. A
            geração dos documentos ainda não está integrada.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="export-documents"
        className="rounded-lg border border-border/80 bg-card/40 p-5"
      >
        <h2 id="export-documents" className="text-base font-semibold">
          Parâmetros Globais do Sistema
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Estes parâmetros afetarão todos os trechos do projeto
        </p>
        <fieldset
          aria-label="Documentos para exportação"
          className="mt-4 space-y-3"
        >
          {documents.map(({ id, title, description, icon: Icon }) => (
            <label
              key={id}
              htmlFor={`export-${id}`}
              className="flex min-h-16 cursor-pointer items-center gap-3 rounded-md border border-border/80 px-3 py-3 transition-colors hover:bg-muted/30"
            >
              <Checkbox
                id={`export-${id}`}
                name="documents"
                value={id}
                defaultChecked
                aria-labelledby={`export-${id}-title`}
                aria-describedby={`export-${id}-description`}
              />
              <Icon
                aria-hidden="true"
                className="size-6 shrink-0 text-blue-500"
              />
              <span className="min-w-0">
                <span
                  id={`export-${id}-title`}
                  className="block text-sm font-medium"
                >
                  {title}
                </span>
                <span
                  id={`export-${id}-description`}
                  className="mt-1 block text-xs leading-5 text-muted-foreground"
                >
                  {description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      </section>

      <section
        aria-labelledby="export-formats"
        className="rounded-lg border border-border/80 bg-card/40 p-5"
      >
        <h2 id="export-formats" className="text-base font-semibold">
          Parâmetros Globais do Sistema
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Estes parâmetros afetarão todos os trechos do projeto
        </p>
        <fieldset
          aria-label="Formatos de exportação"
          className="mt-4 space-y-3"
        >
          {formats.map(({ id, label }) => (
            <label
              key={id}
              htmlFor={`export-format-${id}`}
              className="flex w-fit cursor-pointer items-center gap-2 text-sm leading-5"
            >
              <Checkbox
                id={`export-format-${id}`}
                name="formats"
                value={id}
                defaultChecked
              />
              {label}
            </label>
          ))}
        </fieldset>
      </section>

      <Button
        type="button"
        size="lg"
        disabled
        title="Exportação indisponível nesta versão"
        className="min-h-11 w-full whitespace-normal py-2 disabled:opacity-100"
      >
        <Download aria-hidden="true" className="size-4 shrink-0" />
        Exportar documentos selecionados
      </Button>
    </div>
  );
}
