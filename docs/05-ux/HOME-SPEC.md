# Territory Home — contrato canônico do MVP

> **Status:** SSOT da Home/shell territorial do MVP.
>
> **Decisão vigente:** 2026-10-05.
>
> **Domínio de produto ativo:** **Empresas (Business)**.
>
> **Capabilities horizontais ativas:** **Mapa + Perto de mim + Busca + Mensagens + Notificações**, além de Auth/Perfis/Conta/Território/Localização/Central.

## 1. Papel da Home

A Home não é um módulo de produto adicional. Ela estabelece o contexto territorial e apresenta apenas superfícies realmente ativas.

A Home pode encaminhar para Empresas, Mapa, Perto de mim e Busca. Mensagens e Notificações são capabilities da plataforma e podem aparecer nos pontos de navegação apropriados sem pertencer à Home nem à vertical Empresas.

## 2. Escopo atual

Domínio de produto ativo:

| Domínio | ID | Estado |
| --- | --- | --- |
| Empresas | `business` | `active` |

Capabilities horizontais ativas:

| Capability | ID | Estado |
| --- | --- | --- |
| Mapa | `map` | `active` |
| Perto de mim | `nearby` | `active` |
| Busca | `search` | `active` |
| Mensagens | `messaging` | `active` |
| Notificações | `notifications` | `active` |

Business é hoje o único domínio de produto ativo, mas **não é owner de Mensagens nem de Notificações**. Business pode registrar provider de mensagens e emitir eventos de notificação enquanto estiver ativo. Se Business for pausado, suas contribuições desaparecem, porém Inbox, preferências, infraestrutura e lifecycle das capabilities permanecem ativos para outros providers/eventos autorizados.

## 3. Conteúdo permitido

A Home pode:

- apresentar Empresas do território;
- abrir o Mapa;
- abrir Perto de mim;
- abrir Busca;
- mostrar contexto territorial real;
- renderizar estados vazios honestos quando não houver dados.

Mensagens e Notificações podem existir na navegação global autenticada sem serem tratadas como subseções de Empresas.

## 4. Domínios pausados

Não renderizar previews, contadores ou CTAs que reativem Comunidade, Gastronomia, Serviços, Classificados, Turismo, Educação, Vagas, Eventos, Mobilidade, Cupons, Analytics, Gamificação ou qualquer outro domínio `paused`.

Pausar um domínio remove somente suas rotas/providers/eventos próprios. Não pode desligar Mapa, Nearby, Busca, Mensagens, Notificações ou outra capability horizontal ativa.

## 5. Regras de dados

- A Home deriva visibilidade do lifecycle executável.
- Conteúdo de Business usa os owners canônicos do domínio.
- Capabilities horizontais recebem apenas providers/eventos autorizados pelos scopes do app.
- Nenhum fetch de módulo pausado pode existir apenas para preencher card, badge, contador ou preview.
- Dados históricos de módulo pausado podem continuar armazenados, sem tornar a vertical ativa.

## 6. Navegação

A navegação pública deve preservar o contexto territorial quando ele existe. Mensagens e Notificações usam suas próprias rotas canônicas e não rotas internas de Business.

Não criar redirect, alias, placeholder funcional ou rota paralela para um owner pausado.

## 7. Arquitetura

Toda visibilidade deriva do registry/lifecycle. Owners executáveis:

- `src/app/config/productModuleRegistry.ts`;
- `src/app/config/platformCapabilityRegistry.ts`;
- `src/app/config/lifecycleRegistry.ts`;
- `src/app/config/launchScope.ts` apenas como projeção/compatibilidade de superfície.

## 8. Regra de preservação pós-MVP

Módulo fora do MVP **não é removido por estar pausado**. Código, contratos, migrations, dados e testes específicos podem permanecer versionados para evolução posterior. Enquanto `paused`, ele não participa do grafo ativo por rota, provider, prefetch, CTA, navegação, busca, mapa ou fallback.
