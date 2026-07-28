# TERRITORY-DATA-QUALITY-V2.md

**Sprint:** TERRITORY.DATA-QUALITY.V2
**Status:** padrão oficial de governança de qualidade territorial
**Escopo:** domínio Territory e readiness territorial-operacional
**Base:** `TERRITORY-DATA-QUALITY.md`, `TERRITORY-DATA-QUALITY-REVIEW.md`, `TERRITORY-GOVERNANCE.md`
**Regra:** este documento é especificação de governança. Não implementa código, banco, migrations, contratos ou arquitetura.

## 1. Decisão central

O modelo anterior de score único está substituído.

A partir desta V2, readiness territorial é sempre avaliada por dois eixos independentes:

| Score | Pergunta respondida | Pertence a |
|---|---|---|
| `Territory Data Quality Score` | O Territory é confiável como dado territorial? | Domínio Territory |
| `Territory Operational Maturity Score` | O produto está pronto para operar nesse Territory? | Produto, módulos e operação |

Um score nunca autoriza um estágio sozinho.

Todo estágio depende de:

1. score mínimo;
2. gates obrigatórios;
3. ausência de blockers;
4. exceções auditáveis válidas, quando existirem.

Nenhum lançamento oficial poderá ocorrer apenas por score.

## 2. Conceitos oficiais

### 2.1 Territory Data Quality Score

Mede qualidade objetiva do dado territorial.

Inclui somente indicadores que pertencem ao domínio Territory:

- integridade;
- fonte oficial;
- metadata territorial;
- boundary;
- centro geográfico;
- URLs e resolução;
- isolamento territorial de busca/filtro.

Não inclui conteúdo, community, hero, rollout ou uso.

### 2.2 Territory Operational Maturity Score

Mede prontidão operacional do produto naquele território.

Inclui somente indicadores de operação, produto e superfície pública:

- rollout;
- conteúdo e Empty States;
- community e moderação;
- hero e identidade editorial;
- módulos públicos;
- cobertura/relevância de busca.

Não corrige nem compensa falhas de qualidade territorial.

### 2.3 Stage Allowed

`Stage Allowed` é o maior estágio permitido para um Territory depois de aplicar scores, gates, blockers e exceções.

```text
stage_allowed =
  highest_stage_where(
    data_quality_score >= required_data_quality_score &&
    operational_maturity_score >= required_operational_maturity_score &&
    required_gates_are_true &&
    no_stage_blockers_are_present &&
    exceptions_are_valid_if_needed
  )
```

## 3. Fluxo oficial

O fluxo de governança é obrigatório:

```text
SSOT
  ↓
Auditoria
  ↓
Territory Data Quality Score
  ↓
Territory Operational Maturity Score
  ↓
Gates
  ↓
Stage Allowed
  ↓
Rollout
  ↓
Lançamento
```

Regras do fluxo:

- SSOT vem antes de qualquer score.
- Auditoria coleta evidências antes de calcular.
- Data Quality é calculado antes de maturidade operacional.
- Operational Maturity não compensa falha estrutural.
- Gates são booleanos e podem bloquear mesmo com score alto.
- Rollout só acontece depois do estágio permitido.
- Lançamento oficial exige aprovação explícita, não apenas score.

## 4. Perfis de Territory

Cada tipo de Territory possui perfil próprio. Não existe nota mínima automática para indicador não aplicável. Indicador não aplicável tem peso `0` no perfil, e os demais pesos somam `100`.

### 4.1 Data Quality weights por perfil

