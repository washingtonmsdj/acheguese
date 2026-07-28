# TERRITORY-DATA-QUALITY.md

> AVISO DE SUBSTITUICAO DOCUMENTAL
>
> Status: SUBSTITUIDO.
> Documento canonico atual: `docs/domain/TERRITORY-DATA-QUALITY-V2.md`.
> Este arquivo fica preservado apenas como historico e nao deve ser usado como fonte normativa.

**Status:** plano oficial proposto
**Escopo:** domínio Territory
**Tipo:** modelo de qualidade de dados, sem implementação
**Base:** `docs/domain/TERRITORY-GOVERNANCE.md` e `docs/domain/SALVADOR.READINESS.2.md`

## 1. Objetivo

Transformar o domínio Territory em um sistema auditável por qualidade de dados territoriais.

Este documento define o modelo oficial de `Territory Quality Score`, um score numérico de 0 a 100 usado para medir se um Territory possui qualidade suficiente para cadastro, navegação, Territory Home, ativação pública e lançamento oficial.

Este plano não altera arquitetura, banco, código, contratos, nomenclatura ou responsabilidades de domínio. Ele apenas define como a qualidade deverá ser medida e usada em auditorias futuras.

## 2. Princípios

1. O score mede qualidade operacional do Territory, não popularidade.
2. Um Territory pode ser estruturalmente válido e ainda não estar pronto para lançamento.
3. Conteúdo escasso não deve bloquear cadastro ou navegação, mas deve impactar ativação pública e lançamento oficial.
4. Boundary real vale mais que fallback visual.
5. Rollout ativo não compensa dados territoriais ruins.
6. Empty State oficial é melhor que dado falso.
7. Nenhum score pode autorizar uma rota que viole integridade, URL canônica ou governança do Territory.
8. O modelo deve funcionar para country, state, city, district, neighborhood e TerritoryGroup, com pesos aplicáveis ao tipo auditado.

## 3. Entidade avaliada

O score é calculado para uma unidade territorial auditável:

| Tipo | Origem | Observação |
|---|---|---|
| `Territory` | `locations` | Country, state, city, district ou neighborhood. |
| `TerritoryGroup` | `territorial_groups` + `territorial_group_members` | Deve herdar parte da qualidade dos membros e ter qualidade própria de URL, rollout e community. |

Para TerritoryGroup, indicadores geográficos como Boundary e Centro Geográfico devem ser calculados a partir dos membros, salvo se houver boundary próprio oficial do grupo no futuro.

## 4. Indicadores e pesos

O `Territory Quality Score` é composto por 11 indicadores. A soma total é 100.

| Indicador | Peso | O que mede |
|---|---:|---|
| Boundary | 15 | Existência, validade e rastreabilidade do polígono oficial ou fallback declarado. |
| Centro geográfico | 10 | Centro numérico válido, fonte, confiança e coerência com boundary/bbox. |
| Fonte oficial | 12 | Proveniência do Territory e rastreabilidade até fonte governamental ou fonte aprovada. |
| Metadata | 10 | Campos territoriais mínimos, estatísticas, flags públicas e dados auxiliares. |
| Rollout | 8 | Configuração efetiva de disponibilidade por Territory e módulos públicos. |
| Conteúdo | 8 | Presença de dados reais ou Empty States oficiais para módulos públicos. |
| Community | 8 | Existência, status e consistência da camada social/editorial quando aplicável. |
| Hero | 5 | Hero genérico ou específico, imagem opcional e ausência de artefato hardcoded. |
| URLs | 8 | Caminhos canônicos, builders oficiais, alias e ausência de escapes indevidos. |
| Busca | 6 | Indexação, filtros territoriais e ausência de vazamento de resultados externos. |
| Integridade | 10 | Hierarquia, slug, duplicidade, referências, status e invariantes do domínio. |

## 5. Escala por indicador

Cada indicador recebe uma nota normalizada entre 0 e 1. O score final multiplica cada nota pelo seu peso.

### 5.1 Boundary, peso 15

