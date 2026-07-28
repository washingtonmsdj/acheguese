# TERRITORY-DATA-QUALITY-REVIEW.md

> AVISO DE SUBSTITUICAO DOCUMENTAL
>
> Status: SUBSTITUIDO.
> Documento canonico atual: `docs/domain/TERRITORY-DATA-QUALITY-V2.md`.
> Este arquivo fica preservado apenas como historico e nao deve ser usado como fonte normativa.

**Sprint:** TERRITORY.DATA-QUALITY.REVIEW
**Data:** 2026-07-25
**Escopo:** revisão crítica do modelo `Territory Quality Score`
**Base obrigatória:** `docs/domain/TERRITORY-DATA-QUALITY.md`, `docs/domain/TERRITORY-GOVERNANCE.md`, `docs/domain/TERRITORY-ROADMAP.md`
**Tipo:** análise somente leitura, sem implementação

## 1. Veredito técnico

O modelo atual não deve virar padrão oficial ainda.

A ideia de medir qualidade territorial por score é correta, mas o documento mistura duas coisas diferentes:

| Conceito | Natureza | Exemplos |
|---|---|---|
| Qualidade Territorial | Qualidade do dado e da identidade territorial | hierarchy, slug, path, boundary, centro, fonte, metadata, URL, integridade |
| Maturidade Operacional | Prontidão do produto naquele território | conteúdo, community, hero editorial, rollout, busca com conteúdo, uso |

Essa mistura permite decisões enganosas. Um Territory pode ter ótimo dado territorial e baixa maturidade operacional. O inverso também é possível: uma praça com muito conteúdo e community ativa pode estar montada sobre boundary fraco, fonte insuficiente ou resíduos de SSOT.

Um score único tende a esconder essa diferença.

## 2. Respostas obrigatórias

### 1. Existem indicadores redundantes ou sobrepostos?

Sim.

Há sobreposição relevante entre:

| Indicadores | Sobreposição |
|---|---|
| Boundary, Centro geográfico, Fonte oficial, Metadata | Um boundary oficial já carrega fonte, centro, URL, object id e parte da metadata. O mesmo problema pode ser contado várias vezes. |
| URLs e Integridade | `geographic_path`, slug, alias e resolução canônica são invariantes de integridade e também aparecem como URLs. |
| Conteúdo, Community, Hero e Rollout | Todos medem maturidade de produto, não qualidade territorial pura. |
| Busca e Conteúdo | Busca com baixa cobertura é consequência de conteúdo escasso, não necessariamente falha territorial. |
| Hero e Community | Hero específico costuma pertencer à camada editorial da community, não à entidade territorial. |

O risco prático é inflar ou punir score duas vezes pelo mesmo problema. Exemplo: um bairro sem fonte oficial clara perde em `Fonte oficial`, `Metadata`, `Centro geográfico` e possivelmente `Boundary`. Isso pode ser correto para lançamento, mas não é uma medição limpa da causa raiz.

### 2. Algum peso parece desproporcional?

Sim.

O peso agregado de indicadores operacionais é alto demais para um modelo chamado de qualidade territorial:

| Grupo | Indicadores | Peso |
|---|---|---:|
| Territorial puro | Boundary, Centro, Fonte, Metadata, URLs, Integridade | 63 |
| Operacional/produto | Rollout, Conteúdo, Community, Hero, Busca | 37 |

Quase 40% do score mede maturidade do produto. Isso pode fazer uma praça com bom produto parecer territorialmente confiável, mesmo se a malha geográfica ainda for fraca.

Pontos específicos:

- `Integridade` tem peso 10, baixo para o indicador que deveria ser pré-requisito absoluto.
- `Boundary` tem peso 15, mas a escala dá 0.60 para fallback formal. Isso ainda concede 9 pontos sem polígono real.
- `Community` tem peso 8, igual a `Conteúdo` e `Rollout`, mas nem todo Territory precisa ter community para ser navegável.
- `Hero` tem peso 5, mas não deveria entrar no score territorial; deve entrar no score operacional/editorial.
- `Busca` tem peso 6, mas pode ser só consequência de filtros e conteúdo. A parte territorial da busca é "respeita escopo", não "tem resultado".

### 3. Algum indicador mede maturidade do produto em vez de qualidade territorial?

Sim. Estes indicadores são majoritariamente maturidade operacional:

