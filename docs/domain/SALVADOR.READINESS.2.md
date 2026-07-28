# SALVADOR.READINESS.2

**Data da auditoria:** 2026-07-25
**Escopo:** 170 bairros municipais oficiais de Salvador
**Base normativa:** `docs/domain/TERRITORY-GOVERNANCE.md`
**Base anterior:** `docs/domain/SALVADOR-READINESS-REPORT.md` e `docs/domain/SALVADOR-IMPLEMENTATION-1-REPORT.md`
**Natureza:** auditoria somente leitura. Nenhum boundary foi importado e nenhuma arquitetura, tabela ou contrato foi alterado.

## Resumo executivo

Salvador possui 170 registros municipais oficiais ativos, todos resolvíveis como `neighborhood` sob a cidade canônica `/br/ba/salvador`. A identidade estrutural está consistente: `parent_id`, `geographic_path`, slug canônico, status, metadados de fonte e estatísticas passaram a validação.

Isso não significa que Salvador esteja pronta para operar com a mesma experiência em todos os bairros. A classificação estrita desta sprint é:

| Status | Quantidade | Leitura |
|---|---:|---|
| `READY` | 0 | Nenhum bairro satisfaz simultaneamente a qualidade de coordenadas e a cobertura geográfica exigidas para experiência uniforme. |
| `PENDENTE` | 160 | Identidade utilizável, mas coordenadas sem fonte explícita, herdadas com refinamento pendente ou de baixa confiança. |
| `INCOMPLETO` | 10 | Coordenadas sem alerta de qualidade, mas sem boundary próprio; o mapa depende de fallback. |
| `BLOQUEADO` | 0 | Nenhum dos 170 bairros oficiais possui erro estrutural que impeça a resolução da rota. |

A interpretação operacional é importante:

- **Roteamento e Territory Home:** os 170 bairros conseguem resolver a rota e renderizar a superfície genérica com dados reais ou Empty States.
- **Ativação plena e uniforme:** Salvador ainda não está pronta. Todos os 170 dependem de alguma pendência de qualidade geográfica ou de cobertura de boundary.
- **Fallback:** é aceitável para manter a rota funcionando, mas não é equivalente ao mapa com limite oficial do bairro.
- **Rollout:** o mecanismo de herança funciona, mas os 170 bairros não possuem rollout local; eles herdam os módulos ativos da cidade. Isso não configura ativação gradual por bairro.

## Critérios e legenda da matriz

Cada linha da matriz representa um bairro municipal oficial. Os critérios estruturais abaixo foram validados para os 170 bairros e, por isso, não são repetidos como uma coluna de valor diferente em cada linha:

- `HIER`: `parent_id` aponta para a cidade canônica, `type = neighborhood`, `status = active` e `geographic_path` é `/br/ba/salvador/<slug>`.
- `SLUG`: slug estável, minúsculo, sem acentos e equivalente ao nome normalizado.
- `META/STAT`: fonte, nível da fonte, URL, identificador do objeto, `area_m2`, `perimeter_m` e `boundary_bbox` presentes e válidos.
- `ROLL`: `INH-CID` significa que o módulo é resolvido pelo rollout ativo da cidade; não há override local para os 170 bairros.
- `HOME/HERO`: `GEN` significa que a Territory Home genérica pode renderizar o bairro sem uma imagem ou registro editorial específico. A ausência de imagem é permitida; nenhum dos 170 tem chave de hero/imagem em `locations.metadata`.
- `Coord.`: `SEM-FONTE` = centro numérico válido, mas sem `coordinates_source`; `HERDADA+REF` = centro herdado e `coordinates_needs_refinement = true`; `NOMINATIM/BAIXA` = fonte Nominatim com confiança baixa; `NOMINATIM/MEDIA` = fonte Nominatim com confiança média.
- `Boundary`: `SIM` indica registro em `location_boundaries`; `NAO` indica ausência e uso de fallback.

### Regra de classificação

1. Erro de identidade, hierarquia, slug, caminho, status ou coordenada inválida: `BLOQUEADO`.
2. Coordenada com fonte ausente, herança marcada para refinamento ou confiança baixa: `PENDENTE`.
3. Coordenada sem alerta de qualidade, mas sem boundary próprio: `INCOMPLETO`.
4. Todos os critérios acima atendidos, incluindo boundary: `READY`.

