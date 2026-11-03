import type { ProjectAction, ValidationItem } from "@/api/contracts/design";

export const designStatusLabels: Record<string, string> = {
  designed: "Dimensionado",
  verified: "Verificado (DN imposto)",
  conflicted: "Conflito de regras",
  infeasible: "Inviável",
  notEvaluated: "Bloqueado a montante",
};

export const ruleDescriptions: Record<string, string> = {
  MISSING_INPUT:
    "Falta um dado obrigatório ou uma grandeza necessária ao dimensionamento.",
  MANNING_N_INCONSISTENT_WITH_MATERIAL:
    "A rugosidade de Manning é incompatível com o material da tubulação.",
  MANNING_N_OUT_OF_VALID_RANGE:
    "A relação entre lâmina e diâmetro está fora da faixa de validade da rugosidade de Manning.",
  TRACTIVE_TENSION_BELOW_MINIMUM:
    "A tensão trativa está abaixo do mínimo exigido.",
  DRY_WEATHER_TRACTIVE_TENSION_BELOW_MINIMUM:
    "A tensão trativa em tempo seco está abaixo do mínimo exigido.",
  VELOCITY_ABOVE_MAXIMUM: "A velocidade excede o limite máximo.",
  DEPTH_RATIO_ABOVE_MAXIMUM:
    "A relação entre lâmina e diâmetro excede o limite máximo.",
  MANNING_N_NOT_JUSTIFIED:
    "O coeficiente de Manning adotado exige justificativa.",
  MATERIAL_CHANGE_REQUIRES_PV:
    "A mudança de material exige um poço de visita (PV) no nó compartilhado, conforme a NBR 9649, item 5.2.1.",
  DISCHARGE_EXCEEDS_CONVEYANCE:
    "A vazão de projeto excede a capacidade do diâmetro e da declividade adotados.",
  COVER_BELOW_MINIMUM:
    "O recobrimento está abaixo do mínimo exigido para a categoria de pavimentação.",
  DOMAIN_VALUE_MISMATCH:
    "O parâmetro adotado está fora dos limites permitidos pelas normas aplicadas.",
};

type Guidance = {
  title: string;
  description: string;
  action: string;
  route: string;
};
const requiredGuidance: Record<string, Guidance> = {
  "Missing design parameters": {
    title: "Parâmetros hidráulicos não informados",
    description:
      "O projeto ainda não tem os parâmetros necessários ao dimensionamento.",
    action:
      "Informe população, consumo per capita, coeficiente de retorno, fatores de pico e infiltração.",
    route: "hydraulics",
  },
  "Missing pipe material": {
    title: "Material da rede não informado",
    description: "O material da tubulação ainda não foi definido.",
    action: "Selecione o material padrão da rede nos dados hidráulicos.",
    route: "hydraulics",
  },
  "Missing infiltration rate": {
    title: "Taxa de infiltração não informada",
    description:
      "A rede não foi identificada como inteiramente em PVC; a NBR 7367 não fornece automaticamente a taxa de infiltração neste caso.",
    action: "Informe a taxa de infiltração em L/s por quilômetro.",
    route: "hydraulics",
  },
  "Missing ground elevation": {
    title: "Cota de terreno não informada",
    description: "Falta a cota de terreno do nó indicado.",
    action:
      "Informe e salve a cota de terreno obtida no levantamento, em metros.",
    route: "sizing",
  },
  "Missing dry-weather discharge answer": {
    title: "Contribuição de tempo seco não informada",
    description:
      "O trecho ainda não informa se recebe contribuição de tempo seco.",
    action:
      "Responda se o trecho recebe contribuição de tempo seco e salve a linha.",
    route: "sizing",
  },
  "Missing network segments": {
    title: "Rede do projeto não cadastrada",
    description: "Este projeto ainda não possui trechos.",
    action:
      "Cadastre os nós e trechos na topologia da rede. Para criar outro projeto a partir de um DXF, use a importação na página inicial.",
    route: "sizing#network-topology",
  },
  "Unknown segment endpoint": {
    title: "Ligação do trecho inválida",
    description: "O trecho está ligado a um nó que não existe neste projeto.",
    action: "Edite a topologia e conecte o trecho a um nó existente na rede.",
    route: "sizing#network-topology",
  },
  "Network length divergence": {
    title: "Comprimento da rede divergente",
    description:
      "O comprimento informado nos dados gerais difere da soma dos comprimentos dos trechos.",
    action:
      "Confira o comprimento total nos dados gerais e os comprimentos dos trechos no desenho.",
    route: "general-data",
  },
};