| Indicador | Por que não é qualidade territorial pura |
|---|---|
| Rollout | Mede decisão de exposição do produto. O Territory pode ser perfeito e estar sem rollout por estratégia. |
| Conteúdo | Mede disponibilidade de posts, empresas, eventos e classificados. Não mede se o bairro existe corretamente. |
| Community | Mede camada social/editorial sobre o Territory. A governança diz que nem todo Territory tem Community ativa. |
| Hero | Mede apresentação editorial/visual. Não prova qualidade do dado territorial. |
| Busca | Parcialmente territorial. O filtro territorial é qualidade de integração; volume/relevância de resultado é maturidade operacional. |

Esses indicadores devem existir, mas em outro score ou em outro eixo.

### 4. O score pode produzir resultados enganosos?

Sim.

Cenários concretos:

| Cenário | Resultado enganoso |
|---|---|
| Bairro sem boundary real, mas com fallback formal, conteúdo, community, rollout e hero bons | Pode parecer pronto para ativação pública, mesmo sem delimitação oficial. |
| Cidade com ótima metadata municipal, mas bairros filhos incompletos | A cidade pode parecer lançável, enquanto a experiência real de escolha de bairros não está pronta. |
| Country/state com indicadores não aplicáveis recebendo 0.60 mínimo | O score fica artificialmente alto ou artificialmente comparável a um bairro. |
| Territory com Empty States oficiais em todos os módulos | Pode ganhar pontos em Conteúdo sem ter conteúdo real algum. |
| TerritoryGroup com membros de qualidade desigual | O grupo pode parecer bom se a média for alta, mesmo contendo um membro quebrado. |
| Rollout herdado da cidade | Pode parecer ativação intencional do bairro, quando na prática é apenas vazamento de política do ancestor. |

O problema central é que score médio mascara falhas críticas. Para lançamento, alguns critérios precisam ser gates booleanos, não apenas pontos.

### 5. Os caps são suficientes?

Não.

Os caps atuais cobrem alguns casos críticos, mas ainda permitem falso positivo em cenários importantes.

Caps ausentes ou fracos:

| Cenário | Problema | Cap recomendado |
|---|---|---|
| Neighborhood sem boundary oficial | Pode passar com fallback formal e alto score operacional. | `launch_official_allowed = false` salvo exceção formal separada do score. |
| City lançada com baixa cobertura de bairros filhos | Score da cidade não considera qualidade dos filhos. | City launch depende de cobertura mínima dos children. |
| TerritoryGroup com membro inválido | Não há regra de pior membro ou cobertura mínima. | Score do grupo deve ser limitado pelo pior membro crítico. |
| Rollout herdado sem aprovação | Pode parecer rollout válido. | Ativação pública exige rollout local ou política formal registrada. |
| Fonte oficial stale ou import antigo | Fonte existe, mas pode estar obsoleta. | Cap por `source_staleness` quando houver `synced_at`/`last_imported_at`. |
| Boundary e centro incoerentes | O centro pode estar fora do boundary/bbox. | Cap explícito para incoerência geográfica. |
| Search sem validação de vazamento | Empty State correto ganha pontos, mas vazamento não é provado ausente. | Gate de isolamento territorial para Search. |
| Módulo pausado com rollout ativo | Rollout e Empty State podem pontuar, mas o módulo não opera. | Cap operacional para módulo público pausado. |

Também falta separar "cap de score" de "bloqueio de estágio". Alguns problemas não deveriam só reduzir score; deveriam bloquear estágios específicos.

### 6. Existem situações em que um Territory deveria poder navegar, mas o score impediria?

Sim.

Exemplos:

- Um bairro oficial com fonte, path, slug e centro válidos, mas sem boundary importado, deve poder navegar com fallback transparente.
- Um state/country não precisa de conteúdo, community ou hero específico para ser navegável.
- Um district usado como fallback administrativo pode precisar navegar internamente, mesmo sem maturidade de produto.
- Um bairro recém-importado deve poder receber cadastro e navegação controlada antes de ter community e conteúdo.

O score atual pode punir esses casos porque mistura indicadores operacionais com decisão de navegação. Navegação deveria depender principalmente de integridade, URL, status, fonte mínima e fallback honesto.

### 7. Existem situações em que um Territory poderia atingir 90+ sem realmente estar pronto para lançamento?

Sim.

O risco existe principalmente por subjetividade e por exceções:

- Boundary ausente com "decisão formal excepcional" pode permitir lançamento oficial se os demais indicadores estiverem altos.
- Conteúdo "mínimo aprovado" não tem definição mensurável.
- Hero "adequado" é julgamento editorial difícil de automatizar.
- Community "coerente com o estágio" não define moderação mínima, ownership, status ou capacidade operacional.
- TerritoryGroup pode atingir nota alta sem regra clara de agregação dos membros.
- Uma cidade pode atingir score alto sem garantir que seus bairros principais estão prontos.