Boundary não foi tratado como alteração nesta sprint. Ele aparece na classificação porque a missão pede verificar se os bairros têm a mesma experiência geográfica. O fallback mantém a aplicação funcional, mas impede classificar o bairro como pronto para experiência uniforme.

## Auditoria do SSOT

### Identidade, hierarquia e URLs

Resultado para os 170 bairros oficiais:

| Verificação | Resultado |
|---|---:|
| Bairros municipais oficiais | 170 |
| Ativos | 170 |
| `type = neighborhood` | 170 |
| Pai igual à cidade canônica de Salvador | 170 |
| `geographic_path` canônico | 170 |
| Slug canônico | 170 |
| Caminhos duplicados ou inválidos | 0 |
| Coordenadas numéricas fora do intervalo | 0 |
| Estatísticas ausentes ou inválidas | 0 |

Não há dependência de código específico de bairro na resolução dos 170 registros. A rota é derivada do Territory resolvido e os módulos públicos recebem `resolved` e, quando aplicável, `activeMemberIds`.

### Metadata e estatísticas

Os 170 registros possuem os campos necessários de proveniência territorial: `source`, `source_level`, `source_url`, `source_object_id`, `boundary_bbox`, `area_m2`, `perimeter_m`, `center_latitude` e `center_longitude`.

O problema não é ausência de centro numérico. O problema é a qualidade da evidência desse centro:

| Indicador | Quantidade |
|---|---:|
| Centro numérico válido | 170 |
| `coordinates_source` ausente | 94 |
| `coordinates_needs_refinement = true` | 57 |
| Confiança `low` | 9 |
| Sem nenhum desses alertas | 10 |

Os indicadores se sobrepõem. Por isso, a união dos bairros com pendência de coordenadas é 160, e não a soma simples dos indicadores.

### Hero e imagens

O modelo atual não exige uma imagem por bairro para abrir a Territory Home. O hero genérico é produzido pela própria superfície territorial e os cards usam dados de queries SSOT ou Empty States oficiais.

No SSOT dos 170 bairros não existem chaves `hero`, `image`, `cover`, `banner` ou equivalentes. Isso é aceitável como imagem opcional. Não é aceitável caso o produto passe a exigir identidade editorial exclusiva por bairro sem criar o respectivo conteúdo no SSOT.

Há duas comunidades em Salvador:

- `Achegue-se Complexo`, ativa, do tipo `territorial_group`, com os quatro bairros do Complexo como membros.
- `Achegue-se Pituba`, `coming_soon`, do tipo `neighborhood`.

Os demais bairros não possuem uma Community própria. A Territory Home genérica funciona sem ela; o portal comunitário específico não está preparado como conteúdo editorial para cada bairro.

## Mapa e boundaries

### Cobertura atual

Existem 4 boundaries oficiais associados a bairros municipais de Salvador. Os quatro são GeoJSON `Polygon`, têm centro, fonte GeoSalvador, URL e `source_object_id`:

| Bairro | Boundary |
|---|---|
| Chapada do Rio Vermelho | Presente |
| Nordeste de Amaralina | Presente |
| Santa Cruz | Presente |
| Vale das Pedrinhas | Presente |

Resultado da auditoria:

- 4/170 com boundary próprio.
- 166/170 sem registro em `location_boundaries`.
- 0 boundary órfão apontando para Territory inexistente.
- 0 boundary dos quatro registros com geometria inválida detectada nesta consulta.
- 166 bairros dependem de fallback para a visualização geográfica.

### Fallback

O `BoundaryService` prioriza boundary customizado e fontes oficiais configuradas no metadata; quando não há polígono, há fallback por centro/proximidade. O fallback é aceitável para:

- não quebrar a rota;
- manter o mapa navegável;
- apresentar um bairro ainda não coberto pela malha oficial;
- manter a resolução territorial sem inventar um polígono.

O fallback não é aceitável como equivalência visual ao limite municipal do bairro. Ele não deve ser apresentado como se fosse a delimitação oficial.

