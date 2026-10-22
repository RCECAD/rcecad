# Integração do CDRE no front-end

O cálculo permanece no módulo Java `cdre-core`. O navegador acessa apenas as rotas
`/api/projects/...` do Next; os serviços em `src/api/server/design.ts` autenticam
as chamadas ao Spring com cookies HttpOnly. Contratos e resultados são validados
com Zod em `src/api/contracts/design.ts` e `spring.ts`.

## Fluxo disponível

1. Na Home, escolha **Importar .DXF**, informe nome e arquivo e use
   **Pré-visualizar DXF**. Confira contagens, saídas e avisos; a prévia não cria projeto.
2. Confirme **Importar projeto**. Os bytes originais seguem por multipart, sem
   conversão de codificação. Prévia e importação aceitam até 300 MB, com leitura
   limitada, arquivo temporário em disco e até dois uploads simultâneos por
   processo Next. O formulário preserva os metadados opcionais da importação.
3. Em **Hidráulica**, informe os parâmetros e o material da rede. Projetos novos
   continuam sem valores de engenharia preenchidos automaticamente.
4. Em **Dimensionamento**, preencha as cotas de terreno dos nós, o tipo dos
   elementos e a resposta de contribuição de tempo seco. Salve cada linha.
5. Em **Pavimentação**, informe a categoria de recobrimento. O material superficial
   importado (por exemplo, asfalto) é um campo diferente dessa categoria.
6. Em **Vazões**, edite as contribuições concentradas iniciais e finais por trecho,
   em L/s. São os campos efetivamente lidos pelo CDRE. O CRUD independente de
   contribuições nomeadas do Spring ainda não alimenta o motor e não é usado aqui.
7. Use **Calcular dimensionamento** em Dimensionamento ou Resultados. A tabela
   mostra Qi/Qf, DN, declividade e velocidade/lâmina nos dois horizontes. Grandezas
   são localizadas por chave, nunca pela posição na resposta.
8. Abra os detalhes para ver grandezas, fontes normativas, conflitos, tentativas
   recusadas e trechos bloqueantes. Uma resposta HTTP 200 pode conter trechos
   inviáveis ou não avaliados.
9. Em **Validação**, use **Validar projeto**. O Spring decide a aptidão para concluir
   e atualiza o status. O status em Dados Gerais é somente leitura.

O salvamento de dados de campo substitui o bloco completo de um trecho. Os
formulários preservam os campos das outras abas e invalidam cálculo/validação
anteriores após uma gravação. A rede permanece editável por linha; não há promessa
de transação única entre várias linhas. Falhas mantêm a linha alterada para tentativa
novamente. Sair com alterações não salvas exige descartá-las explicitamente.

Resultados ficam no cache da sessão do navegador; `/design` não persiste cálculos
no banco. Após recarregar, execute o cálculo novamente. Visão Geral usa pendências
e histórico reais de `/overview`, sem executar o motor. A exportação de documentos
permanece indisponível e não indica mais aprovação fictícia.

## Cenário didático com COLETOR 01.dxf

O arquivo fornecido pelo usuário tem 13 trechos, 14 nós e uma saída. Não é
versionado neste repositório. O projeto local criado para verificação tem o prefixo
`[DIDÁTICO]`; os números abaixo são exclusivamente dados artificiais de teste,
não um levantamento ou projeto executivo da rede do desenho.

| Entrada | Valor de teste |
| --- | --- |
| População inicial / final | 100 / 200 habitantes |
| Consumo per capita | 200 L/hab.dia |
| Coeficiente de retorno | 0,8 |
| K1 / K2 | 1,2 / 1,5 |
| Material | PVC JEI |
| Infiltração e Manning de registro | Em branco; resolução normativa pelo material |
| Cotas de terreno dos 14 nós | 407,509 m em todos, simulando terreno plano |
| Tipo dos 13 trechos | Coletor |
| Recebe contribuição de tempo seco | Não, resposta explícita em todos |
| Categoria de recobrimento | Via pavimentada com meio-fio e sarjeta |
| Contribuições concentradas | Zero em ambos os horizontes |

As cotas e a categoria acima **não foram inferidas do DXF**. O desenho conserva
suas coordenadas, comprimentos e cotas importadas; o CDRE escolhe declividades e
diâmetros e propaga as cotas calculadas. Neste cenário, a vazão mínima normativa
predomina: Qi e Qf de 1,5 L/s, DN 100 e declividade aproximadamente 0,0045457 m/m.
A informação sobre infiltração em PVC é exibida com a justificativa normativa.
Os 13 trechos foram dimensionados. A validação retornou zero erros críticos,
13 alertas sobre a justificativa do Manning e uma informação sobre infiltração.
O backend classificou o cenário como apto a concluir; os alertas continuam visíveis.

## Verificação

Na entrega: 95 testes unitários/integração e 15 testes E2E passaram; lint,
TypeScript e build de produção também passaram. O teste do histórico inclui o
identificador do administrador fornecido pelo backend.

Use Node 22.19 ou superior (Node 24 foi usado nesta integração) para as dependências
atuais de testes. A instalação local antiga de Node 22.14 não suporta o Undici
instalado. Bun continua como gerenciador e executor dos scripts do projeto.

```powershell
bun run test
bun run lint
bunx tsc --noEmit
bun run build
# Alternativa local se o Turbopack falhar por falta de recursos no Windows:
bun run dev -- --webpack
# Com Next e Spring ligados; ajuste a porta quando necessário:
$env:E2E_APP_URL = 'http://localhost:3000'
bun run test:e2e
```

Os testes de expiração/permissão podem usar `E2E_PRIVATE_KEY_PATH` apontando para
a chave RSA do ambiente local. Ela nunca é copiada para o front nem registrada
nos relatórios. Os testes criam projetos com prefixo `Regressão E2E` e os mantêm
para inspeção. Não há exclusão de projetos preexistentes.