| Indicador | Country | State | City | District | Neighborhood | TerritoryGroup |
|---|---:|---:|---:|---:|---:|---:|
| Integridade | 25 | 25 | 20 | 25 | 20 | 25 |
| Fonte oficial | 25 | 20 | 15 | 15 | 15 | 10 |
| Metadata | 20 | 20 | 15 | 15 | 15 | 10 |
| Boundary / cobertura geográfica | 5 | 10 | 20 | 10 | 20 | 20 |
| Centro geográfico | 10 | 10 | 10 | 10 | 10 | 10 |
| URLs e resolução | 15 | 15 | 15 | 20 | 15 | 15 |
| Isolamento territorial | 0 | 0 | 5 | 5 | 5 | 10 |
| **Total** | **100** | **100** | **100** | **100** | **100** | **100** |

### 4.2 Operational Maturity weights por perfil

| Indicador | Country | State | City | District | Neighborhood | TerritoryGroup |
|---|---:|---:|---:|---:|---:|---:|
| Rollout | 20 | 20 | 20 | 25 | 20 | 20 |
| Conteúdo e Empty States | 10 | 10 | 20 | 15 | 20 | 20 |
| Community e moderação | 0 | 0 | 10 | 5 | 20 | 20 |
| Hero e identidade editorial | 10 | 10 | 10 | 5 | 10 | 10 |
| Módulos públicos | 40 | 40 | 25 | 35 | 20 | 20 |
| Busca com cobertura | 20 | 20 | 15 | 15 | 10 | 10 |
| **Total** | **100** | **100** | **100** | **100** | **100** | **100** |

### 4.3 Interpretação por perfil

| Tipo | Regra de leitura |
|---|---|
| Country | Deve ser confiável como raiz territorial e resolver URL/cadastro global. Community não é exigida. |
| State | Deve ser confiável como unidade federativa. Conteúdo/community não bloqueiam navegação. |
| City | Deve combinar score próprio e cobertura mínima dos filhos. Não pode lançar oficialmente ignorando bairros filhos. |
| District | Pode ser fallback administrativo ou legado. Deve distinguir distrito público de resíduo. |
| Neighborhood | Perfil mais exigente para boundary, fonte municipal, centro, URL, busca e operação local. |
| TerritoryGroup | Depende do grupo e dos membros. Um membro crítico ruim limita o grupo. |

## 5. Indicadores de Data Quality

Todo indicador possui definição, evidência objetiva, fonte, cálculo, responsável e validade.

### 5.1 Integridade

| Campo | Definição |
|---|---|
| Definição | Consistência estrutural do Territory: `id`, `parent_id`, `type`, `slug`, `name`, `full_name`, `geographic_path`, `status`, unicidade e relações. |
| Evidência objetiva | Checks de parent válido, path canônico, slug único por parent, FK válida, ausência de duplicidade, status coerente e ausência de resíduo público indevido. |
| Fonte | `locations`, `territorial_groups`, `territorial_group_members`, constraints e repositórios oficiais. |
| Cálculo | Nota 1 quando todos os checks passam; 0.7 com resíduos inativos monitorados; 0.4 com inconsistência não pública; 0 quando há falha pública estrutural. |
| Responsável | Territory/Data Governance. |
| Validade | Até alteração de Territory, migration territorial, importação de dados ou 30 dias, o que ocorrer primeiro. |

### 5.2 Fonte oficial

| Campo | Definição |
|---|---|
| Definição | Rastreabilidade do Territory até fonte governamental, municipal, IBGE ou fonte aprovada pela governança. |
| Evidência objetiva | `source_name`, `source_level`, `source_url`, `source_object_id`, `official`, `synced_at` ou equivalente. |
| Fonte | `locations.metadata`, `location_boundaries.metadata`, documentação de fonte e registros de importação. |
| Cálculo | Nota 1 com fonte oficial completa; 0.8 com detalhe secundário ausente; 0.5 com fonte pública confiável ainda não aprovada; 0.2 com fonte inferida; 0 sem fonte. |
| Responsável | Territory/Data Governance. |
| Validade | 180 dias ou até atualização da fonte oficial. |

### 5.3 Metadata territorial