### Pipeline de importação

Existe o contrato de persistência e consumo (`location_boundaries`, `BoundaryService`, fonte FeatureServer declarada em metadata e validações de GeoJSON). Não foi encontrado um pipeline batch operacional que importe e valide os 166 polygons restantes em lote. A documentação geoespacial ainda registra a importação das malhas oficiais como etapa futura.

Conclusão: a arquitetura suporta a expansão, mas a operação de importação dos demais boundaries ainda é uma atividade de dados separada.

## Rollout

O SSOT atual contém 16 registros em `module_rollouts`, dos quais 9 estão ativos para a cidade canônica de Salvador. Não há rollout local associado a nenhum dos 170 bairros.

O contrato de resolução está correto e segue a precedência:

1. rollout local do Territory;
2. rollout do ancestor ativo mais próximo;
3. default inativo.

Logo, qualquer bairro pode receber um override sem código específico, mas atualmente todos herdam o rollout ativo da cidade. A auditoria encontrou os seguintes efeitos:

- o mecanismo é escalável;
- a herança funciona por Territory;
- a cidade está expondo a política ativa aos bairros por herança;
- não existe uma ativação gradual efetivamente configurada bairro a bairro;
- não existe campo `rollout_status` em `locations`; a chave operacional é `module_rollouts` e seu status por módulo.

Para uma expansão gradual, o procedimento deverá configurar o rollout do bairro antes de expô-lo, sem depender de condicionais por nome, cidade ou slug.

## Conteúdo e referências

Os dados abaixo são a cobertura de registros com `location_id` em Salvador, não uma exigência de que cada bairro tenha conteúdo antes de abrir. Empty States oficiais são permitidos.

| Domínio | Bairros com conteúdo em Salvador | Registros em bairros de Salvador | Observação |
|---|---:|---:|---|
| Feed (`posts`) | 5 | 7 | Barra, Chapada do Rio Vermelho, Nordeste de Amaralina, Santa Cruz e Vale das Pedrinhas. |
| Community posts | 0 | 0 | Nenhum registro no SSOT consultado. |
| Empresas (`business_data`) | 7 | 89 | Acupe, Barra, Itaigara, Nordeste de Amaralina, Pituba, Rio Vermelho e Santa Cruz. |
| Serviços (`professional_data`) | 3 | 4 | Chapada do Rio Vermelho, Nordeste de Amaralina e Pituba. |
| Gastronomia | 6 | 6 perfis | Acupe, Barra, Itaigara, Nordeste de Amaralina, Pituba e Rio Vermelho. |
| Eventos | 4 | 6 | Chapada do Rio Vermelho, Nordeste de Amaralina, Santa Cruz e Vale das Pedrinhas. |
| Classificados | 7 | 12 | Barra, Brotas, Cabula, Itaigara, Nordeste de Amaralina, Pituba e Rio Vermelho. |
| Vagas | 2 | 2 | Chapada do Rio Vermelho e Nordeste de Amaralina. |

Foram encontrados dados fora do escopo municipal de Salvador em tabelas de conteúdo:

- 2 `business_data` apontam para locations válidos de Bessa, em Conceição do Jacuípe, e Centro, em Lauro de Freitas.
- 2 `classifieds` apontam para locations válidos de Bahia e Brasil.

Essas quatro referências não são órfãs de FK, mas são referências fora da cidade auditada. Devem permanecer fora dos filtros de Salvador; não podem aparecer como conteúdo de um bairro de Salvador.

## Auditoria dos módulos públicos

