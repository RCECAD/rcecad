# RCECAD

Frontend Next.js do RCECAD.

Este repositorio e frontend-only. O backend oficial do produto e um Spring Boot
externo, responsavel por autenticacao, usuarios, projetos, hidraulica, banco de
dados e migrations.

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