| Campo | Definição |
|---|---|
| Definição | Completeness dos metadados exigidos pelo perfil do Territory. |
| Evidência objetiva | Campos mínimos por tipo: códigos, timezone, bbox, área/perímetro quando aplicável, flags públicas, timestamps e dados auxiliares. |
| Fonte | `locations.metadata`, `territorial_groups.metadata`, schema canônico de metadata. |
| Cálculo | Nota proporcional ao percentual de campos obrigatórios válidos; campos opcionais não entram no denominador. |
| Responsável | Territory/Data Governance. |
| Validade | 90 dias ou até alteração do registro. |

### 5.4 Boundary / cobertura geográfica

| Campo | Definição |
|---|---|
| Definição | Qualidade da delimitação geográfica do Territory ou cobertura geográfica dos membros. |
| Evidência objetiva | GeoJSON Polygon/MultiPolygon válido, source, source_url, source_object_id, center, bbox, ausência de geometria órfã. |
| Fonte | `location_boundaries`, metadata oficial, `BoundaryService` como serviço de consumo. |
| Cálculo | Nota 1 com boundary oficial válido; 0.8 com boundary válido e detalhe secundário ausente; 0.5 com fallback formal; 0.2 com apenas centro/bbox aproximado; 0 sem geometria ou fallback aceitável. |
| Responsável | Territory/Geospatial Data. |
| Validade | 180 dias ou até nova importação de boundaries. |

Observação: fallback nunca equivale a boundary oficial para lançamento oficial.

### 5.5 Centro geográfico

| Campo | Definição |
|---|---|
| Definição | Centro canônico usado para fallback visual, ordenação geográfica e enquadramento inicial do mapa. |
| Evidência objetiva | Latitude/longitude numéricas, fonte, confiança, `coordinates_needs_refinement`, coerência com bbox ou boundary. |
| Fonte | `locations.metadata`, `location_boundaries.center_lat`, `location_boundaries.center_lng`. |
| Cálculo | Nota 1 com centro oficial dentro do boundary; 0.8 com centro confiável dentro do bbox; 0.6 com fonte externa média; 0.3 com centro herdado/refinamento pendente; 0 com centro inválido. |
| Responsável | Territory/Geospatial Data. |
| Validade | 180 dias ou até alteração de boundary/metadata. |

### 5.6 URLs e resolução

| Campo | Definição |
|---|---|
| Definição | Capacidade de resolver o Territory por URL canônica e reconstruir URLs por builders oficiais. |
| Evidência objetiva | `geographic_path`, slug, parse oficial, resolução por `ResolvedTerritory`, ausência de alias conflitante e ausência de fallback global indevido. |
| Fonte | `locations.geographic_path`, `territoryUrls`, resolver oficial e testes/auditorias de rota. |
| Cálculo | Nota 1 quando resolve ida/volta canônica; 0.8 com alias controlado; 0.5 com fallback documentado; 0.2 com inconsistência parcial; 0 quando resolve Territory errado ou quebra. |
| Responsável | Territory/Routing. |
| Validade | 30 dias ou até alteração de rota, slug, path ou builder. |

### 5.7 Isolamento territorial

| Campo | Definição |
|---|---|
| Definição | Garantia de que filtros, busca e módulos usam `TerritoryFilter`/`ResolvedTerritory` e não vazam dados de outro Territory. |
| Evidência objetiva | Queries com `location_id`, `activeMemberIds`, escopo de grupo/location, Empty State sem resultado externo e ausência de filtro por string de URL. |
| Fonte | Serviços de busca/conteúdo, hooks territoriais, testes de isolamento e auditoria de resultados. |
| Cálculo | Nota 1 sem vazamento; 0.8 com cobertura parcial testada; 0.5 com Empty State seguro mas sem prova completa; 0.2 com fallback amplo; 0 com vazamento confirmado. |
| Responsável | Territory + donos dos módulos integrados. |
| Validade | 30 dias ou até alteração de módulo, busca, filtro ou rota. |

## 6. Indicadores de Operational Maturity