| Módulo | Rota e filtro territorial | Loading / Empty State / CTA | Status |
|---|---|---|---|
| Territory Home | Usa contexto territorial, `useModuleTerritoryFilter`, filtro de eventos e URLs derivadas do Territory. | Home usa queries reais, estados vazios e CTAs contextuais. | **Parcialmente pronto** |
| Feed | Comunidade recebe `resolved` e `activeMemberIds`; posts são filtrados por location. | Gate e loader existem; bairros sem posts podem abrir Empty State. | **Parcialmente pronto** |
| Empresas | `TerritorialBusinessPage` passa Territory e membros ativos para `EmpresasPage`. | Dados reais e Empty State; cobertura em 7/170 bairros. | **Parcialmente pronto** |
| Serviços | `TerritorialServicesPage` passa Territory e membros ativos para `ServicosPage`. | Dados reais e Empty State; cobertura em 3/170 bairros. | **Parcialmente pronto** |
| Gastronomia | Rota territorial usa `GastronomyPage` e `useModuleTerritoryFilter`. | Rota e estados existem; cobertura em 6/170 bairros. | **Parcialmente pronto** |
| Eventos | `EventsListPage` recebe `resolved` e `activeMemberIds` e usa filtro próprio. | Loader e Empty State existem; cobertura em 4/170 bairros. | **Parcialmente pronto** |
| Busca | Rotas territoriais passam pelo `TerritorialSearchPage` e gate de busca. | Busca funciona com Territory resolvido, mas a disponibilidade é calculada por rollout e o conteúdo é esparso. | **Parcialmente pronto** |
| Mobilidade | Wrapper territorial existe, mas `MobilidadePage` é `createLaunchPausedRoute('Mobilidade')`. | Gate de rollout existe, porém a experiência pública permanece pausada. | **Não pronto** |
| Classificados | `ClassificadosPage` e hooks recebem Territory e `activeMemberIds`. | Conteúdo real e Empty State; cobertura em 7/170 bairros. | **Parcialmente pronto** |
| Explorar | Cards e ações da Home são derivados dos módulos ativos do rollout. | Não há card mockado; a disponibilidade herda a cidade e os dados são esparsos. | **Parcialmente pronto** |

### URLs e navegação

Nas superfícies territoriais resolvidas, as URLs de módulo são construídas com `territoryUrls`, `useAppUrls`, `useCommunityUrls` e `useModuleUrls`. Os CTAs do gate calculam a base a partir de `resolved`, inclusive para grupos.

Ainda existem fallbacks globais `LAUNCH_URLS` em hooks de URL para situações sem contexto territorial ou com caminho inválido. Eles não são usados no caminho nominal de um Territory resolvido, mas permanecem como risco para qualquer fluxo que perca o contexto. Isso deve ser tratado antes de declarar a navegação completamente independente de launch hardcodes.

### Mock data

Não foi encontrado conteúdo mockado no runtime da Territory Home auditada. Os itens da Home são derivados de posts, empresas e eventos retornados pelas queries; quando não há dados, os blocos são omitidos ou usam Empty States.

Existem mocks em testes e providers legados do repositório, mas eles não foram contabilizados como dados públicos da Territory Home. Também existem placeholders de formulário, que não são dados falsos.

## Matriz bairro por bairro

Os 170 bairros abaixo estão confirmados no SSOT municipal oficial. `HIER`, `SLUG` e `META/STAT` estão `OK` em todas as linhas; `ROLL = INH-CID` em todas as linhas; `HOME/HERO = GEN` em todas as linhas. A coluna `Coord.` e a presença de boundary explicam a classificação.

