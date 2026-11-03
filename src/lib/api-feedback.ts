const messages: Record<string, string> = {
  "Project not found":
    "Este projeto não foi encontrado ou não está disponível para sua conta.",
  "Node not found":
    "Este nó não foi encontrado. Atualize a rede para continuar.",
  "Segment not found":
    "Este trecho não foi encontrado. Atualize a rede para continuar.",
  "Contribution not found":
    "Esta contribuição não foi encontrada. Atualize a lista para continuar.",
  "Waiver not found":
    "Esta aprovação não foi encontrada. Atualize a lista para continuar.",
  "Upstream and downstream node must differ.":
    "Selecione nós diferentes para montante e jusante do trecho.",
  "A waiver already exists for this segment and target":
    "Já existe uma aprovação para este trecho e esta regra. Revise as aprovações cadastradas.",
  "Há outros uploads em processamento.":
    "Há outros arquivos em processamento. Aguarde alguns instantes e tente novamente.",
  "Há outros uploads em processamento. Aguarde alguns instantes e tente novamente.":
    "Há outros arquivos em processamento. Aguarde alguns instantes e tente novamente.",
  "O arquivo DXF deve ter até 300 MB.": "O arquivo DXF deve ter até 300 MB.",
};
const codes: Record<string, string> = {
  INCOMPLETE_SURVEY_DATA:
    "Faltam parâmetros hidráulicos ou dados de campo. Consulte a validação para identificar os nós e trechos que precisam de correção.",
  NODE_CODE_TAKEN:
    "Já existe um nó com este código no projeto. Informe um código diferente.",
  SEGMENT_CODE_TAKEN:
    "Já existe um trecho com este código no projeto. Informe um código diferente.",
  INVALID_CONTRIBUTION_TARGET:
    "Selecione um nó ou trecho válido deste projeto para receber a contribuição. O destino deve permitir o escoamento para jusante.",
  INVALID_WAIVER:
    "Confira o trecho, a fonte normativa e os dados da aprovação de exceção.",
  WAIVER_CONFLICT:
    "Já existe uma aprovação para este trecho e esta regra. Revise as aprovações cadastradas.",
  NONCONFORMITY_DECISION_NOT_ALLOWED:
    "Esta ocorrência não permite a decisão selecionada. Corrija os dados ou registre uma aprovação de exceção quando aplicável.",
  DXF_INVALID_FORMAT: "Exporte o desenho no formato DXF de texto (ASCII).",
  DXF_CORRUPTED:
    "O arquivo DXF está incompleto ou corrompido. Confira o desenho e tente novamente.",
  DXF_NO_NETWORK:
    "O DXF não contém uma rede compatível. Confira as camadas e os identificadores dos trechos.",
  UPLOADS_BUSY:
    "Há outros arquivos em processamento. Aguarde alguns instantes e tente novamente.",
  EXPORT_BLOCKED:
    "O projeto tem pendências que impedem a exportação. Acesse a validação para corrigi-las.",
};

// Keep identifiers from known diagnostics, but never show an untranslated server exception.
export function apiErrorMessage(
  message: string | undefined,
  code: string | undefined,
  status: number,
  fallback: string,
): string {
  if (status === 401)
    return "Sua sessão expirou. Entre novamente para continuar.";
  if (status === 403)
    return "Você não tem permissão para realizar esta ação. Volte à lista de projetos para continuar.";
  if (code && codes[code]) return codes[code];
  if (message && messages[message]) return messages[message];
  const patterns: [RegExp, (...matches: string[]) => string][] = [
    [
      /^Cycle detected at node (.+)$/,
      (node) =>
        `A rede contém um ciclo no nó ${node}. Revise as ligações e o sentido dos trechos no desenho.`,
    ],
    [
      /^The network has a cycle: [\s\S]+Segments that could never be reached: \[([\s\S]*)\]\.$/,
      (segments) =>
        `A rede contém um ciclo. Revise as ligações e o sentido dos trechos: ${segments}.`,
    ],
    [
      /^Node (.+) is the upstream end of more than one segment: \[([^\]]+)\]/,
      (node, segments) =>
        `O nó ${node} tem mais de um trecho de saída: ${segments}. Revise as ligações e o sentido do escoamento no desenho.`,
    ],
    [
      /^Segment (.+) has length \S+ m\./,
      (segment) =>
        `O trecho ${segment} tem comprimento inválido. Redesenhe-o com dois pontos distintos.`,
    ],
    [
      /^Node (.+) still has segments \[([^\]]+)\]\./,
      (node, segments) =>
        `O nó ${node} está ligado aos trechos ${segments}. Exclua ou reconecte esses trechos antes de remover o nó.`,
    ],
    [
      /^Node (.+) does not belong to this project\.$/,
      (node) =>
        `O nó ${node} não pertence a este projeto. Selecione um nó da rede atual.`,
    ],
    [
      /^Unknown rule sourceId '([^']+)'/,
      (source) =>
        `A fonte normativa ${source} não foi encontrada. Selecione uma fonte disponível no projeto.`,
    ],
  ];
  for (const [pattern, translate] of patterns) {
    const match = message?.match(pattern);
    if (match) return translate(...match.slice(1));
  }
  if (code === "INVALID_NETWORK_TOPOLOGY")
    return "As ligações da rede são inválidas. Revise as conexões, o sentido e o comprimento dos trechos.";
  if (status === 404)
    return "O item solicitado não foi encontrado ou não está disponível para sua conta.";
  if (status === 413) return "O arquivo DXF deve ter até 300 MB.";
  if (status === 409)
    return "Não foi possível concluir a alteração porque há dados em conflito. Atualize as informações e revise o cadastro.";
  if (status === 429)
    return "Há muitas solicitações em andamento. Aguarde alguns instantes e tente novamente.";
  if (status === 504)
    return "A operação demorou mais que o esperado. Aguarde alguns instantes e tente novamente.";
  if (status >= 500)
    return "O serviço está temporariamente indisponível. Aguarde alguns instantes e tente novamente.";
  return fallback;
}