Operational Maturity nunca altera Data Quality. Ele mede se o produto está pronto para operar sobre um Territory que já foi resolvido.

### 6.1 Rollout

| Campo | Definição |
|---|---|
| Definição | Configuração efetiva de exposição pública por módulo e Territory. |
| Evidência objetiva | Registros de rollout, status por módulo, precedência local/ancestor e aprovação de herança quando houver. |
| Fonte | `module_rollouts` ou SSOT equivalente de rollout. |
| Cálculo | Nota 1 com rollout local explícito; 0.8 com herança formalmente aprovada; 0.5 com herança funcional sem decisão registrada; 0.2 com módulos divergentes; 0 sem rollout efetivo. |
| Responsável | Produto/Operações. |
| Validade | Até alteração do rollout ou 30 dias. |

### 6.2 Conteúdo e Empty States

| Campo | Definição |
|---|---|
| Definição | Existência de conteúdo real ou Empty States oficiais para módulos públicos. |
| Evidência objetiva | Contagem por módulo, vínculo por `location_id`, ausência de conteúdo externo, Empty State aprovado e CTA contextual. |
| Fonte | Posts, business, services, gastronomy, events, classifieds, jobs e demais módulos públicos. |
| Cálculo | Nota por cobertura dos módulos aplicáveis: conteúdo real pontua mais; Empty State oficial pontua parcialmente; mock/vazamento zera o módulo. |
| Responsável | Donos dos módulos + Produto. |
| Validade | 14 dias ou até alteração relevante de conteúdo/módulo. |

### 6.3 Community e moderação

| Campo | Definição |
|---|---|
| Definição | Prontidão da camada social/editorial sobre o Territory. |
| Evidência objetiva | Community vinculada ao Territory correto, status, membros, moderação, ownership, regras e disponibilidade pública. |
| Fonte | `territory_communities`, grupos, moderação e registros operacionais. |
| Cálculo | Nota 1 com community ativa e moderada; 0.8 com coming soon aprovado; 0.5 com Home genérica suficiente para estágio; 0.2 com estado parcial; 0 com vínculo errado ou status contraditório. |
| Responsável | Community/Operações. |
| Validade | 30 dias ou até alteração de community/status. |

### 6.4 Hero e identidade editorial

| Campo | Definição |
|---|---|
| Definição | Prontidão da apresentação pública do Territory, sem hardcode e sem informação enganosa. |
| Evidência objetiva | Hero genérico ou específico aprovado, imagem/copy/CTA vindos de SSOT ou fallback governado, sem mock. |
| Fonte | Metadata editorial, CMS/admin quando existir, componentes de Home e design review. |
| Cálculo | Nota 1 com hero específico aprovado; 0.8 com hero genérico SSOT; 0.5 com hero funcional sem identidade local; 0.2 com lacunas editoriais; 0 com mock/hardcode enganoso. |
| Responsável | Produto/Design/Community. |
| Validade | 90 dias ou até alteração editorial. |

### 6.5 Módulos públicos

| Campo | Definição |
|---|---|
| Definição | Prontidão técnica e UX dos módulos públicos naquele Territory. |
| Evidência objetiva | Feed, Empresas, Serviços, Gastronomia, Eventos, Busca, Mobilidade, Classificados e outros módulos aplicáveis abrem, carregam, respeitam rollout e possuem Empty State/CTA. |
| Fonte | Rotas públicas, gates, testes, auditoria manual/e2e e owners dos módulos. |
| Cálculo | Média ponderada por módulo aplicável; módulo pausado ou quebrado recebe 0; módulo com Empty State correto recebe parcial; módulo com dados reais e filtro correto recebe máximo. |
| Responsável | Donos dos módulos + QA. |
| Validade | Por release ou até alteração de rota/módulo. |

### 6.6 Busca com cobertura