| Nota | Critério |
|---:|---|
| 1.00 | Boundary oficial presente, válido, com fonte, URL, object id, centro e geometria Polygon/MultiPolygon válida. |
| 0.80 | Boundary oficial presente e válido, mas com metadado secundário incompleto. |
| 0.60 | Boundary ausente, mas existe fallback formal documentado e visualmente identificado como fallback. |
| 0.30 | Apenas bbox ou centro usado como aproximação, sem declaração clara no produto. |
| 0.00 | Sem boundary, sem fallback aceitável ou geometria inválida. |

### 5.2 Centro geográfico, peso 10

| Nota | Critério |
|---:|---|
| 1.00 | Centro válido, com fonte oficial e coerente com boundary. |
| 0.80 | Centro válido, com fonte confiável, coerente com bbox. |
| 0.60 | Centro válido, fonte externa de confiança média. |
| 0.30 | Centro herdado, sem fonte explícita ou marcado para refinamento. |
| 0.00 | Centro ausente, inválido ou fora do intervalo latitude/longitude. |

### 5.3 Fonte oficial, peso 12

| Nota | Critério |
|---:|---|
| 1.00 | Fonte oficial aprovada, URL, object id e nível da fonte presentes. |
| 0.80 | Fonte oficial aprovada, mas com detalhe secundário incompleto. |
| 0.60 | Fonte pública confiável, ainda não marcada como oficial. |
| 0.30 | Fonte inferida, herdada ou sem rastreabilidade completa. |
| 0.00 | Sem fonte ou fonte contraditória com o tipo do Territory. |

### 5.4 Metadata, peso 10

| Nota | Critério |
|---:|---|
| 1.00 | Metadata mínima completa e válida para o tipo: estatísticas, bbox, timezone/códigos quando aplicáveis, flags públicas e dados de sincronização. |
| 0.80 | Metadata completa para operação, com ausência apenas editorial/opcional. |
| 0.60 | Metadata suficiente para navegação, mas incompleta para lançamento. |
| 0.30 | Metadata mínima incompleta, mas routeable. |
| 0.00 | Metadata ausente ou incoerente com o tipo/status. |

### 5.5 Rollout, peso 8

| Nota | Critério |
|---:|---|
| 1.00 | Rollout local por Territory definido para módulos aplicáveis, com status correto. |
| 0.80 | Rollout herdado de ancestor e aprovado como política formal. |
| 0.60 | Rollout herdado funcional, mas sem decisão operacional explícita. |
| 0.30 | Rollout parcial, módulos divergentes ou fallback ambíguo. |
| 0.00 | Sem rollout efetivo para a superfície solicitada. |

### 5.6 Conteúdo, peso 8

| Nota | Critério |
|---:|---|
| 1.00 | Conteúdo real mínimo por módulo principal e sem referências externas indevidas. |
| 0.80 | Conteúdo real em parte dos módulos e Empty States oficiais nos demais. |
| 0.60 | Pouco conteúdo, mas todos os módulos usam Empty States oficiais. |
| 0.30 | Empty States incompletos ou CTAs genéricos demais. |
| 0.00 | Dados mockados, vazamento de outro Territory ou módulo sem estado vazio. |

### 5.7 Community, peso 8

| Nota | Critério |
|---:|---|
| 1.00 | Community ativa, vinculada ao Territory correto e com moderação/status coerente. |
| 0.80 | Community `coming_soon` ou grupo ativo com membros corretos, quando o estágio permitir. |
| 0.60 | Sem Community própria, mas Territory Home genérica cobre a experiência. |
| 0.30 | Community parcial, stale ou sem clareza de status. |
| 0.00 | Community aponta para Territory errado, membro inválido ou estado contraditório. |

### 5.8 Hero, peso 5

| Nota | Critério |
|---:|---|
| 1.00 | Hero específico do Territory vindo do SSOT, com imagem/arte aprovada quando aplicável. |
| 0.80 | Hero genérico do Territory com dados reais e sem conteúdo hardcoded. |
| 0.60 | Hero genérico funcional, mas sem identidade visual territorial. |
| 0.30 | Hero incompleto, com copy ou CTA fraco, mas sem dado falso. |
| 0.00 | Hero mockado, imagem hardcoded ou conteúdo enganoso. |