| # | Bairro | Slug | HIER/SLUG/META | Coord. | ROLL | HOME/HERO | Boundary | Status |
|---:|---|---|:---:|---|---|---|:---:|---|
| 1 | Acupe | `acupe` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 2 | Aeroporto | `aeroporto` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 3 | Águas Claras | `aguas-claras` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 4 | Alto da Terezinha | `alto-da-terezinha` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 5 | Alto das Pombas | `alto-das-pombas` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 6 | Alto do Cabrito | `alto-do-cabrito` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 7 | Alto do Coqueirinho | `alto-do-coqueirinho` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 8 | Amaralina | `amaralina` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 9 | Areia Branca | `areia-branca` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 10 | Arenoso | `arenoso` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 11 | Arraial do Retiro | `arraial-do-retiro` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 12 | Bairro da Paz | `bairro-da-paz` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 13 | Baixa de Quintas | `baixa-de-quintas` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 14 | Barbalho | `barbalho` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 15 | Barra | `barra` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 16 | Barreiras | `barreiras` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 17 | Barris | `barris` | OK | NOMINATIM/MEDIA | INH-CID | GEN | NAO | **INCOMPLETO** |
| 18 | Beiru/Tancredo Neves | `beiru-tancredo-neves` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 19 | Boa Viagem | `boa-viagem` | OK | NOMINATIM/MEDIA | INH-CID | GEN | NAO | **INCOMPLETO** |
| 20 | Boa Vista de Brotas | `boa-vista-de-brotas` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 21 | Boa Vista de São Caetano | `boa-vista-de-sao-caetano` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 22 | Boca da Mata | `boca-da-mata` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 23 | Boca do Rio | `boca-do-rio` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 24 | Bom Juá | `bom-jua` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 25 | Bonfim | `bonfim` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 26 | Brotas | `brotas` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 27 | Cabula | `cabula` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 28 | Cabula VI | `cabula-vi` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 29 | Caixa D´Água | `caixa-d-agua` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 30 | Cajazeiras II | `cajazeiras-ii` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 31 | Cajazeiras IV | `cajazeiras-iv` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 32 | Cajazeiras V | `cajazeiras-v` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 33 | Cajazeiras VI | `cajazeiras-vi` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 34 | Cajazeiras VII | `cajazeiras-vii` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 35 | Cajazeiras VIII | `cajazeiras-viii` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 36 | Cajazeiras X | `cajazeiras-x` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 37 | Cajazeiras XI | `cajazeiras-xi` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 38 | Calabar | `calabar` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 39 | Calabetão | `calabetao` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 40 | Calçada | `calcada` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 41 | Caminho das Árvores | `caminho-das-arvores` | OK | NOMINATIM/MEDIA | INH-CID | GEN | NAO | **INCOMPLETO** |
| 42 | Caminho de Areia | `caminho-de-areia` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 43 | Campinas de Pirajá | `campinas-de-piraja` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 44 | Canabrava | `canabrava` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 45 | Candeal | `candeal` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 46 | Canela | `canela` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 47 | Capelinha | `capelinha` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 48 | Cassange | `cassange` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 49 | Castelo Branco | `castelo-branco` | OK | NOMINATIM/BAIXA | INH-CID | GEN | NAO | **PENDENTE** |
| 50 | Centro | `centro` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 51 | Centro Administrativo da Bahia | `centro-administrativo-da-bahia` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 52 | Centro Histórico | `centro-historico` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 53 | Chame-Chame | `chame-chame` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 54 | Chapada do Rio Vermelho | `chapada-do-rio-vermelho` | OK | SEM-FONTE | INH-CID | GEN | SIM | **PENDENTE** |
| 55 | Cidade Nova | `cidade-nova` | OK | NOMINATIM/BAIXA | INH-CID | GEN | NAO | **PENDENTE** |
| 56 | Colinas de Periperi | `colinas-de-periperi` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 57 | Comércio | `comercio` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 58 | Cosme de Farias | `cosme-de-farias` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 59 | Costa Azul | `costa-azul` | OK | NOMINATIM/BAIXA | INH-CID | GEN | NAO | **PENDENTE** |
| 60 | Coutos | `coutos` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 61 | Curuzu | `curuzu` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 62 | Dois de Julho | `dois-de-julho` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 63 | Dom Avelar | `dom-avelar` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 64 | Doron | `doron` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 65 | Engenho Velho da Federação | `engenho-velho-da-federacao` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 66 | Engenho Velho de Brotas | `engenho-velho-de-brotas` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 67 | Engomadeira | `engomadeira` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 68 | Fazenda Coutos | `fazenda-coutos` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 69 | Fazenda Grande do Retiro | `fazenda-grande-do-retiro` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 70 | Fazenda Grande I | `fazenda-grande-i` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 71 | Fazenda Grande II | `fazenda-grande-ii` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 72 | Fazenda Grande III | `fazenda-grande-iii` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 73 | Fazenda Grande IV | `fazenda-grande-iv` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 74 | Federação | `federacao` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 75 | Garcia | `garcia` | OK | NOMINATIM/MEDIA | INH-CID | GEN | NAO | **INCOMPLETO** |
| 76 | Graça | `graca` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 77 | Granjas Rurais Presidente Vargas | `granjas-rurais-presidente-vargas` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 78 | Horto Florestal | `horto-florestal` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 79 | IAPI | `iapi` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 80 | Ilha Amarela | `ilha-amarela` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 81 | Ilha de Bom Jesus dos Passos | `ilha-de-bom-jesus-dos-passos` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 82 | Ilha de Maré | `ilha-de-mare` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 83 | Ilha dos Frades/Ilha de Santo Antônio | `ilha-dos-frades-ilha-de-santo-antonio` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 84 | Imbuí | `imbui` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 85 | Itacaranha | `itacaranha` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 86 | Itaigara | `itaigara` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 87 | Itapuã | `itapua` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 88 | Itinga | `itinga` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 89 | Jaguaripe I | `jaguaripe-i` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 90 | Jardim Armação | `jardim-armacao` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 91 | Jardim Cajazeiras | `jardim-cajazeiras` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 92 | Jardim das Margaridas | `jardim-das-margaridas` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 93 | Jardim Nova Esperança | `jardim-nova-esperanca` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 94 | Jardim Santo Inácio | `jardim-santo-inacio` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 95 | Lapinha | `lapinha` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 96 | Liberdade | `liberdade` | OK | NOMINATIM/MEDIA | INH-CID | GEN | NAO | **INCOMPLETO** |
| 97 | Lobato | `lobato` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 98 | Luiz Anselmo | `luiz-anselmo` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 99 | Macaúbas | `macaubas` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 100 | Mangueira | `mangueira` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 101 | Marechal Rondon | `marechal-rondon` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 102 | Mares | `mares` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 103 | Massaranduba | `massaranduba` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 104 | Mata Escura | `mata-escura` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 105 | Matatu | `matatu` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 106 | Mirantes de Periperi | `mirantes-de-periperi` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 107 | Monte Serrat | `monte-serrat` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 108 | Moradas da Lagoa | `moradas-da-lagoa` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 109 | Mussurunga | `mussurunga` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 110 | Narandiba | `narandiba` | OK | NOMINATIM/BAIXA | INH-CID | GEN | NAO | **PENDENTE** |
| 111 | Nazaré | `nazare` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 112 | Nordeste de Amaralina | `nordeste-de-amaralina` | OK | SEM-FONTE | INH-CID | GEN | SIM | **PENDENTE** |
| 113 | Nova Brasília | `nova-brasilia` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 114 | Nova Constituinte | `nova-constituinte` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 115 | Nova Esperança | `nova-esperanca` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 116 | Nova Sussuarana | `nova-sussuarana` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 117 | Novo Horizonte | `novo-horizonte` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 118 | Novo Marotinho | `novo-marotinho` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 119 | Ondina | `ondina` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 120 | Palestina | `palestina` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 121 | Paripe | `paripe` | OK | NOMINATIM/BAIXA | INH-CID | GEN | NAO | **PENDENTE** |
| 122 | Patamares | `patamares` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 123 | Pau da Lima | `pau-da-lima` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 124 | Pau Miúdo | `pau-miudo` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 125 | Periperi | `periperi` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 126 | Pernambués | `pernambues` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 127 | Pero Vaz | `pero-vaz` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 128 | Piatã | `piata` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 129 | Pirajá | `piraja` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 130 | Pituaçu | `pituacu` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 131 | Pituba | `pituba` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 132 | Plataforma | `plataforma` | OK | NOMINATIM/BAIXA | INH-CID | GEN | NAO | **PENDENTE** |
| 133 | Porto Seco Pirajá | `porto-seco-piraja` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 134 | Praia Grande | `praia-grande` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 135 | Resgate | `resgate` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 136 | Retiro | `retiro` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 137 | Ribeira | `ribeira` | OK | NOMINATIM/MEDIA | INH-CID | GEN | NAO | **INCOMPLETO** |
| 138 | Rio Sena | `rio-sena` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 139 | Rio Vermelho | `rio-vermelho` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 140 | Roma | `roma` | OK | NOMINATIM/MEDIA | INH-CID | GEN | NAO | **INCOMPLETO** |
| 141 | Saboeiro | `saboeiro` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 142 | Santa Cruz | `santa-cruz` | OK | SEM-FONTE | INH-CID | GEN | SIM | **PENDENTE** |
| 143 | Santa Luzia | `santa-luzia` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 144 | Santa Mônica | `santa-monica` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 145 | Santo Agostinho | `santo-agostinho` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 146 | Santo Antônio | `santo-antonio` | OK | NOMINATIM/MEDIA | INH-CID | GEN | NAO | **INCOMPLETO** |
| 147 | São Caetano | `sao-caetano` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 148 | São Cristóvão | `sao-cristovao` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 149 | São Gonçalo | `sao-goncalo` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 150 | São João do Cabrito | `sao-joao-do-cabrito` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 151 | São Marcos | `sao-marcos` | OK | NOMINATIM/BAIXA | INH-CID | GEN | NAO | **PENDENTE** |
| 152 | São Rafael | `sao-rafael` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 153 | São Tomé | `sao-tome` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 154 | Saramandaia | `saramandaia` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 155 | Saúde | `saude` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 156 | Sete de Abril | `sete-de-abril` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 157 | Stella Maris | `stella-maris` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 158 | STIEP | `stiep` | OK | NOMINATIM/BAIXA | INH-CID | GEN | NAO | **PENDENTE** |
| 159 | Sussuarana | `sussuarana` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 160 | Tororó | `tororo` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 161 | Trobogy | `trobogy` | OK | NOMINATIM/MEDIA | INH-CID | GEN | NAO | **INCOMPLETO** |
| 162 | Uruguai | `uruguai` | OK | NOMINATIM/MEDIA | INH-CID | GEN | NAO | **INCOMPLETO** |
| 163 | Vale das Pedrinhas | `vale-das-pedrinhas` | OK | SEM-FONTE | INH-CID | GEN | SIM | **PENDENTE** |
| 164 | Vale dos Lagos | `vale-dos-lagos` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 165 | Valéria | `valeria` | OK | NOMINATIM/BAIXA | INH-CID | GEN | NAO | **PENDENTE** |
| 166 | Vila Canária | `vila-canaria` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 167 | Vila Laura | `vila-laura` | OK | HERDADA+REF | INH-CID | GEN | NAO | **PENDENTE** |
| 168 | Vila Ruy Barbosa\\Jardim Cruzeiro | `vila-ruy-barbosa-jardim-cruzeiro` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 169 | Vista Alegre | `vista-alegre` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |
| 170 | Vitória | `vitoria` | OK | SEM-FONTE | INH-CID | GEN | NAO | **PENDENTE** |

