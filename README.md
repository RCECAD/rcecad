# RCECAD

Projeto Next.js com App Router, TypeScript, Drizzle, Zod, React Hook Form,
shadcn/ui, Clerk e Biome.


Por favor, aprendam a usar o git corretamente:

https://www.youtube.com/watch?v=Zwv9qRyVeU4


conventional commits:
https://www.conventionalcommits.org/pt-br/v1.0.0/

## Setup

Instale as dependencias:

```bash
bun install
```

Inicie o servidor local:

```bash
bun run dev
```

Comandos principais:

```bash
bun run lint
bun run format
bun run build
bunx tsc --noEmit
```

## Biome obrigatorio

O Biome e obrigatorio neste repo.

Todo dev deve instalar:

- CLI do projeto: `@biomejs/biome`, ja listado em `devDependencies`.
- Extensao oficial do VS Code: https://biomejs.dev/reference/vscode/

O hook de pre-commit roda `bun biome check --write` somente nos arquivos
staged com extensoes `js`, `ts`, `tsx`, `jsx` e `json`, e adiciona as correcoes
ao commit automaticamente.

Docs:

- CLI: https://biomejs.dev/reference/cli/
- VS Code: https://biomejs.dev/reference/vscode/

Exemplo:

```bash
bun biome check --write src/app/example/page.tsx
```

## Padrao do repo

### Rotas e componentes

As rotas ficam em `src/app`, usando App Router.

Cada rota deve manter:

- `page.tsx`: Server Component por padrao, responsavel por montar a pagina.
- `client.tsx`: Client Component quando precisar de estado, eventos, hooks ou
  APIs do browser.
- `loading.tsx`: fallback do segmento.
- `error.tsx`: error boundary do segmento, sempre com `"use client"`.

Exemplo aplicado:

```txt
src/app/example/page.tsx
src/app/example/client.tsx
src/app/example/loading.tsx
src/app/example/error.tsx
src/app/example/create/page.tsx
src/app/example/create/client.tsx
src/app/example/[id]/page.tsx
src/app/example/[id]/client.tsx
```

Componentes compartilhados por uma pagina ficam em pasta correspondente dentro
de `src/components`.

Exemplo:

```txt
src/app/roads/page.tsx
src/components/roads/component.tsx
```

Componentes de UI gerados pelo shadcn ficam em:

```txt
src/components/ui
```

### Dominio

Regras de dominio ficam em `src/domain`.

Entidades:

```txt
src/domain/entities
```

Features/casos de uso:

```txt
src/domain/features/<feature-name>
```

Features devem usar o type `Domain` e a funcao `DomainError` de
`src/domain/index.ts`.

Exemplo:

```ts
"use server";

import { type Domain, DomainError } from "@/domain";
import type { Example } from "@/domain/entities";

type Input = {
  name: Example["name"];
};

type Output = Example;

type Setup = Domain<Input, Output>;

export const createExample: Setup = async (input) => {
  try {
    return {
      id: crypto.randomUUID(),
      name: input.name,
    };
  } catch (err) {
    return DomainError({
      msg: "An error occurred while trying to create a new example",
      err,
    });
  }
};
```

### Schemas de validacao

Schemas Zod ficam em:

```txt
src/schemas
```

Use schemas para validar entradas de formularios, payloads e dados externos
antes de chamar features de dominio ou persistir no banco.

### Banco

Schema Drizzle fica em:

```txt
src/db/schema.ts
```

Migrations ficam em:

```txt
drizzle
```

O repo usa abordagem codebase-first: o schema TypeScript eh a fonte de verdade,
e o Drizzle gera SQL a partir dele.

## Fluxo de trabalho com Trello, branches e PRs

Para cada task do Trello:

1. Atualize a `main` (git pull).
2. Crie uma branch nova a partir da `main` (git checkout -b "task-number/nome-da-branch").
3. Faca as alteracoes/adicoes da task.
4. Crie um PR.
5. Mova a task do Trello para `waiting to approval`.
6. Marque alguem para revisar o PR.

Exemplo de branch:

```bash
git checkout main
git pull
git checkout -b feat/nome-da-task
```

Template obrigatorio de PR:

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

## Commits

Este repo usa Conventional Commits no hook `commit-msg`.

Formatos aceitos:

