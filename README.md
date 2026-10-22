# RCECAD

Frontend Next.js do RCECAD.

Este repositorio e frontend-only. O backend oficial do produto e um Spring Boot
externo, responsavel por autenticacao, usuarios, projetos, hidraulica, banco de
dados e migrations.

## Integração CDRE — 21/10/2026

O fluxo de dimensionamento já consome o CDRE pelo Spring: importação multipart
com pré-visualização, edição dos dados de campo de nós e trechos, pavimentação,
contribuições concentradas por trecho, cálculo, resultados e validação reais.
A Visão Geral consulta pendências e histórico reais; o status passou a ser
controlado pelo backend. Exportação de documentos permanece indisponível.

Veja [INTEGRACAO_CDRE.md](INTEGRACAO_CDRE.md) para o fluxo completo, os limites da
integração e os valores do cenário didático usado com `COLETOR 01.dxf`.
Os resultados não são persistidos: recalcule após recarregar a página.
Para as dependências atuais de teste, use Node >= 22.19; a verificação desta
integração usou Node 24. Os registros de 12/10 abaixo descrevem a etapa anterior.

## Setup

Instale as dependencias:

```bash
bun install
```

Configure o ambiente a partir de `env-example`:

```bash
cp env-example .env.local
```

Inicie o servidor local:

```bash
bun run dev
```

Comandos principais:

```bash
bun run lint
bun run build
bunx tsc --noEmit
```

## Integração local com o Spring

O backend fica em `../rcecad-back` e deve estar disponível em
`http://localhost:8080`. Configure `SPRING_API_BASE_URL` em `.env.local` se usar
outro endereço; a URL pode incluir `/api` ou um prefixo de implantação.
O contrato foi conferido com `/v3/api-docs` e com o backend no commit `419b1fe`.

O modo normal exige login e consulta dados reais. Para trabalhar apenas no
protótipo visual, use explicitamente `DEV_PREVIEW=true` em desenvolvimento.
Esse modo não integra os formulários nem funciona em produção.

Fluxos conectados nesta etapa:

- Login, cadastro, logout e renovação de sessão, com tokens em cookies HttpOnly.
- Consulta de projetos, criação pelo botão **Novo Projeto** e edição de dados gerais.
- Importação de DXF de texto pelo botão **Importar .DXF**, em multipart, com limite
  de 300 MB. O formulário envia `file` e `name`, além de contratante, responsável
  técnico, revisão e bacia opcionais. O arquivo segue como arquivo, sem conversão
  integral para texto ou JSON; o tempo de espera do Spring é de cinco minutos.
  O Next verifica a sessão antes de receber o corpo, limita dois uploads por
  processo e usa armazenamento temporário em disco, removido ao terminar. O
  limite também é aplicado durante a leitura de requisições sem `Content-Length`.
  O arquivo deve seguir o formato reconhecido pelo backend, incluindo a camada
  `SANC_REDE` e os identificadores XDATA `NUMEROTRE`.
- Leitura e gravação dos parâmetros hidráulicos. Projetos novos abrem o formulário
  vazio; nenhum valor de engenharia é inventado pelo frontend.

A infiltração usa **L/s por km**, conforme o contrato atual. Infiltração e Manning
podem ser nulos. O Manning informado serve apenas como registro: o backend resolve
a rugosidade pelo material. O material da rede pode ficar vazio durante o cadastro,
mas deve ser informado antes do dimensionamento.

O cadastro aceita o nome da empresa como opcional; se vazio, o backend usa o
cadastro do CNPJ. A senha exige oito caracteres, uma maiúscula e um símbolo,
com limite de 72 bytes do BCrypt. A validação vale no formulário e na Server Action.

Erros de upload mantêm o arquivo e os campos para nova tentativa. A interface
mostra o limite no 413 e orienta aguardar no `503 UPLOADS_BUSY`, sem repetir o
upload automaticamente. Erros de topologia preservam o código do nó informado
pelo backend.

Ao editar dados gerais, campos opcionais apagados são enviados como texto vazio.
No contrato atual, `null` preserva o valor existente e não limpa o campo.

As páginas apenas leem cookies. Quando o acesso expira, `/auth/refresh` solicita a
renovação por `POST /api/auth/refresh` e retorna ao projeto ou à home. Route Handlers
renovam e repetem a chamada uma única vez. Falhas de conexão não apagam a sessão.
A deduplicação de renovações concorrentes vale dentro de um processo Next;
implantação com múltiplas instâncias requer coordenação da rotação de tokens.
Requisições que começaram juntas compartilham a renovação mesmo quando o 401 de
uma delas chega depois. Os tokens compartilhados são descartados quando todas
essas requisições terminam.