Para impedir 90+ enganoso, lançamento oficial precisa de uma checklist de gates duros além do score.

### 8. O modelo funciona igualmente por tipo de Territory?

Não.

| Tipo | Funcionamento atual | Problema |
|---|---|---|
| Country | Fraco | Boundary, conteúdo, community, hero e busca não têm o mesmo significado. |
| State | Fraco | Pode precisar ser navegável sem community/conteúdo; score comparável a bairro é injusto. |
| City | Parcial | Precisa considerar cobertura dos bairros filhos, não só qualidade da cidade. |
| District | Fraco | No domínio atual, district pode ser fallback/legado; modelo não distingue district público de residual. |
| Neighborhood | Melhor caso | O modelo foi claramente pensado para bairro, especialmente Salvador. |
| TerritoryGroup | Insuficiente | Falta algoritmo de agregação dos membros, regra de pior caso, cobertura e boundary de união. |

O modelo precisa de perfis por tipo. Um único conjunto de pesos para todos os tipos não é sustentável.

### 9. Existe alguma decisão difícil de automatizar?

Sim.

Decisões difíceis de automatizar:

- fonte "oficial aprovada";
- fallback "formal e transparente";
- hero "adequado";
- conteúdo "mínimo";
- community "madura";
- política de rollout "formalmente aprovada";
- exceção de lançamento sem boundary;
- qualidade visual do mapa;
- se um Empty State é aceitável para aquele estágio;
- se uma busca tem relevância local suficiente.

Essas decisões exigem campos objetivos, evidências anexadas ou aprovação manual. Sem isso, o score vira subjetivo e difícil de reproduzir.

### 10. Existe alguma regra impossível de manter conforme o projeto crescer?

Sim.

As regras mais frágeis são:

- um único peso para todos os tipos de Territory;
- pontuar indicadores não aplicáveis com mínimo 0.60;
- exigir revisão manual de "fallback formal" para muitos Territories;
- manter "conteúdo mínimo" sem definição por módulo e por estágio;
- permitir exceção formal de boundary sem um registro auditável;
- calcular TerritoryGroup sem política de agregação;
- usar um score único para decisões de dados, produto e lançamento.

Em escala, o modelo precisa ser automatizável, por tipo e por estágio. Exceções devem ser raras, rastreáveis e separadas do score.

## 3. Revisão dos indicadores

| Indicador | Manter? | Revisão recomendada |
|---|---|---|
| Boundary | Sim | Fica no score territorial. Deve ter gate específico para lançamento oficial de bairros/cidades. |
| Centro geográfico | Sim | Fica no score territorial, mas deve evitar dupla contagem com Boundary. |
| Fonte oficial | Sim | Peso deve subir ou virar gate mínimo para qualquer exposição pública. |
| Metadata | Sim | Fica no score territorial; precisa schema mínimo por tipo. |
| Rollout | Separar | Deve ir para Maturidade Operacional. |
| Conteúdo | Separar | Deve ir para Maturidade Operacional. |
| Community | Separar | Deve ir para Maturidade Operacional. |
| Hero | Separar | Deve ir para Maturidade Operacional/editorial. |
| URLs | Sim | Fica no score territorial, mas parte também é integridade. |
| Busca | Dividir | Isolamento territorial fica no score territorial; volume/relevância vai para operacional. |
| Integridade | Sim | Deve virar gate e ter peso maior no score territorial. |

## 4. Separar qualidade territorial e maturidade operacional

A separação faz sentido tecnicamente.

### 4.1 Modelo recomendado

Criar dois scores:

| Score | Mede | Indicadores |
|---|---|---|
| `Territory Data Quality Score` | Confiabilidade do dado territorial | Integridade, Fonte, Metadata, Boundary, Centro, URLs, isolamento territorial da busca |
| `Territory Operational Maturity Score` | Prontidão do produto naquele Territory | Rollout, Conteúdo, Community, Hero, módulos, busca com resultados, uso/engajamento quando existir |

O lançamento oficial deveria exigir ambos.

Exemplo de pesos para `Territory Data Quality Score`:

| Indicador | Peso |
|---|---:|
| Integridade | 20 |
| Fonte oficial | 15 |
| Metadata | 15 |
| Boundary | 20 |
| Centro geográfico | 10 |
| URLs/resolução | 15 |
| Isolamento territorial da busca | 5 |
| Total | 100 |

Exemplo de pesos para `Territory Operational Maturity Score`:

| Indicador | Peso |
|---|---:|
| Rollout | 20 |
| Conteúdo real ou Empty States oficiais | 20 |
| Community e moderação | 20 |
| Hero/editorial | 10 |
| Módulos públicos operacionais | 20 |
| Busca com cobertura/relevância | 10 |
| Total | 100 |

### 4.2 Gates por estágio com dois scores

| Estágio | Data Quality mínimo | Operational Maturity mínimo | Gates obrigatórios |
|---|---:|---:|---|
| Cadastro | 50 | 0 | Integridade mínima, fonte rastreável, selector seguro. |
| Navegação | 60 | 0 | URL canônica, status público, fallback transparente. |
| Territory Home | 70 | 40 | Empty States oficiais, módulos não quebram. |
| Ativação pública | 80 | 60 | Rollout explícito, busca isolada, sem conteúdo externo. |
| Lançamento oficial | 90 | 80 | Boundary oficial ou exceção auditada, community/hero/conteúdo aprovados. |

### 4.3 Vantagens

- Evita que conteúdo compense dado territorial ruim.
- Evita que dado territorial perfeito bloqueie cadastro por falta de community.
- Permite ativar gradualmente: primeiro SSOT, depois navegação, depois produto.
- Ajuda priorização: problemas de dados vão para Territory; problemas de produto vão para módulos.
- Reduz discussões subjetivas em auditoria.
- Facilita comparar bairros por dado territorial sem misturar popularidade.

### 4.4 Desvantagens

- Dois scores são mais difíceis de explicar que um score único.
- Requer mais disciplina nos relatórios.
- Exige definir gates por estágio.
- Pode gerar casos em que um Territory tem score territorial alto e operacional baixo, exigindo comunicação clara.
- Pode demandar dashboards ou scripts mais completos no futuro.

### 4.5 Impacto na governança

A governança fica mais alinhada ao `TERRITORY-GOVERNANCE.md`, porque Territory volta a responder por:

- hierarquia;
- resolução;
- boundary;
- metadata;
- URL;
- integridade;
- filtro territorial.

Conteúdo, Community, Hero e Rollout continuam relevantes, mas deixam de ser "qualidade territorial" e passam a ser qualidade de lançamento ou maturidade operacional.

Isso reduz risco de expandir o escopo do domínio Territory para responsabilidades que a própria governança declara como subdomínios ou camadas acima.

### 4.6 Impacto na auditoria

A auditoria passa a produzir duas matrizes:

| Matriz | Pergunta respondida |
|---|---|
| Data Quality | Este Territory é confiável como unidade territorial? |
| Operational Maturity | Este Territory está pronto para ser usado pelo público? |

Isso torna relatórios como Salvador mais úteis. Um bairro poderia aparecer como:

- `Data Quality: 82`, `Operational Maturity: 25`: bom dado, produto ainda vazio.
- `Data Quality: 55`, `Operational Maturity: 80`: produto com tração, dado territorial precisa saneamento.
- `Data Quality: 92`, `Operational Maturity: 86`: candidato real a lançamento oficial.

### 4.7 Impacto na evolução do produto

A evolução fica mais escalável:

- novos bairros podem entrar no SSOT e cadastro antes de terem community;
- importação de boundaries melhora Data Quality sem depender de conteúdo;
- campanhas de conteúdo melhoram Operational Maturity sem mexer no domínio Territory;
- segunda cidade pode ser auditada por dados mesmo antes de existir operação comercial;
- TerritoryGroup pode ter regra própria de agregação sem distorcer bairros individuais.

## 5. Ajustes necessários antes de oficializar

### Ajuste 1: dividir o score em dois eixos

O documento deve substituir o score único por:

- `Territory Data Quality Score`;
- `Territory Operational Maturity Score`.

Um terceiro campo pode existir como síntese de estágio permitido, mas não como média simples.

### Ajuste 2: criar perfis por tipo de Territory

Cada tipo precisa de perfil próprio:

- Country;
- State;
- City;
- District;
- Neighborhood;
- TerritoryGroup.

Não usar mínimo 0.60 para indicador não aplicável. O correto é renormalizar pesos por perfil ou marcar N/A como fora do denominador, com caps específicos por estágio.

### Ajuste 3: transformar integridade em gate duro

Integridade não deve ser apenas 10 pontos.

Se houver path inválido, parent errado, slug conflitante, FK órfã ou status contraditório, o Territory não deve navegar publicamente, independentemente do score.

### Ajuste 4: definir regras de agregação para City e TerritoryGroup

Para City:

- score próprio da cidade;
- cobertura mínima dos neighborhoods filhos;
- regra de bloqueio se filhos críticos estiverem inválidos.