## Resíduos e bloqueios fora da matriz oficial

Os 170 bairros municipais não têm bloqueio estrutural. Ainda assim, o conjunto territorial de Salvador contém resíduos que afetam a segurança da ativação pública:

- `Pelourinho` está **ativo** como `neighborhood`, mas não possui `source_level = municipal_neighborhood` e carrega `deactivation_reason = municipal_neighborhood_source_not_found`. Isso contradiz a política de fonte municipal e pode permitir acesso por URL direta.
- O registro residual `Salvador` do tipo `district` está inativo com `deactivation_reason = ibge_district_residual_not_public_neighborhood`. Esse resíduo não está público, mas deve continuar monitorado.
- Há 22 registros legados do tipo `district` inativos e fora da fonte municipal. Eles não fazem parte da matriz dos 170 e não devem voltar a ser selecionáveis.

O resíduo ativo de `Pelourinho` é o único bloqueio imediato de higiene do SSOT identificado nesta auditoria. Não foi alterado nesta sprint porque o escopo solicitado é auditoria.

## Plano de ativação gradual

### Fase 0: fechar a integridade antes de expor novos bairros

1. Desativar/corrigir o resíduo ativo de `Pelourinho` conforme a governança vigente.
2. Garantir que referências de conteúdo fora de Salvador não entrem nos filtros territoriais da cidade.
3. Definir a política operacional de rollout: cidade ativa como fallback ou override local obrigatório antes da abertura.
4. Remover o uso de fallback global de URL quando existir um Territory inválido ou ausente em fluxo que deveria ser territorial.