### 5.9 URLs, peso 8

| Nota | Critério |
|---:|---|
| 1.00 | URL canônica resolve ida/volta via builders oficiais, sem alias conflitante e sem fallback global indevido. |
| 0.80 | URL canônica funciona, com alias controlado ou fallback documentado. |
| 0.60 | URL principal funciona, mas há risco residual de fallback fora do contexto. |
| 0.30 | Rotas parciais, CTAs inconsistentes ou montagem manual residual. |
| 0.00 | URL quebra, resolve Territory errado ou permite navegação pública indevida. |

### 5.10 Busca, peso 6

| Nota | Critério |
|---:|---|
| 1.00 | Busca indexa o Territory, respeita filtros e não retorna conteúdo externo. |
| 0.80 | Busca territorial funciona, com baixa cobertura de conteúdo. |
| 0.60 | Busca retorna Empty State correto e preserva filtro territorial. |
| 0.30 | Busca funciona parcialmente ou depende de fallback amplo. |
| 0.00 | Busca ignora Territory, mistura cidades/bairros ou quebra. |

### 5.11 Integridade, peso 10

| Nota | Critério |
|---:|---|
| 1.00 | Hierarquia, slug, path, status, FK, duplicidade e referências passam sem achados. |
| 0.80 | Integridade principal correta, com resíduos inativos monitorados. |
| 0.60 | Integridade routeable, mas com referências fora do escopo que não vazam no produto. |
| 0.30 | Resíduos ativos ou inconsistências que exigem saneamento antes de exposição ampla. |
| 0.00 | Duplicidade, FK inválida, parent errado, path inválido ou Territory público inválido. |

## 6. Fórmula oficial

O cálculo base é:

```text
territory_quality_score =
  round(
    boundary_score * 15 +
    center_score * 10 +
    official_source_score * 12 +
    metadata_score * 10 +
    rollout_score * 8 +
    content_score * 8 +
    community_score * 8 +
    hero_score * 5 +
    urls_score * 8 +
    search_score * 6 +
    integrity_score * 10
  )
```

Todos os indicadores devem ser calculados antes dos bloqueios. Depois do cálculo base, aplicam-se os caps de segurança.

## 7. Caps e bloqueios

Os caps impedem que um Territory com falha crítica alcance um estágio indevido apenas por ter bons indicadores secundários.

| Condição | Score máximo |
|---|---:|
| `integrity_score = 0` | 29 |
| `integrity_score < 0.6` | 49 |
| URL canônica não resolve o próprio Territory | 39 |
| Territory ativo sem fonte mínima rastreável | 59 |
| Centro geográfico inválido | 49 |
| Boundary inválido apresentado como oficial | 59 |
| Conteúdo vazando de outro Territory | 69 |
| Rollout ausente para superfície pública solicitada | 69 |
| Community apontando para Territory errado | 69 |
| Dados mockados apresentados como reais | 69 |

Além dos caps, algumas condições bloqueiam lançamento oficial independentemente do score:

| Bloqueio | Efeito |
|---|---|
| `geographic_path` duplicado ou inválido | Sem navegação pública. |
| `parent_id` incorreto | Sem ativação pública. |
| Slug canônico divergente sem alias formal | Sem ativação pública. |
| Status público contraditório com rollout | Sem ativação pública. |
| Boundary falso ou desenhado sem fonte apresentado como oficial | Sem lançamento oficial. |
| Referência órfã em conteúdo crítico | Sem lançamento oficial. |

## 8. Faixas de qualidade

| Score | Faixa | Leitura |
|---:|---|---|
| 0-29 | Crítico | Territory não confiável. Deve ficar fora de navegação pública. |
| 30-49 | Baixo | Pode existir no SSOT, mas não deve guiar experiência pública. |
| 50-64 | Básico | Pode receber cadastro e navegação controlada. |
| 65-79 | Operacional | Pode renderizar Territory Home com Empty States oficiais. |
| 80-89 | Público | Pode ter ativação pública com ressalvas auditadas. |
| 90-100 | Lançável | Pode ser tratado como lançamento oficial. |