| Campo | Definição |
|---|---|
| Definição | Capacidade da busca pública retornar resultado ou Empty State relevante dentro do Territory. |
| Evidência objetiva | Query por escopo territorial, resultados por módulo, ausência de vazamento e relevância mínima quando houver conteúdo. |
| Fonte | Serviço de busca, índices, módulos de conteúdo e auditorias de resultado. |
| Cálculo | Nota 1 com cobertura e relevância; 0.8 com baixa cobertura mas isolamento correto; 0.5 com Empty State correto; 0.2 com fallback amplo; 0 com vazamento/quebra. |
| Responsável | Search + donos dos módulos. |
| Validade | 14 dias ou até alteração de índice/conteúdo. |

## 7. Fórmulas oficiais

### 7.1 Data Quality

```text
data_quality_score(profile) =
  round(
    sum(indicator_score * profile_data_quality_weight)
  )
```

Os pesos são definidos na tabela de perfil. Indicador com peso 0 não entra no cálculo.

### 7.2 Operational Maturity

```text
operational_maturity_score(profile) =
  round(
    sum(indicator_score * profile_operational_maturity_weight)
  )
```

Os pesos são definidos na tabela de perfil. Indicador com peso 0 não entra no cálculo.

### 7.3 Stage Allowed

```text
stage_allowed =
  highest_stage(
    min_scores_met &&
    required_gates_met &&
    blockers_absent &&
    exceptions_valid
  )
```

Não existe conversão automática de score em autorização.

## 8. Gates por estágio

### 8.1 Tabela de mínimos

| Estágio | Data Quality mínimo | Operational Maturity mínimo | Decisão |
|---|---:|---:|---|
| Cadastro | 50 | 0 | Pode receber dados vinculados ao Territory. |
| Navegação | 60 | 0 | Pode ser acessado por URL/selector. |
| Territory Home | 70 | 40 | Pode renderizar Home territorial pública. |
| Ativação pública | 80 | 60 | Pode ser disponibilizado ao público como praça em operação. |
| Lançamento oficial | 90 | 80 | Pode ser comunicado como lançamento oficial. |

### 8.2 Gates de cadastro

Obrigatórios:

- `integrity_score >= 0.6`;
- fonte mínima rastreável;
- `geographic_path` canônico ou identificador de grupo canônico;
- status não contraditório;
- selector não apresenta resíduo público indevido.

Blockers:

- parent inválido;
- slug/path duplicado;
- FK órfã;
- Territory residual ativo indevido.

### 8.3 Gates de navegação

Obrigatórios:

- Data Quality >= 60;
- URL canônica resolve o próprio Territory;
- status e flags permitem navegação;
- fallback geográfico é transparente quando não há boundary;
- CTAs não saem para outro Territory.

Blockers:

- URL resolve Territory errado;
- status inactive/restricted exposto como público;
- fallback global indevido;
- nome/slug residual público.

### 8.4 Gates de Territory Home

Obrigatórios:

- Data Quality >= 70;
- Operational Maturity >= 40;
- Home usa SSOT ou Empty State oficial;
- módulos exibidos respeitam rollout;
- busca/filtros não vazam dados;
- hero não apresenta dado falso.

Blockers:

- dados mockados apresentados como reais;
- módulo público sem loading/empty state;
- card ou CTA com destino fora do Territory;
- estatística falsa ou hardcoded.

### 8.5 Gates de ativação pública

Obrigatórios:

- Data Quality >= 80;
- Operational Maturity >= 60;
- rollout local ou herança formalmente aprovada;
- módulos públicos principais não quebram;
- Search isolada;
- conteúdo externo ao Territory não aparece;
- boundary real ou fallback formal aprovado para ativação.

Blockers:

- rollout herdado sem política aprovada;
- vazamento territorial confirmado;
- módulo principal pausado sem comunicação de estágio;
- boundary falso apresentado como oficial.

### 8.6 Gates de lançamento oficial

Obrigatórios:

- Data Quality >= 90;
- Operational Maturity >= 80;
- aprovação explícita de lançamento;
- boundary oficial, exceto se houver exceção auditável válida;
- community/hero/conteúdo aprovados para o perfil;
- relatório de auditoria registrado;
- zero blocker crítico pendente.

Blockers absolutos:

- lançamento baseado apenas em score;
- boundary falso;
- fonte oficial ausente;
- URL canônica inconsistente;
- membro crítico inválido em City/TerritoryGroup;
- módulo obrigatório pausado para a campanha;
- exceção vencida ou sem responsável.

## 9. Blockers e exceções auditáveis

### 9.1 Blockers

| Classe | Exemplos | Efeito |
|---|---|---|
| Estrutural | parent errado, path duplicado, FK órfã | Bloqueia navegação pública e superiores. |
| Fonte | fonte ausente, fonte contraditória | Bloqueia ativação pública e lançamento. |
| Geográfico | boundary falso, centro inválido | Bloqueia lançamento; pode bloquear Home se quebrar mapa. |
| Routing | URL resolve errado, alias conflitante | Bloqueia navegação e superiores. |
| Isolamento | busca/conteúdo vazando outro Territory | Bloqueia ativação pública e lançamento. |
| Operacional | módulo obrigatório pausado, rollout ausente | Bloqueia ativação pública e lançamento. |
| Governança | exceção sem responsável, auditoria ausente | Bloqueia lançamento oficial. |

### 9.2 Exceções auditáveis

Exceção não aumenta score. Ela apenas autoriza um gate específico sob condição controlada.

Toda exceção deve registrar:

| Campo | Obrigatório |
|---|---|
| `exception_id` | Sim |
| `territory_id` ou `territory_group_id` | Sim |
| `stage` | Sim |
| `gate` | Sim |
| `reason` | Sim |
| `risk` | Sim |
| `approved_by` | Sim |
| `approved_at` | Sim |
| `expires_at` | Sim |
| `evidence_url` ou referência documental | Sim |
| `rollback_condition` | Sim |

Exceções vencidas são inválidas. Exceções sem responsável são inválidas. Exceções para lançamento oficial exigem aprovação explícita de governança e produto.

## 10. Agregação de City

City possui score próprio e score agregado dos filhos.

### 10.1 Universo de filhos

O universo padrão de filhos de City é:

```text
official_children =
  active child Territories
  where child.type in ('neighborhood', public district types)
  and child belongs to the official source set for the city
```

Territories inativos, residuais ou não oficiais não entram na cobertura positiva. Se estiverem públicos indevidamente, viram blocker.

### 10.2 Score próprio da City

`city_own_data_quality_score` usa o perfil `City`.

### 10.3 Índice de cobertura dos filhos

```text
child_coverage_index(stage) =
  round(
    median(child_data_quality_scores) * 0.40 +
    qualified_children_ratio(stage) * 100 * 0.30 +
    child_boundary_center_source_coverage * 100 * 0.20 +
    critical_child_floor_score * 0.10
  )
```

Definições:

| Métrica | Cálculo |
|---|---|
| `median(child_data_quality_scores)` | Mediana dos filhos oficiais. |
| `qualified_children_ratio(stage)` | Filhos que atingem o mínimo de Data Quality do estágio dividido pelo total de filhos oficiais. |
| `child_boundary_center_source_coverage` | Filhos com boundary ou fallback formal, centro válido e fonte rastreável dividido pelo total. |
| `critical_child_floor_score` | Menor score entre filhos críticos do estágio. |

### 10.4 Score agregado da City

```text
city_aggregated_data_quality_score =
  min(
    round(city_own_data_quality_score * 0.40 + child_coverage_index(stage) * 0.60),
    city_critical_child_cap(stage)
  )
```

### 10.5 Cobertura mínima por estágio