Para conferir localmente, faça login, crie um projeto, salve dados gerais e
hidráulicos e recarregue a página. Depois importe um DXF válido e confira o projeto
na listagem. Os testes automatizados rodam com `bun run test`.

Permanecem pendentes a exportação DXF na interface e a geração de documentos.
O CRUD de contribuições nomeadas do backend ainda não alimenta o motor; a tela de
Vazões edita os campos por trecho efetivamente usados no cálculo. A home
ainda mostra no máximo os primeiros 100 projetos, com filtros locais; a paginação
completa da interface também fica para uma próxima etapa.

## Testes de regressão e API

Verificação de compatibilidade em 20/10/2026: **114 testes frontend e 14 cenários
com Spring real e Chrome aprovados**, incluindo o build de produção local,
DXF acima de 5 MB em viewport móvel, metadados persistidos e limpeza dos campos
opcionais. TypeScript, build e Biome dos arquivos alterados passaram. O lint sem
formatação passou no repositório todo; a verificação completa do Biome ainda
aponta quebras de linha CRLF em 73 arquivos preexistentes. O limite de 300 MB e a
concorrência foram exercitados com testes de fronteira; não houve upload real de
um arquivo de 300 MB nem novo cadastro com consulta externa à ReceitaWS.

```bash
bun run test
bun run lint
bunx tsc --noEmit
bun run build
bun run test:e2e
```

`test:e2e` usa Playwright com Chrome e exige os dois servidores em execução.
Os endereços padrão são `http://localhost:3001` (Next) e
`http://localhost:8080` (Spring). Sobrescreva com `E2E_APP_URL` e `E2E_SPRING_URL`.
A suíte aceita somente servidores locais e cria projetos com prefixo
`Regressão E2E`; os nomes e IDs aparecem na saída. Os registros são mantidos
para inspeção e não há exclusão de dados preexistentes.

O login usa o administrador de desenvolvimento descrito no backend. Para outra
conta, defina `E2E_EMAIL` e `E2E_PASSWORD` no ambiente. A chave RSA local do backend
é usada somente para emitir identidades de teste de permissão/expiração. Seu
diretório padrão é `../rcecad-back`, configurável por `E2E_BACKEND_DIR`; a chave
não é copiada nem registrada nos resultados.

Os testes cobrem a API Spring, as rotas Next e a interface, incluindo expiração
de sessão, autorização, persistência, arquivos DXF inválidos e recuperação de
erros. Resultados ficam em `test-results/results.json`, com screenshots apenas
em falhas. Traces e HARs ficam desativados para não armazenar tokens.

O cadastro tem testes de interface/Server Action com respostas controladas,
testes de rejeição no navegador com o Spring real e testes `SelfRegisterIT` de
API/persistência com ReceitaWS simulada. A consulta externa real tem uma suíte
separada, descrita abaixo, para não consumir a cota do provedor em cada regressão.

No backend, execute separadamente os testes unitários e de integração, pois o
perfil `integration-test` desativa os unitários do módulo Spring:

```bash
sh ./mvnw test
sh ./mvnw verify -Pintegration-test
```

É necessário Java 25 e Docker. Neste ambiente, o Java 25 está em
`/opt/homebrew/opt/openjdk@25/libexec/openjdk.jdk/Contents/Home` e o PostgreSQL
`rcecad-db-local` atende na porta `5434`. Ao subir o Spring manualmente, use
`SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5434/rcecad`,
`DB_USERNAME=postgres` e `SPRING_DOCKER_COMPOSE_ENABLED=false`, com a senha local
no ambiente. A porta 3000 pertence a outro projeto; para o frontend, use
`DEV_PREVIEW=false SPRING_API_BASE_URL=http://localhost:8080 bun run dev --port 3001`.

### Cadastro com ReceitaWS real — 12/10/2026

O formulário aceita CNPJ com ou sem pontuação, consulta a ReceitaWS pelo Spring,
cria a conta com papel `USER` e faz login automaticamente. O CNPJ precisa estar
ativo e tanto ele quanto o e-mail devem ser únicos no banco. Os cookies de sessão
continuam HttpOnly; senha e tokens não são retornados ao componente cliente.

Duplicidades e CNPJ irregular têm mensagens nos campos correspondentes. Erros
temporários mantêm o formulário para nova tentativa. Se a conta já foi criada,
mas o login automático falhar, a tela confirma a criação e oferece o login,
sem pedir um segundo cadastro. Falhas de transporte, respostas ilegíveis ou
incompletas da ReceitaWS não criam contas com dados ausentes.