## 9. Permissões por score

| Uso | Score mínimo | Condições obrigatórias |
|---|---:|---|
| Cadastro | 50 | Integridade >= 0.6, URL routeable ou Territory selecionável, fonte mínima rastreável. |
| Navegação | 55 | URL canônica resolve o próprio Territory, status navegável e nenhum bloqueio estrutural. |
| Territory Home | 65 | Metadata suficiente, centro válido, URLs contextuais, Empty States oficiais e sem dados mockados. |
| Ativação pública | 80 | Rollout efetivo, busca filtrada, conteúdo/Empty States válidos, sem vazamento territorial e boundary/fallback formal. |
| Lançamento oficial | 90 | Boundary oficial ou decisão formal excepcional, Community/hero adequados ao estágio, conteúdo mínimo aprovado e zero bloqueio crítico. |

## 10. Regras por estágio

### 10.1 Cadastro

Cadastro significa permitir que usuários, empresas ou operadores vinculem dados ao Territory.

Permitido quando:

- score >= 50;
- integridade estrutural não está bloqueada;
- Territory tem fonte mínima rastreável;
- não há duplicidade de slug/path;
- a seleção não induz o usuário a escolher um Territory residual.

Cadastro não exige boundary completo, community ativa ou conteúdo existente.

### 10.2 Navegação

Navegação significa permitir acesso por URL pública ou selector.

Permitido quando:

- score >= 55;
- URL canônica resolve corretamente;
- status e flags públicas permitem navegação;
- o fallback de mapa, quando existir, não se passa por boundary oficial;
- CTAs não levam para outro Territory.

### 10.3 Territory Home

Territory Home significa renderizar a página inicial territorial com blocos, módulos, cards e Empty States.

Permitido quando:

- score >= 65;
- Home consome SSOT ou Empty State oficial;
- módulos exibidos respeitam rollout;
- estatísticas são reais ou explicitamente ausentes;
- hero não contém dado falso;
- busca e URLs permanecem dentro do Territory.

### 10.4 Ativação pública

Ativação pública significa que o Territory pode ser promovido como disponível para uso.

Permitido quando:

- score >= 80;
- rollout efetivo existe para o Territory ou política de herança está formalmente aprovada;
- mapa usa boundary real ou fallback formal e transparente;
- módulos públicos principais não quebram;
- conteúdo externo ao Territory não aparece;
- Search, URLs e Empty States passam em auditoria.

### 10.5 Lançamento oficial

Lançamento oficial significa campanha, comunicação comercial ou destaque público do Territory como praça lançada.

Permitido quando:

- score >= 90;
- boundary oficial está presente, ou exceção formal documentada aprovada;
- community e moderação estão coerentes com o estágio;
- hero/identidade pública estão adequados;
- há conteúdo inicial suficiente ou curadoria aprovada;
- zero bloqueio crítico pendente;
- há relatório de qualidade registrado antes do lançamento.

## 11. Aplicabilidade por tipo de Territory

Nem todo tipo territorial tem a mesma exigência de conteúdo ou community. O peso continua o mesmo, mas a nota do indicador deve refletir a expectativa do tipo.

| Indicador | Country/State | City | Neighborhood | TerritoryGroup |
|---|---|---|---|---|
| Boundary | Boundary amplo ou bbox oficial | Contorno municipal | Polígono do bairro | União dos membros ou fallback formal |
| Centro geográfico | Centro canônico | Centro municipal | Centro do bairro | Centro calculado dos membros |
| Fonte oficial | IBGE/fonte nacional | IBGE + municipal | Fonte municipal | Fonte dos membros + definição operacional |
| Metadata | Códigos e timezone | Códigos, timezone, stats | Fonte municipal e stats locais | Metadata do grupo |
| Rollout | Raro/global | City rollout | Local ou herdado aprovado | Rollout do grupo |
| Conteúdo | Geralmente N/A operacional | Conteúdo agregado | Conteúdo local | Conteúdo dos membros |
| Community | Normalmente N/A | Opcional | Esperada em lançamento | Esperada se grupo for produto público |
| Hero | Genérico aceito | Cidade | Bairro | Grupo |
| URLs | Canônicas | Canônicas | Canônicas | Canônicas de grupo |
| Busca | Escopo amplo | Escopo cidade | Escopo bairro | Escopo membros |
| Integridade | Obrigatória | Obrigatória | Obrigatória | Obrigatória |