| Estágio | Cobertura mínima dos filhos |
|---|---:|
| Cadastro | 0% |
| Navegação | Selector não pode expor filho inválido. |
| Territory Home | 60% dos filhos oficiais com Data Quality >= 60 ou selector limitado aos válidos. |
| Ativação pública | 80% dos filhos oficiais com Data Quality >= 70 e zero filho crítico com blocker. |
| Lançamento oficial | 95% dos filhos oficiais com Data Quality >= 80 e 100% dos filhos expostos sem blocker crítico. |

### 10.6 Pior filho crítico

Um filho é crítico quando:

- aparece no selector público;
- é citado na campanha/lançamento;
- recebe conteúdo, CTA, rota ou rollout público;
- pertence ao conjunto de lançamento declarado.

Caps:

| Condição do pior filho crítico | Cap da City |
|---|---:|
| blocker estrutural | 49 |
| fonte ausente | 69 |
| centro inválido | 69 |
| URL quebrada | 59 |
| vazamento territorial | 79 |
| boundary ausente em lançamento oficial sem exceção | 89 |

## 11. Agregação de TerritoryGroup

TerritoryGroup combina qualidade própria do grupo e qualidade dos membros.

### 11.1 Score próprio do grupo

`group_own_data_quality_score` usa o perfil `TerritoryGroup` e avalia:

- `id`;
- slug;
- nome;
- anchor city;
- status;
- metadata;
- URLs;
- membership válido;
- isolamento territorial do grupo.

### 11.2 Índice dos membros

```text
member_quality_index(stage) =
  round(
    average(member_data_quality_scores) * 0.40 +
    median(member_data_quality_scores) * 0.20 +
    qualified_members_ratio(stage) * 100 * 0.20 +
    member_boundary_center_source_coverage * 100 * 0.20
  )
```

### 11.3 Score agregado do grupo

```text
territory_group_aggregated_data_quality_score =
  min(
    round(group_own_data_quality_score * 0.35 + member_quality_index(stage) * 0.65),
    group_critical_member_cap(stage)
  )
```

### 11.4 Cobertura mínima dos membros

| Estágio | Cobertura mínima dos membros |
|---|---:|
| Cadastro | 100% dos membros devem existir e estar vinculados corretamente. |
| Navegação | 100% dos membros expostos sem blocker estrutural. |
| Territory Home | 75% dos membros com Data Quality >= 60 e zero membro exposto quebrado. |
| Ativação pública | 90% dos membros com Data Quality >= 70 e zero membro crítico com blocker. |
| Lançamento oficial | 100% dos membros do grupo de lançamento com Data Quality >= 80. |

### 11.5 Pior membro crítico

Membro crítico é qualquer membro:

- usado no filtro do grupo;
- exposto no mapa;
- citado no hero ou copy;
- usado para conteúdo/CTA;
- incluído na campanha de lançamento.

Caps:

| Condição do pior membro crítico | Cap do TerritoryGroup |
|---|---:|
| membro inexistente ou FK inválida | 39 |
| membro fora da anchor city sem justificativa | 49 |
| membro inactive exposto | 49 |
| path/slug quebrado | 59 |
| fonte ausente | 69 |
| centro inválido | 69 |
| sem boundary em lançamento oficial sem exceção | 89 |
| vazamento de busca/conteúdo fora do grupo | 79 |

## 12. Stage Allowed por tipo

| Tipo | Regra adicional |
|---|---|
| Country | Lançamento oficial depende de estratégia de produto; Data Quality não exige community. |
| State | Não exige community para navegação; lançamento oficial depende de cidades cobertas. |
| City | Ativação pública e lançamento dependem da cobertura mínima dos filhos. |
| District | Deve estar explicitamente marcado como público; distrito residual não pode navegar. |
| Neighborhood | Lançamento oficial exige boundary oficial ou exceção auditada. |
| TerritoryGroup | Lançamento depende do pior membro crítico e da cobertura dos membros. |

## 13. Relatório oficial de auditoria

