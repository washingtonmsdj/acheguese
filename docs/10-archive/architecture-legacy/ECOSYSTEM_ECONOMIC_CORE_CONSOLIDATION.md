# Consolidacao Tecnica do Core Economico Territorial

## Objetivo desta fase

Esta fase consolida a arquitetura existente sem expandir escopo funcional.
Foco: estabilidade, legibilidade, manutencao e previsibilidade arquitetural.

## Definicoes oficiais do produto (semantica consolidada)

- Feed: centro de descoberta e circulacao social/economica territorial.
- Oportunidades: camada transversal do feed para circulacao economica rapida.
- Vagas: modulo de recrutamento estruturado (persistente e formal).
- Servicos: descoberta/marketplace de oferta profissional persistente.
- Perfis profissionais: identidade economica reutilizavel em varios fluxos.

## Entidades principais e responsabilidades

- `work_opportunities`
  - Oportunidades rapidas: freela, diaria, disponibilidade, procura/oferta de trabalho.
  - Base para distribuicao em feed, matching leve e lifecycle curto.
- `vagas`
  - Vagas estruturadas com dados de contratacao formal.
  - Mantem ownership do dominio de recrutamento estruturado.
- `professional_data`
  - Identidade profissional reutilizavel por oportunidades, vagas, servicos e busca.
- `posts`
  - Camada de distribuicao no feed para oportunidades e vagas resumidas.
- `analytics_events`
  - Telemetria de circulacao e conversao entre descoberta e contato.

## Fluxo consolidado de circulacao economica

1. Publicacao
- Oportunidade rapida cria `work_opportunities` e distribui card no feed.
- Vaga estruturada cria `vagas`, publica card-resumo no feed e dispara matching.

2. Descoberta
- Feed distribui cards por contexto territorial e canal.
- Busca global retorna resultados unificados de vagas + oportunidades + profissionais + servicos.

3. Conversao
- Usuario abre detalhe (`/oportunidades/:id` ou `/vagas/detalhe/:id`).
- CTA de contato/interesse (whatsapp, telefone, canais diretos).

4. Retorno de qualidade
- Telemetria registra clique, abertura, contato e sinais de retorno.
- Lifecycle e ranking leve priorizam relevancia e atualidade territorial.

## Matching territorial consolidado

- Matching usa a mesma base sem sistemas paralelos:
  - categoria profissional
  - territorio (`location_id`)
  - disponibilidade/aceite de atendimento
  - visibilidade profissional
- `work_opportunities` e `vagas` reaproveitam infraestrutura comum de notificacao.

## Lifecycle e ranking leve

- Lifecycle:
  - expiracao automatica por tipo de oportunidade
  - reducao de relevancia com o tempo
  - estado resolvida/concluida quando aplicavel
- Ranking leve:
  - proximidade territorial
  - disponibilidade
  - sinais de reputacao contextual
  - recencia/atividade

## Fronteiras de dominio (baixo acoplamento)

- `core/work-opportunities`
  - dominio transversal economico (oportunidades, matching, lifecycle, telemetria).
- `modules/classifieds/jobs`
  - dominio de vagas estruturadas (publicacao, detalhe, filtros estruturados).
- `core/community` e `core/feed`
  - distribuicao de cards e descoberta territorial.
- `core/search`
  - agregacao de resultados unificados e roteamento de destino.
- `core/professional`
  - identidade profissional reutilizavel.
- `core/analytics`
  - eventos e leitura de funil de circulacao.

## Padroes de nomenclatura e convencoes

- Entidades
  - usar nomes explicitos: `work_opportunity`, `structured_vaga`, `professional_profile`.
- Eventos
  - padrao: `<dominio>_<acao>_<origem>` quando necessario.
  - exemplos:
    - `work_opportunity_click_feed`
    - `structured_vaga_open_search`
- Payloads
  - sempre incluir ids de correlacao:
    - `opportunity_id` ou `vaga_id`
    - `territory_location_id` quando aplicavel
    - `source` (`feed`, `search`, `profile`, `listing`)

## Guardrails desta fase de consolidacao

- Nao criar novos modulos.
- Nao duplicar matching/notificacao por dominio.
- Nao criar nova entidade economica paralela.
- Nao alterar comportamento funcional sem necessidade.

## Checklist de manutencao continua

- Remover arquivos V1 sem referencias ativas.
- Evitar barrels com reexport amplo sem necessidade.
- Padronizar imports por dominio.
- Preservar contratos de payload entre feed, busca e detalhe.
- Validar build apos cada limpeza estrutural.