### Fase 1: qualidade territorial

1. Preencher `coordinates_source` para os 94 bairros sem fonte explícita.
2. Substituir os 57 centros herdados marcados para refinamento por centros canônicos do bairro.
3. Revisar os 9 registros de confiança baixa.
4. Reexecutar a matriz; qualquer divergência de nome, slug, parent ou path deve bloquear a ativação do registro específico.

### Fase 2: boundaries

1. Operacionalizar o pipeline de importação dos polygons municipais.
2. Importar e validar os 166 bairros sem boundary, preservando fonte, URL e object id.
3. Validar GeoJSON, fechamento de anéis, centro dentro do bbox e ausência de boundaries órfãos.
4. Reexecutar os testes do `BoundaryService` e uma verificação visual dos mapas em desktop e mobile.

### Fase 3: conteúdo e rollout

1. Para cada bairro, confirmar que Feed, Empresas, Serviços, Gastronomia, Eventos, Busca e Classificados abrem com conteúdo real ou Empty State oficial.
2. Não exigir conteúdo mínimo artificial; exigir que nenhum dado de outro Territory seja apresentado.
3. Criar/alterar rollout por Territory, sem condicionais de cidade ou bairro no código.
4. Manter Mobilidade como `Não pronto` até existir uma página operacional; não ativar apenas porque o rollout da cidade está `active`.

