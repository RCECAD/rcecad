@AGENTS.md

# RCECAD — Contexto de Domínio

Sistema de projeto de redes de esgoto sanitário. TCC. Baseado nas normas NBR 9648, 9649, 12207, 9814, 7367.

## Entidades centrais do domínio

- **Projeto**: cadastro com ID, contratante, responsável técnico, revisão, horizonte, parâmetros globais
- **Bacia / Setor**: escopo espacial de contribuição
- **Trecho**: segmento hidráulico entre duas singularidades (PV, TA, TQ); tem Qi, Qf, material, diâmetro, declividade, Manning
- **Nó Hidráulico**: poço de visita (PV), terminal, tubo de acesso (TA), tubo de queda (TQ)
- **Parâmetros**: coeficiente de retorno, consumo per capita, taxa de infiltração, picos de vazão
- **Não-conformidade**: entidade com regra, severidade, justificativa, decisão, histórico

## Cálculos obrigatórios (NBR 9649)

- Qi por trecho: contribuição doméstica acumulada a montante + singular + infiltração
- Qf: Qi × pico de vazão
- Declividade mínima: critério de tensão trativa (τ ≥ 1,0 Pa)
- Propagação de vazões: sempre de montante para jusante (topologia explícita)
- Memória de cálculo: deve ser rastreável até inputs, fórmulas e versão das regras

## Convenções do repo

- Domínio em `src/domain/features/<feature>` — usa `Domain<Input, Output>` e `DomainError`
- Entidades tipadas em `src/domain/entities`
- Schemas Zod em `src/schemas`
- Banco: Drizzle + PostgreSQL, schema em `src/db/schema.ts`
- Rotas: App Router, `page.tsx` (Server), `client.tsx` (Client)
- Auth: Clerk
- Linter/formatter: Biome (obrigatório — roda no pre-commit)
- Gerenciador: Bun
