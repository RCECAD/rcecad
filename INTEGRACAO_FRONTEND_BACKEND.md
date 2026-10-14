# Integração frontend–backend

Atualizado em: 12/10/2026.

Projetos analisados: frontend `rcecad` e backend Spring Boot `rcecad-back`.

A integração atual cobre autenticação e criação/configuração dos projetos. O fluxo de engenharia — dimensionar, validar, apresentar resultados e exportar — ainda precisa ser conectado às telas.

Este documento registra a revisão do código atual. Sua criação não inclui uma nova execução dos testes.

## Já integrado

- **Cadastro:** criação real da conta no backend, consulta do CNPJ, tratamento de duplicidade e login automático após o cadastro.
- **Login e sessão:** autenticação real, cookies HttpOnly, renovação do token e proteção das páginas.
- **Projetos:** criação, listagem, abertura e seleção de projetos vinculados ao usuário.
- **Dados gerais:** leitura e atualização de nome, contratante, responsável técnico, localização e status.
- **Importação DXF:** envio do arquivo ao backend, criação do projeto e persistência dos nós e trechos.
- **Parâmetros hidráulicos:** leitura e salvamento de populações, consumo per capita, coeficiente de retorno, infiltração, coeficientes de pico, Manning e material padrão.

Implementação principal: [autenticação](src/api/server/auth.ts) e [serviços de projetos](src/api/server/projects.ts).

## Parcialmente integrado

| Recurso | O que funciona / o que falta |
| --- | --- |
| Home e listagem | Os projetos são reais, mas o frontend carrega apenas os primeiros 100. Busca, paginação e contadores trabalham sobre esse conjunto, não sobre toda a base. |
| Logout | Serviço, rota e ação implementados, mas falta um botão **Sair** conectado na interface. |
| Identificação do usuário | A sessão funciona, mas a Home mostra “Usuário” fixo. Falta carregar e exibir o perfil real. |
| Rede importada | Nós e trechos são persistidos e retornados pelo backend, mas ainda não são apresentados em um editor integrado. |
| Status do projeto | Pode ser alterado manualmente. Não acompanha automaticamente dimensionamento, validação ou exportação. |

## Não integrado ou faltante

| Tela/recurso | Situação atual | O que falta |
| --- | --- | --- |
| **Visão Geral** | Responsável, progresso, datas, alertas e histórico são exemplos fixos. | Usar os dados reais do projeto; definir os dados de progresso e histórico ainda inexistentes. |
| **Vazões** | Tabela demonstrativa; edição, exclusão e salvamento não funcionam. | Conectar às contribuições por trecho disponíveis no backend. O cadastro individual mostrado pela tela exige alinhar o modelo. |
| **Pavimentação** | Dados fictícios; alterações apenas locais e salvamento desabilitado. | Integrar a persistência e alinhar os tipos de pavimento. “Estado da superfície” e “observações” não existem no contrato atual. |
| **Dados de campo** | Backend permite atualizar dados de nós e trechos. | Interface para preencher cota do terreno, tipo de elemento, contribuições e demais campos suportados. |
| **Dimensionamento** | Tela informativa, sem executar cálculos. | Consumir `GET /api/projects/{id}/design`, tratar dados incompletos e apresentar os resultados. |
| **Validação** | Alertas fixos, não calculados para o projeto. | Exibir erros reais e não conformidades retornadas pelo backend. |
| **Resultados** | Tela informativa, sem resultados hidráulicos. | Mostrar os resultados por trecho, justificativas e situações de conflito ou inviabilidade. |
| **Exportação** | Tela sem download funcional. | Conectar o download do DXF original. CSV, XLSX e DXF atualizado pelo dimensionamento ainda precisam de implementação no backend. |

O [controller de projetos](../rcecad-back/rcecad/src/main/java/com/rcecad/presentation/controller/ProjectController.java) já oferece dimensionamento, atualização de dados de campo e download do DXF original; essas capacidades ainda não são consumidas pelas telas correspondentes.

## Outros recursos ainda não implementados

- Recuperação de senha e confirmação de e-mail.
- Consulta/edição do perfil do usuário.
- Exclusão, arquivamento e duplicação de projetos.
- Histórico de revisões e persistência dos resultados de dimensionamento.

## Atenção aos dados demonstrativos

Visão Geral, Vazões, Pavimentação e Validação ainda apresentam dados demonstrativos; não devem ser interpretados como informações reais do projeto.

## Sequência sugerida

1. Integrar dados de campo, vazões e pavimentação.
2. Conectar a execução do dimensionamento.
3. Apresentar resultados e validação reais.
4. Integrar e ampliar as exportações.