export function validationGuidance(item: ValidationItem): Guidance {
  const known = requiredGuidance[item.title];
  if (known) {
    const lengths = item.message.match(
      /^Informed network length is ([\d.]+) m; segment lengths sum to ([\d.]+) m \(difference: ([\d.]+)%\)\.$/,
    );
    return lengths
      ? {
          ...known,
          description: `Comprimento informado: ${lengths[1].replace(".", ",")} m. Soma dos trechos: ${lengths[2].replace(".", ",")} m. Diferença: ${lengths[3].replace(".", ",")}% em relação ao valor informado.`,
        }
      : known;
  }
  const rule = item.title.match(/^Design finding: (.+)$/)?.[1];
  if (rule) {
    const route = [
      "MANNING_N_NOT_JUSTIFIED",
      "MANNING_N_INCONSISTENT_WITH_MATERIAL",
      "DOMAIN_VALUE_MISMATCH",
    ].includes(rule)
      ? "hydraulics"
      : rule === "COVER_BELOW_MINIMUM"
        ? "paving"
        : "sizing";
    return {
      title:
        ruleDescriptions[rule]?.replace(/\.$/, "") ??
        "Ocorrência no dimensionamento",
      description:
        "O cálculo identificou uma condição que precisa ser revista.",
      action:
        route === "hydraulics"
          ? "Confira os parâmetros hidráulicos e suas justificativas. Depois, execute a validação novamente."
          : route === "paving"
            ? "Confira a categoria de recobrimento do trecho e as cotas da rede."
            : "Revise os dados do trecho. Depois, execute a validação novamente.",
      route,
    };
  }
  if (item.title.startsWith("Parameter conflict:")) {
    return {
      title: "Conflito entre parâmetros normativos",
      description: "As regras aplicadas não têm valores admissíveis em comum.",
      action:
        "Revise os parâmetros hidráulicos e as normas aplicáveis ao projeto.",
      route: "hydraulics",
    };
  }
  if (item.title.startsWith("No feasible design for "))
    return {
      title: "Trecho sem solução viável",
      description:
        "Nenhum diâmetro da série disponível atende às condições deste trecho.",
      action:
        "Revise o traçado, as cotas e os dados de campo do trecho indicado.",
      route: "sizing",
    };
  if (/^Segment .+ was not evaluated$/.test(item.title)) {
    const blockedBy = item.message.match(/blocked by segments: (.+)\.$/)?.[1];
    const dependencies = blockedBy
      ?.split(",")
      .map((code) => code.trim())
      .filter((code) => code && code !== item.target.code);
    return {
      title: "Trecho não avaliado",
      description: dependencies?.length
        ? `O cálculo depende da correção dos trechos: ${dependencies.join(", ")}.`
        : "O cálculo deste trecho depende da resolução de pendências na rede.",
      action:
        "Corrija os trechos que impedem o cálculo e execute a validação novamente.",
      route: "sizing",
    };
  }
  return {
    title: "Pendência no projeto",
    description:
      "A validação identificou uma condição que precisa de revisão na etapa indicada.",
    action: "Revise os dados do item indicado e execute a validação novamente.",
    route:
      item.step === "HYDRAULICS"
        ? "hydraulics"
        : item.step === "CONTRIBUTIONS"
          ? "flows"
          : "sizing",
  };
}

export function correctionPath(
  projectId: string,
  item: ValidationItem,
): string {
  const { route } = validationGuidance(item);
  const anchor =
    !route.includes("#") &&
    ["sizing", "paving"].includes(route) &&
    item.target.id &&
    item.target.type !== "PROJECT"
      ? `#${item.target.type.toLowerCase()}-${item.target.id}`
      : "";
  return `/project/${projectId}/${route}${anchor}`;
}

const fields: Record<string, string> = {
  contractor: "contratante",
  technicalManager: "responsável técnico",
  location: "localidade",
  revision: "revisão",
  horizon: "horizonte de projeto",
};
export function progressDescription(step: {
  step: string;
  state: string;
  detail: string;
}): string {
  if (step.state === "DONE") return "Etapa concluída";
  if (step.step === "GENERAL_DATA" && step.detail.startsWith("Missing: "))
    return `Preencha: ${step.detail
      .slice(9)
      .split(", ")
      .map((field) => fields[field] ?? "dados complementares")
      .join(", ")}.`;
  if (step.step === "DXF_IMPORT") return "Cadastre a rede para continuar.";
  if (step.step === "HYDRAULICS")
    return "Complete os parâmetros hidráulicos indicados nas pendências.";
  if (step.step === "EXPORT") return "Nenhum documento exportado.";
  return "Revise os dados desta etapa.";
}

const statuses: Record<string, string> = {
  PENDING: "Com pendências",
  IN_PROGRESS: "Em andamento",
  VALIDATED: "Validado",
  EXPORTED: "Exportado",
  OPEN: "Aberta",
  ACKNOWLEDGED: "Reconhecida",
  ACCEPTED: "Aceita",
  RESOLVED: "Resolvida",
  WAIVED: "Aprovada como exceção",
};
export function actionDetail(action: ProjectAction): string | null {
  const detail = action.detail;
  if (!detail) return null;
  if (action.type === "NONCONFORMITY_DECIDED") {
    const [rule, status] = detail.split(" -> ");
    return `${ruleDescriptions[rule]?.replace(/\.$/, "") ?? "Ocorrência de dimensionamento"} → ${statuses[status] ?? "Situação atualizada"}`;
  }
  if (action.type === "VALIDATED")
    return detail
      .split(" -> ")
      .map((value) => statuses[value] ?? "Situação atualizada")
      .join(" → ");
  const changes: Record<string, string> = {
    Created: "Cadastro realizado",
    Updated: "Dados atualizados",
    Deleted: "Registro excluído",
  };
  if (changes[detail]) return changes[detail];
  // Names, file names, revision identifiers and user-entered notes are preserved.
  return detail;
}