Toda auditoria deve produzir uma linha por entidade auditada.

| Campo | Descrição |
|---|---|
| `entity_id` | UUID do Territory ou TerritoryGroup. |
| `entity_kind` | `territory` ou `territory_group`. |
| `profile` | Country, State, City, District, Neighborhood ou TerritoryGroup. |
| `geographic_path_or_group_slug` | Identificador canônico. |
| `data_quality_score` | Score final de Data Quality. |
| `operational_maturity_score` | Score final de Operational Maturity. |
| `stage_allowed` | Maior estágio permitido. |
| `required_gates_passed` | Sim/não. |
| `blockers` | Lista de blockers. |
| `exceptions` | Lista de exceções válidas aplicadas. |
| `expired_exceptions` | Lista de exceções vencidas. |
| `critical_child_or_member_floor` | Menor score de filho/membro crítico, quando aplicável. |
| `child_or_member_coverage` | Cobertura agregada, quando aplicável. |
| `next_action` | Próxima ação de dados, produto ou governança. |
| `audited_at` | Timestamp da auditoria. |
| `valid_until` | Validade da auditoria. |

## 14. Documentos substituídos

Esta V2 substitui como referência de governança:

- `docs/domain/TERRITORY-DATA-QUALITY.md`;
- a decisão final de `docs/domain/TERRITORY-DATA-QUALITY-REVIEW.md`.

O review permanece como histórico e justificativa técnica da mudança. A V1 permanece como histórico, mas não deve ser usada como padrão de decisão.

Esta V2 complementa, mas não substitui:

- `docs/domain/TERRITORY-GOVERNANCE.md`;
- `docs/domain/TERRITORY-ROADMAP.md`;
- readiness reports de cidades específicas.

## 15. Conceitos removidos da V1

Removidos:

- score único `Territory Quality Score`;
- autorização de estágio baseada apenas em score;
- pesos únicos para todos os tipos de Territory;
- nota mínima 0.60 para indicador não aplicável;
- Hero como indicador de Data Quality;
- Community como indicador de Data Quality;
- Conteúdo como indicador de Data Quality;
- Rollout como indicador de Data Quality;
- Search misturando isolamento territorial e cobertura de conteúdo;
- fallback de boundary tratado como quase equivalente a boundary oficial;
- caps genéricos como única proteção contra decisão errada.

## 16. Conceitos adicionados na V2

Adicionados:

- `Territory Data Quality Score`;
- `Territory Operational Maturity Score`;
- perfis por Country, State, City, District, Neighborhood e TerritoryGroup;
- pesos próprios por perfil;
- gates obrigatórios por estágio;
- blockers por classe;
- exceções auditáveis com validade;
- algoritmo de `Stage Allowed`;
- agregação oficial de City;
- agregação oficial de TerritoryGroup;
- pior filho/membro crítico;
- cobertura mínima de filhos/membros;
- fluxo oficial SSOT -> Auditoria -> Data Quality -> Operational Maturity -> Gates -> Stage Allowed -> Rollout -> Lançamento;
- evidência objetiva, fonte, cálculo, responsável e validade para cada indicador.

## 17. Regra final de lançamento

Nenhum lançamento oficial poderá ocorrer apenas por score.

Lançamento oficial exige:

1. Data Quality mínimo do perfil e estágio;
2. Operational Maturity mínimo do perfil e estágio;
3. gates obrigatórios aprovados;
4. zero blocker crítico;
5. exceções auditáveis válidas, quando houver;
6. aprovação explícita de governança/produto;
7. relatório de auditoria registrado.

## 18. Status de adoção

Esta V2 pode ser considerada o padrão oficial de governança de qualidade territorial do domínio Territory para auditorias futuras.

Ela não implementa enforcement automático. Enforcement em código, banco, CI, admin ou dashboard deve ser tratado em sprint própria, sem alterar os contratos aqui definidos sem nova revisão de governança.