A [API pública da ReceitaWS](https://developers.receitaws.com.br/) permite
3 consultas por minuto e atende apenas CNPJs disponíveis no cache do provedor.
O cadastro depende dessa disponibilidade; o sistema não ignora a validação de
empresa ativa quando o provedor está indisponível. A consulta cadastral não
comprova o vínculo do usuário com a empresa. Confirmação de e-mail e recuperação
de senha não fazem parte deste fluxo.

Para exercitar a criação real, com os dois servidores locais ligados:

```bash
E2E_REGISTRATION_CNPJ=SEU_CNPJ_ATIVO_DE_14_DIGITOS bun run test:registration
```

Use um CNPJ ainda não cadastrado. A suíte gera e-mail `cadastro-e2e-...@example.invalid`
e senha aleatória, cria uma conta e um projeto locais e os mantém para inspeção.
A senha não é registrada. O CNPJ é enviado ao provedor apenas para consulta;
nenhuma conta é criada na ReceitaWS. Cada nova execução exige outro CNPJ livre.
O relatório das novas execuções fica em `playwright-report/registration.json`,
separado dos artefatos de regressão para não ser apagado pela próxima suíte.

Verificação ponta a ponta concluída no Chrome, sem simular a ReceitaWS:

| Fronteira | Evidência |
| --- | --- |
| Formulário → Next → Spring → ReceitaWS | CNPJ público `06.990.590/0001-23` aceito com pontuação e razão social real retornada |
| Spring → PostgreSQL | Conta ativa, papel `USER` e senha BCrypt confirmados no banco |
| Resposta → navegador | Login automático e cookies HttpOnly; lista inicial de projetos vazia |
| Uso da conta | Criação de projeto, logout, novo login com a senha cadastrada e leitura do projeto persistido |

Fixtures exclusivamente locais, sem representar vínculo com a empresa consultada:

- Conta: `cadastro-e2e-1791830575399@example.invalid`, ID `a742b266-7358-475f-b011-1b58256a4244`.
- Projeto: `Cadastro E2E 1791830577013`, ID `534412ea-5066-4609-ac34-b23d10cee122`.
- A regressão final manteve mais 7 projetos com prefixo `Regressão E2E 1791830617927`;
  seus nomes e IDs estão em `test-results/results.json`.

Resultado final desta etapa: **82 testes frontend, 299 unitários backend
(190 motor + 109 Spring), 62 integrações backend, 14 cenários API/navegador e
1 cenário de cadastro com ReceitaWS real aprovados**. Biome, TypeScript,
Checkstyle e build de produção também passaram. O backend foi reiniciado com
o adaptador corrigido, mantendo as mesmas portas e o banco local.

### Validação inicial da integração — 12/10/2026

Registro da etapa anterior ao fechamento do cadastro real descrito acima.

Validação executada com Next em `http://localhost:3001`, Spring em
`http://localhost:8080` e PostgreSQL local em `5434`.

| Verificação | Resultado |
| --- | --- |
| Frontend: Vitest | 64 testes aprovados em 15 arquivos |
| Backend: unitários | 283 aprovados (190 no motor + 93 no Spring) |
| Backend: integração | 59 aprovados |
| Playwright: API real e navegador Chrome | 11 cenários aprovados (6 API + 5 interface), sem falhas ou skips |
| Biome, TypeScript, build de produção e `git diff --check` | Aprovados |
| Recuperação com o processo Spring realmente desligado | 503 com sessão preservada; após reiniciar, o botão de tentar novamente renovou a sessão e abriu a home |

As verificações incluem login/logout, rotação e revogação de refresh token,
cookies HttpOnly, ausência de tokens no HTML/storage, expiração de sessão,
redirecionamento seguro, 401/403/404, isolamento de projetos, filtros/paginação
da API, criação e edição persistidas após recarregar, hidráulica inicialmente
vazia, valores opcionais e importação DXF válida/inválida sem registros parciais.
Permissões e outro proprietário foram exercitados com identidades JWT locais
de teste; não foi criada uma segunda conta real.

Regressões corrigidas e cobertas por testes:

- JSON malformado nas atualizações de dados gerais/hidráulicos retorna 400,
  em vez de uma exceção 500.
- O limite de DXF considera bytes UTF-8, incluindo caracteres multibyte.
- Interrupção durante a leitura da resposta Spring retorna 503 e preserva cookies.
- Requisições concorrentes compartilham a rotação mesmo se um 401 chegar
  depois da primeira renovação concluída.

Cada execução atualiza `test-results/results.json` (artefato local ignorado
pelo Git). Os relatórios Maven ficam nos diretórios
`target/surefire-reports` e `target/failsafe-reports` dos módulos do backend.
Nesta etapa inicial não houve alteração de código no backend nem exclusão de
dados preexistentes. A ReceitaWS real ainda não havia sido testada; essa lacuna
foi fechada na etapa de cadastro acima. Implantação com múltiplas instâncias e
os módulos ainda não integrados continuam fora da validação ponta a ponta.

Naquela etapa foram mantidos 14 projetos identificáveis. Os nomes seguem
`Regressão E2E <execução> <projeto>`:

| Execução | Projeto | ID |
| --- | --- | --- |
| 1791829132418 | API editado | `647484a5-ff90-48d3-a7c9-a7c6cb26194a` |
| 1791829132418 | Hidráulica | `25999c32-ae23-49ab-86ad-273776597f9b` |
| 1791829132418 | DXF API | `2b00ebca-3d12-4252-bbcd-3c5635ad97dd` |
| 1791829132418 | Sessão | `7673cbae-be3d-4a4e-b1ab-d25ad2fec10a` |
| 1791829238356 | Interface | `cabe981c-c7df-49c8-a38e-6bbd40254717` |
| 1791829238356 | DXF interface | `ae10e854-531f-4ffb-afe2-055dd8ecb802` |
| 1791829238356 | Erro de rede | `34b60986-f32c-4f2b-8716-7eb39bfc5c52` |
| 1791829540270 | API editado | `07b98c25-2e84-4ffc-86df-e50f0d214f01` |
| 1791829540270 | Hidráulica | `4cfc2edb-db11-4aa6-8fa4-2860dc377772` |
| 1791829540270 | DXF API | `c8a7d376-08b7-4785-906e-18148b3cde15` |
| 1791829540270 | Sessão | `1f84363a-b727-4b00-a4d5-584d97223246` |
| 1791829540270 | Interface | `e5abce37-cb2a-403d-8bd7-acefba0def14` |
| 1791829540270 | DXF interface | `fbd914cc-4c33-49e3-8d61-2876d6122d8b` |
| 1791829540270 | Erro de rede | `cfe1b228-be23-4fb6-b8af-ef7e7c5d07f4` |

## Stack

- Next.js App Router
- React
- TypeScript
- Zod
- React Hook Form
- TanStack Query
- shadcn/ui
- Biome

## Regras Atuais

- O Next nao acessa banco diretamente.
- Nao adicionar ORM, migrations ou backend Node neste repo.
- Toda chamada autenticada ao Spring deve passar por codigo server-side do Next.
- Client Components devem chamar Route Handlers em `/api/...` quando precisarem de dados interativos.
- Login, cadastro, logout e formularios devem usar Server Actions quando fizer sentido para o fluxo.
- Tokens nunca devem aparecer em Client Components, props serializadas, `localStorage` ou `sessionStorage`.
- O contrato OpenAPI do Spring e a fonte de verdade dos DTOs do frontend.

## Next.js

Este projeto usa uma versao de Next.js com mudancas de APIs, convencoes e
estrutura de arquivos.

Antes de alterar rotas, Route Handlers, Server Actions, Server Components,
Client Components ou cookies, leia o guia relevante em:

```txt
node_modules/next/dist/docs/
```

Pontos ja relevantes para este repo:

- `params` e `searchParams` sao promises nas versoes atuais do App Router.
- `cookies()` e assincrono.
- Route Handlers ficam em arquivos `route.ts` dentro de `src/app`.
- Um segmento nao pode ter `page.tsx` e `route.ts` no mesmo nivel.

## Biome

O Biome e obrigatorio neste repo.

O hook de pre-commit roda `bun biome check --write` nos arquivos staged com
extensoes `js`, `ts`, `tsx`, `jsx` e `json`, e adiciona as correcoes ao commit
automaticamente.

Uso manual:

```bash
bun biome check --write src/app/page.tsx
```

## Fluxo de Trabalho

Para cada task:

1. Atualize a `main`.
2. Crie uma branch nova a partir da `main`.
3. Faca as alteracoes da task.
4. Rode checks locais relevantes.
5. Abra PR.

Exemplo:

```bash
git checkout main
git pull
git checkout -b feat/nome-da-task
```

## Commits

Este repo usa Conventional Commits no hook `commit-msg`.

Formatos aceitos:

```txt
feat: adiciona rota de exemplo
fix(auth): corrige redirecionamento
docs: atualiza readme
refactor(api): reorganiza cliente spring
```

Tipos aceitos:

```txt
feat, fix, chore, delete, refactor, refac, docs, test, build, ci, perf, style, revert
```

## PR

Template recomendado:

```md
## Resumo

Descreva em poucas linhas o objetivo do PR.

## Alteracoes

- Liste as principais alteracoes feitas.
- Cite arquivos ou fluxos relevantes quando ajudar a revisar.

## Notas

Inclua apenas se houver algo importante: tradeoffs, pendencias, migracoes,
variaveis de ambiente ou pontos de atencao.
```
