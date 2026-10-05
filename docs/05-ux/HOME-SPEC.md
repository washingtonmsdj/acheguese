# Territory Home — contrato canônico do MVP

> **Status:** SSOT da Home/shell territorial do MVP.
>
> **Decisão vigente:** 2026-10-05.
>
> **Domínio de produto ativo:** **Empresas (Business)**.
>
> **Capabilities horizontais ativas:** **Mapa + Perto de mim + Busca**, além de Auth/Perfis/Conta/Território/Localização/Central.
>
> **Capabilities horizontais pausadas:** **Mensagens + Notificações**. Seus owners permanecem versionados, mas não criam rota, CTA, Inbox ou preferências no corte atual.

## 1. Papel da Home

A Home não é um módulo de produto adicional.

Ela é uma superfície de plataforma responsável por:

- estabelecer o contexto territorial;
- apresentar somente capacidades efetivamente ativas;
- encaminhar para Empresas, Mapa, Perto de mim e Busca;
- manter estados de loading, erro e ausência de dados coerentes;
- não recriar regras de domínio que pertencem aos módulos.

A Home não pode funcionar como agregador monolítico de módulos ou capabilities pausados.

## 2. Escopo público atual

O domínio de produto ativo é:

| Domínio | ID | Estado |
| --- | --- | --- |
| Empresas | `business` | `active` |

Capabilities horizontais ativas:

| Capability | ID | Estado |
| --- | --- | --- |
| Mapa | `map` | `active` |
| Perto de mim | `nearby` | `active` |
| Busca | `search` | `active` |

Capabilities horizontais pausadas:

| Capability | ID | Estado |
| --- | --- | --- |
| Mensagens | `messaging` | `paused` |
| Notificações | `notifications` | `paused` |

Business é o único provider de domínio público no corte atual. Mapa, Perto de mim e Busca continuam horizontais: elas podem receber providers de outros domínios futuramente, mas não os ativam por conta própria.

## 3. Conteúdo permitido

A Home pode:

- apresentar Empresas do território;
- abrir o Mapa;
- abrir Perto de mim;
- abrir Busca;
- mostrar contexto territorial real;
- renderizar estados vazios honestos quando não houver dados.

A Home não deve consultar, contar, destacar ou anunciar módulos ou capabilities pausados como se estivessem disponíveis.

## 4. Conteúdo proibido enquanto pausado

Não renderizar previews, contadores ou CTAs de Comunidade, Gastronomia, Serviços, Classificados, Turismo, Educação, Vagas, Eventos, Mobilidade, Cupons, Analytics, Gamificação, Mensagens ou Notificações.

Os owners de Mensagens e Notificações permanecem versionados para reativação futura, mas não podem criar navegação, Inbox, preferências ou CTA no corte atual.

## 5. Regras de dados

- A Home deriva visibilidade do lifecycle executável.
- Conteúdo de Business usa os owners canônicos do domínio.
- Mapa, Perto de mim e Busca recebem somente providers autorizados pelos scopes do app.
- Nenhum fetch de módulo pausado pode existir apenas para preencher card, badge, contador ou preview.
- Dados históricos de módulo/capability pausado podem continuar armazenados, mas não tornam a superfície ativa.

## 6. Navegação

A navegação pública deve preservar o contexto territorial quando ele existe.

Entradas gerais continuam válidas quando fazem parte do contrato da capability, mas a Home territorial deve preferir URLs territoriais canônicas.

Não criar redirect, alias, placeholder funcional ou rota paralela para um owner pausado.

## 7. Arquitetura

A Home não possui lógica própria para decidir quais módulos ou capabilities existem. Toda visibilidade deve derivar do registry/launch scope. Adicionar, pausar ou reativar um módulo/capability não pode exigir editar arrays independentes na Home.

Owners executáveis:

- `src/app/config/productModuleRegistry.ts`;
- `src/app/config/platformCapabilityRegistry.ts`;
- `src/app/config/lifecycleRegistry.ts`;
- `src/app/config/launchScope.ts` apenas como projeção/compatibilidade de superfície.

## 8. Regra de preservação pós-MVP

Módulo ou capability fora do MVP **não é removido por estar pausado**. Código, contratos, migrations, dados e testes específicos podem permanecer versionados para evolução posterior. O que fica proibido enquanto `paused` é participar do grafo ativo por rota, provider, prefetch, CTA, navegação, busca, mapa, Inbox ou fallback.