Quando um indicador for realmente não aplicável ao estágio, a nota mínima aceitável é 0.60, desde que exista justificativa registrada. Isso evita inflar score por ausência de responsabilidade e mantém comparação conservadora.

## 12. Modelo de relatório de auditoria

Cada auditoria de qualidade territorial deve gerar uma linha por Territory:

| Campo | Descrição |
|---|---|
| `territory_id` | UUID ou identificador estável. |
| `type` | Tipo do Territory. |
| `geographic_path` | Caminho canônico. |
| `score` | Score final depois de caps. |
| `stage_allowed` | Maior estágio permitido. |
| `boundary_score` | Nota normalizada. |
| `center_score` | Nota normalizada. |
| `official_source_score` | Nota normalizada. |
| `metadata_score` | Nota normalizada. |
| `rollout_score` | Nota normalizada. |
| `content_score` | Nota normalizada. |
| `community_score` | Nota normalizada. |
| `hero_score` | Nota normalizada. |
| `urls_score` | Nota normalizada. |
| `search_score` | Nota normalizada. |
| `integrity_score` | Nota normalizada. |
| `caps_applied` | Lista de caps aplicados. |
| `blockers` | Bloqueios que impedem estágio superior. |
| `next_action` | Próxima ação de dados ou operação. |

## 13. Exemplo de leitura operacional

Um bairro com identidade correta, centro numérico sem fonte, sem boundary, com rollout herdado, sem community própria e com Empty States oficiais pode navegar e talvez renderizar Territory Home, mas não deve ser lançado oficialmente.

Um bairro com boundary oficial, centro validado, fonte municipal, URLs corretas, busca filtrada, rollout local, conteúdo inicial e Community pronta pode alcançar lançamento oficial.

Um bairro residual ativo fora da fonte oficial pode até ter rota, mas deve receber cap de integridade e não pode ser ativado publicamente.

## 14. Plano de adoção

### Fase 1: definição e auditoria manual

1. Usar este documento como checklist em readiness reports.
2. Calcular score manualmente para cidades prioritárias.
3. Registrar caps e bloqueios em relatório antes de qualquer ativação pública.

### Fase 2: automação sem mudança de contrato

1. Criar script de auditoria somente leitura.
2. Produzir CSV/Markdown com score por Territory.
3. Validar Salvador como primeira cidade completa.
4. Usar o resultado para priorizar importação de boundaries e saneamento de coordenadas.

### Fase 3: governança operacional

1. Exigir score mínimo por estágio em checklist de lançamento.
2. Bloquear comunicação de lançamento oficial sem score >= 90.
3. Recalcular score após importação de boundaries, mudanças de rollout ou alterações em conteúdo.
4. Manter histórico de score por sprint em documentos de domínio.

## 15. Fora de escopo

Este plano não implementa:

- novas tabelas;
- novas colunas;
- migrations;
- dashboards;
- jobs;
- scripts;
- alterações de rota;
- mudanças em rollout;
- importação de boundaries;
- alteração de UX.

Qualquer implementação futura deverá ser tratada em sprint própria e obedecer `TERRITORY-GOVERNANCE.md`.

## 16. Decisão recomendada

Adotar o `Territory Quality Score` como critério oficial de readiness territorial.

O score não substitui auditoria humana em lançamento oficial. Ele torna a decisão objetiva: um Territory pode até existir no SSOT, mas só progride de cadastro para navegação, Home, ativação pública e lançamento oficial quando seus dados territoriais sustentam essa experiência.