### Critério de entrada de um bairro

Um bairro pode entrar em ativação gradual quando:

- estiver na fonte municipal canônica e com identidade estrutural válida;
- tiver coordenadas com fonte e sem refinamento pendente;
- tiver boundary importado ou uma decisão formal de fallback documentada para o estágio;
- todos os módulos públicos abrirem por URL territorial, com loader, Empty State e CTA contextual;
- não houver conteúdo fora do Territory no resultado;
- o rollout local ou a política de herança estiver explicitamente aprovada;
- nenhuma URL direta escapar para outro bairro, cidade ou `LAUNCH_URLS`.

## Respostas finais

### 1. Salvador pode operar inteira hoje?

**Não como experiência uniforme e completa.** Os 170 bairros são resolvíveis e a Territory Home genérica pode operar com dados reais/Empty States, mas há 160 pendências de coordenadas, 166 bairros sem boundary próprio, conteúdo muito concentrado e Mobilidade pausada. Além disso, `Pelourinho` permanece como resíduo ativo fora da fonte oficial.

### 2. O que falta para todos os bairros terem a mesma experiência?

Faltam a normalização da proveniência dos centros, o refinamento de coordenadas herdadas/baixa confiança, a importação dos 166 boundaries, a política efetiva de rollout por bairro, o saneamento das referências fora do escopo e a operação dos módulos que ainda estão pausados ou sem cobertura editorial.

### 3. Quais módulos ainda diferenciam o Complexo dos demais bairros?

O Complexo possui a única Community ativa de Salvador, grupo territorial com quatro membros, os quatro boundaries disponíveis e a maior concentração de conteúdo operacional. Os demais bairros têm apenas a camada genérica de Territory e, quando não há conteúdo, Empty States. Pituba possui uma Community `coming_soon`, não ativa.

Isso não significa que somente o Complexo foi auditado: a matriz acima cobre os 170 bairros oficiais e mostra os mesmos critérios para cada um.

### 4. Existe algum bairro que ainda exigiria desenvolvimento antes de ser ativado?

**Nenhum dos 170 exige código específico de bairro para a Territory Home, rotas ou filtros territoriais básicos.** Todos exigem preparação de dados em algum grau para uma experiência uniforme. Para ativação plena, há trabalho comum de dados e operação, não desenvolvimento ad hoc por nome.

O bloqueio de desenvolvimento é transversal: **Mobilidade não está pronta para qualquer bairro**, independentemente do rollout. O resíduo ativo de `Pelourinho` também precisa ser saneado antes de considerar o catálogo público de Salvador limpo.

## Observações de escopo

- Não foram implementados boundaries.
- Não foram criados módulos ou funcionalidades.
- Não foram alterados contratos, arquitetura ou banco.
- Não foram executados comandos de migração.
- A auditoria foi feita com o SSOT remoto atual, leitura estática do código territorial e comparação de cobertura por `location_id`.