Para TerritoryGroup:

- score próprio do grupo;
- score dos membros;
- cap pelo pior membro crítico;
- percentual mínimo de membros com boundary/centro/fonte válidos.

### Ajuste 5: separar fallback de boundary oficial

Fallback deve permitir navegação, mas não deve contar como boundary real para lançamento oficial.

Recomendação:

- fallback pode pontuar em navegação;
- fallback não libera lançamento oficial sem exceção registrada;
- exceção não aumenta score, apenas autoriza estágio sob justificativa.

### Ajuste 6: tornar caps específicos por estágio

Nem todo cap deve limitar o score inteiro. Alguns devem bloquear apenas estágios.

Exemplo:

- sem boundary oficial: pode navegar, mas não lança oficialmente;
- sem community: pode ter Territory Home, mas não campanha comunitária;
- rollout herdado: pode navegar, mas não ativação pública sem política aprovada;
- busca vazando: bloqueia ativação pública e lançamento.

### Ajuste 7: definir evidências automatizáveis

Cada nota precisa de evidência objetiva:

- campo esperado;
- tabela fonte;
- consulta;
- condição de aprovação;
- responsável por exceção;
- data de validade.

Sem evidência, a auditoria vira interpretação manual.

### Ajuste 8: remover maturidade editorial do domínio Territory

Hero específico, conteúdo mínimo e community madura devem ser descritos como dependências de lançamento, não como qualidade territorial.

O Territory pode expor dados necessários para esses módulos, mas não deve ser responsável por julgar maturidade editorial.

### Ajuste 9: definir mínimo de conteúdo fora do score territorial

Conteúdo mínimo deve ser definido por módulo:

- Feed;
- Empresas;
- Serviços;
- Gastronomia;
- Eventos;
- Busca;
- Classificados;
- Mobilidade.

Esse checklist pertence à maturidade operacional, não ao score territorial.

### Ajuste 10: explicitar que score não substitui bloqueios

O documento deve declarar que score é diagnóstico, não autorização automática.

Autorização de estágio deve seguir:

```text
stage_allowed =
  score_threshold_met &&
  required_gates_met &&
  no_blockers_for_stage &&
  exceptions_valid_if_any
```

## 6. Modelo revisado recomendado

### 6.1 Data Quality Score

```text
territory_data_quality_score =
  round(
    integrity_score * 20 +
    official_source_score * 15 +
    metadata_score * 15 +
    boundary_score * 20 +
    center_score * 10 +
    urls_score * 15 +
    search_isolation_score * 5
  )
```

### 6.2 Operational Maturity Score

```text
territory_operational_maturity_score =
  round(
    rollout_score * 20 +
    content_score * 20 +
    community_score * 20 +
    hero_score * 10 +
    module_readiness_score * 20 +
    search_coverage_score * 10
  )
```

### 6.3 Estágio permitido

```text
stage_allowed =
  highest_stage_where(
    data_quality_score >= required_data_quality &&
    operational_maturity_score >= required_operational_maturity &&
    all_required_gates_are_true &&
    no_stage_blocker_is_present
  )
```

## 7. Conclusão

O modelo atual é uma boa primeira versão de checklist, mas ainda não é um padrão oficial seguro.

Ele deve ser ajustado antes da adoção porque:

- mistura qualidade de dados com maturidade operacional;
- usa pesos iguais para tipos territoriais diferentes;
- permite pontuação em indicadores não aplicáveis;
- dá pontos demais para fallback;
- não define agregação de City e TerritoryGroup;
- usa critérios subjetivos difíceis de auditar;
- permite falsos positivos em lançamento oficial;
- pode gerar falsos negativos para navegação/cadastro.

## 8. Resposta final da revisão

**O modelo ainda precisa de ajustes.**

Ajustes obrigatórios antes de transformá-lo em padrão oficial:

1. Separar `Territory Data Quality Score` de `Territory Operational Maturity Score`.
2. Criar perfis de peso por tipo: Country, State, City, District, Neighborhood e TerritoryGroup.
3. Transformar integridade, URL canônica, fonte mínima e isolamento territorial em gates duros por estágio.
4. Remover o mínimo 0.60 para indicadores não aplicáveis e substituir por pesos por perfil ou renormalização auditável.
5. Definir agregação de qualidade para City e TerritoryGroup, incluindo cap por membro crítico.
6. Impedir lançamento oficial com fallback de boundary sem exceção auditada fora do score.
7. Mover conteúdo, community, hero, rollout e maturidade de módulos para o score operacional.
8. Definir evidências objetivas para cada nota e separar decisões manuais de cálculo automático.