```txt
feat: adiciona rota de exemplo
fix(auth): corrige redirecionamento
docs: atualiza readme
refactor(domain): simplifica createExample
```

Tipos aceitos:

```txt
feat, fix, chore, delete, refactor, refac, docs, test, build, ci, perf, style, revert
```

## Next.js

Docs:

- App Router: https://nextjs.org/docs/app
- File conventions: https://nextjs.org/docs/app/api-reference/file-conventions
- `page.tsx`: https://nextjs.org/docs/app/api-reference/file-conventions/page

Importante: esta versao do Next tem mudancas em APIs e convencoes. Antes de
alterar rotas, leia a documentacao

Exemplo de rota dinamica neste padrao:

```tsx
export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return <div>{id}</div>;
}
```

`params` e `searchParams` sao promises nas versoes atuais do App Router.

## TypeScript

Docs:

- Handbook: https://www.typescriptlang.org/docs/handbook/intro.html
- Everyday Types:
  https://www.typescriptlang.org/docs/handbook/2/everyday-types.html

Preferencias do repo:

- Use `type` para modelar shapes locais.
- Use `import type` quando o import for usado apenas como tipo.
- Evite `any`.
- Prefira inferencia de tipo quando ela deixar o codigo claro.
- Reaproveite tipos das entidades e schemas.

Exemplo:

```ts
type CreateExampleInput = {
  name: string;
  description?: string;
};

type CreateExampleOutput = {
  id: string;
  name: string;
};
```

## Zod

Docs:

- Documentacao: https://zod.dev/
- Packages: https://zod.dev/packages/zod

Use Zod para validar dados em runtime e inferir tipos TypeScript a partir do
schema.

Exemplo:

```ts
import { z } from "zod";

export const exampleSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(255).optional(),
});

export type ExampleFormValues = z.infer<typeof exampleSchema>;

const payload = exampleSchema.parse({
  name: "Exemplo",
});
```

## React Hook Form

Docs:

- Documentacao: https://react-hook-form.com/
- `useForm`: https://react-hook-form.com/docs/useform
- `register`: https://react-hook-form.com/docs/useform/register
- `handleSubmit`: https://react-hook-form.com/docs/useform/handlesubmit

Use React Hook Form em componentes client para formularios.

Exemplo:

```tsx
"use client";

import { useForm } from "react-hook-form";
import type { ExampleFormValues } from "@/schemas/example";

export function ExampleForm() {
  const form = useForm<ExampleFormValues>({
    resolver: zodResolver(exampleSchema)
    defaultValues: {
      name: "",
      description: "",
    },
  });

  function onSubmit(values: ExampleFormValues) {
    console.log(values);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("name")} />
      <textarea {...form.register("description")} />
      <button type="submit">Salvar</button>
    </form>
  );
}
```

## Drizzle

Docs:

- ORM: https://orm.drizzle.team/docs/overview
- Migrations: https://orm.drizzle.team/docs/migrations
- `drizzle-kit generate`: https://orm.drizzle.team/docs/drizzle-kit-generate

Config:

```txt
drizzle.config.ts
```

Schema:

```txt
src/db/schema.ts
```

Gerar migration:

```bash
bunx drizzle-kit generate
```

Exemplo de tabela:

```ts
import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const examples = pgTable("examples", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Example = typeof examples.$inferSelect;
export type NewExample = typeof examples.$inferInsert;
```

## shadcn/ui

Docs:

- Documentacao: https://ui.shadcn.com/docs
- Button: https://ui.shadcn.com/docs/components/radix/button

Config:

```txt
components.json
```

Componentes gerados ficam em:

```txt
src/components/ui
```

Adicionar componente:

```bash
bunx shadcn@latest add button
```

Uso:

```tsx
import { Button } from "@/components/ui/button";

export function SaveButton() {
  return <Button type="submit">Salvar</Button>;
}
```

## Clerk

Docs:

- Next.js Quickstart:
  https://clerk.com/docs/nextjs/getting-started/quickstart
- Next.js SDK: https://clerk.com/docs/references/nextjs/overview

Variaveis esperadas:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
```

Exemplo de provider no layout:

```tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

Exemplo de uso em pagina/componente:

```tsx
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function AuthActions() {
  return (
    <>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </>
  );
}
```
