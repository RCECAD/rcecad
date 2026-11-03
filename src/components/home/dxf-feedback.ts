import { ClientApiError } from "@/api/client/response";
import { apiErrorMessage } from "@/lib/api-feedback";

export type DxfWarning = {
  title: string;
  description: string;
  affectedNodes?: string;
};

// The preview API currently returns English diagnostics instead of warning codes.
export function formatDxfWarning(warning: string): DxfWarning {
  const unidentifiedNodes = warning
    .trim()
    .match(
      /^(\d+) node\(s\) without an identified type were assumed as PV: \[([\s\S]*)\]$/,
    );
  if (unidentifiedNodes) {
    const count = Number(unidentifiedNodes[1]);
    return {
      title:
        count === 1
          ? "Tipo de nó não identificado"
          : "Tipos de nós não identificados",
      description:
        count === 1
          ? "1 nó será importado como poço de visita (PV). Confira se esse tipo está correto no desenho."
          : `${count} nós serão importados como poços de visita (PV). Confira se esses tipos estão corretos no desenho.`,
      affectedNodes: unidentifiedNodes[2].replace(
        / and (\d+) more$/,
        " e mais $1",
      ),
    };
  }

  const independentParts = warning
    .trim()
    .match(
      /^The network has (\d+) independent parts ending at ([\s\S]+)\. Check that every branch is connected; several outlets are only valid when they discharge at different points\.$/,
    );
  if (independentParts) {
    return {
      title: "Rede com saídas independentes",
      description: `A rede tem ${independentParts[1]} partes desconectadas. Confira as ligações entre os trechos; saídas separadas só são válidas quando descarregam em pontos distintos.`,
      affectedNodes: independentParts[2],
    };
  }

  return {
    title: "Aviso na leitura do DXF",
    description:
      "Foi identificada uma condição que precisa de revisão. Confira os nós, as ligações e as saídas no desenho antes de importar.",
  };
}

export function formatDxfImportError(cause: unknown): string {
  const fallback =
    "Não foi possível concluir a importação do DXF. Confira o arquivo e tente novamente.";

  if (!(cause instanceof ClientApiError)) return fallback;

  return apiErrorMessage(
    cause.originalMessage ?? cause.message,
    cause.code,
    cause.status ?? 0,
    fallback,
  );
}
