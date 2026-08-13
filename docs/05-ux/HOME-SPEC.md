# Territory Home — contrato canônico

> Status: SSOT de produto e implementação da Home territorial.
> Versão: 4.3 (cobertura territorial, rollout gradual da Community e entrada territorial Território Vivo).
> Escopo: entrada territorial, Home pública, navegação primária, regras de composição e relação com rollout da Community.

## 1. Decisão de produto

O Achegue-se é Territory-first. Community é a camada de participação do território, não um sinônimo da Home.

A Home responde:

> Onde estou, o que mudou, o que merece atenção e o que consigo resolver por aqui?

Ela deve ser útil antes de social, funcionar publicamente e ser honesta quando há pouca atividade.

## 2. Contrato de rotas

| Rota                                                     | Papel                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| `/`                                                      | Entrada e resolução territorial. Nunca é a Home de conteúdo. |
| `/:uf/:cidade`                                           | Home territorial ampla da cidade.                            |
| `/:uf/:cidade/:territorio`                               | Home territorial prioritária de bairro ou grupo resolvido.   |
| `/comunidade/:uf/:cidade[/:territorio]` ou alias público | Community: participação e vida comunitária do contexto.      |
| `/busca/:uf/:cidade[/:territorio]` e `/mapa/...`         | Explorar: descoberta, busca e mapa.                          |
| `/inicio`                                                | Hub nacional legado; não é alias da Home territorial.        |

O retorno de `/` pode redirecionar para o último território ou território do perfil. Sem contexto, `/` apresenta um seletor público. Escolher Salvador ou um bairro suportado permite explorar sem cadastro e sem onboarding obrigatório. Texto livre só abre uma Home quando resolve um território ativo e publicamente navegável; falha de resolução nunca empurra o visitante para cadastro.

### Contrato visual e operacional de `/`

- existe uma única implementação canônica: `TerritoryEntryPage`; aliases e seletores históricos não são superfícies paralelas;
- o mapa de Salvador é o elemento territorial principal no desktop e um contexto compacto no mobile; boundary só vem do SSOT geoespacial, sem contorno fictício de Production;
- localização, busca por cidade/bairro e entrada por Salvador inteira são caminhos equivalentes de resolução pública;
- a busca prioriza territórios ativos e publicamente navegáveis do catálogo canônico; geocodificação externa só complementa descoberta de cidades;
- localização negada, território sem cobertura e falha transitória possuem mensagens próprias e sempre preservam a entrada pública por Salvador;
- `achegue:last_territory` é o único estado recente consumido na entrada e permanece restrito à sessão; a opção `?trocar=territorio` mostra o contexto anterior sem impedir nova escolha;
- bairros sugeridos são identificados como sugestões editoriais, nunca como “recentes” sem histórico real;
- Salvador inteira está disponível para exploração; o cluster do Complexo do Nordeste de Amaralina aparece separadamente como rollout editorial da Community;
- a entrada não exibe a navegação territorial completa antes de existir contexto: oferece marca, login opcional, resolução e explicação curta do valor do produto.

## 3. Públicos

### Visitante novo

- resolve cidade ou bairro em `/`;
- acessa conteúdo público sem criar conta;
- entende o território atual e pode trocá-lo;
- vê apenas ações públicas; ações de participação podem pedir login no momento correto.

### Visitante recorrente

- volta ao último território quando o contexto salvo é válido;
- recebe a mesma Home real e territorial;
- pode ampliar bairro para cidade sem perder orientação.

### Usuário autenticado

- vê saudação discreta e contexto do perfil ativo;
- recebe notificações pessoais;
- vê `Publicar` somente quando `CommunityAccessPolicy.can.create_post` permitir no território resolvido;
- não recebe permissões inferidas apenas por estar autenticado.

### Operador, empresa ou moderador

A Home pública não vira dashboard. Gestão permanece em Central/Conta e moderação em superfícies próprias.

## 4. Cobertura do produto x rollout da Community

Cobertura territorial do Achegue-se e cobertura da Community são contratos diferentes.

O produto pode estar disponível em toda Salvador — Home, busca, empresas, serviços, classificados, vagas, eventos e demais módulos públicos habilitados — sem que a camada social esteja ativa em todos os bairros.

O primeiro cluster oficial de lançamento da Community é o **Complexo do Nordeste de Amaralina**, inicialmente concentrando:

- Nordeste de Amaralina;
- Santa Cruz;
- Vale das Pedrinhas;
- Chapada.

Cada bairro preserva sua identidade de `Territory`; o cluster de lançamento não substitui nem funde os territórios canônicos.

Nos demais bairros:

- a Home continua funcional e útil;
- busca e módulos públicos continuam disponíveis conforme cobertura real;
- a ausência de Community ativa não bloqueia exploração pública;
- o bloco de Community mostra o estado correto (`coming_soon`/waitlist) quando aplicável;
- não se simula atividade social para preencher a Home.

A expansão da Community deve ser evidence-gated, considerando demanda/interesse local, capacidade de moderação, atividade e condições operacionais de lançamento. Não existe calendário automático que obrigue abrir todos os bairros.

## 5. Hierarquia canônica

1. Cabeçalho territorial e troca de território.
2. Proposta da Home e busca territorial.
3. `Agora`, somente quando houver informação temporalmente atual.
4. Atalhos contextuais.
5. `Vale saber em [território]`.
6. Empresas e serviços úteis.
7. Resumo de Community, respeitando seu rollout independente.
8. Contexto territorial e ampliação bairro → cidade.
9. Descoberta adicional.
10. Navegação adaptativa por viewport.

Se uma seção não tiver conteúdo real, ela deve ser omitida ou exibir um estado vazio útil. A ordem pode formar duas colunas no desktop, mas o modelo de dados e a prioridade semântica são os mesmos do mobile.

## 6. Dados e composição

| Bloco                           | Fonte canônica                                         | Regra                                                                                         |
| ------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| território                      | `TerritorialLayout` + `useModuleTerritoryFilter`       | rota resolvida; cidade inclui descendentes                                                    |
| busca/URLs                      | builders de `territoryUrls` + hooks de URLs de domínio | todo destino preserva o território                                                            |
| posts                           | `PostService.getFeed`                                  | somente publicados e recentes para resumo da Home                                             |
| eventos                         | `EventReadService`                                     | status permitido **e** data vigente                                                           |
| vagas                           | `WorkOpportunitiesService`                             | lifecycle ativo; conjunto de locations resolvido                                              |
| empresas/serviços/classificados | `LandingFeaturedService`                               | registros públicos do território                                                              |
| destaques                       | `TerritorialHighlightService`                          | ativos e dentro da janela editorial                                                           |
| Community                       | `CommunityExperienceService` + rollout                 | ativa somente onde o contrato comunitário estiver liberado; `coming_soon` não bloqueia a Home |
| publicação                      | `useCommunityAccess` / `CommunityAccessPolicy`         | CTA apenas com `create_post = true`                                                           |
| sessão                          | `SessionContext`                                       | personalização sem alterar visibilidade pública                                               |

Falhas parciais não derrubam a Home. Cada grupo de dados possui loading independente; conteúdo resolvido aparece sem esperar todas as fontes. A seção afetada fica vazia e a interface informa que parte dos dados não pôde ser atualizada. Não existe fallback editorial fictício na Home de Production.

Entidades econômicas e conteúdo técnico são filtrados por marcadores canônicos já disponíveis e, defensivamente, por identidade pública explicitamente técnica. Nome comercial legítimo não deve ser ocultado por inferência frágil. Enquanto o schema não possuir proveniência explícita (`production`, `seed`, `e2e`), casos ambíguos permanecem uma dívida de dados, não uma licença para inventar classificação na UI.

## 7. Freshness e veracidade

- `Agora` aceita evento em andamento ou iniciando dentro da janela operacional curta (36 horas na fundação 3.2).
- Evento `upcoming` com data passada não aparece.
- Evento `ongoing` sem término não permanece atual por mais de 24 horas após o início.
- Resumo de Community aceita posts dos últimos 30 dias **somente quando a Community do contexto está ativa**; atividade mais antiga continua disponível na Community, não como “recente” na Home.
- Vagas respeitam o lifecycle calculado pelo serviço; status de banco isolado não basta.
- Empresa nunca recebe “aberto agora” sem horários reais.
- Distância nunca é exibida sem cálculo real.
- Contagens vêm de queries reais; zero é um estado válido.
- Ausência de dados nunca autoriza nomes, alertas, ofertas, avaliações ou datas inventadas.

## 8. Estados

### Loading

Skeletons preservam a estrutura. A resolução territorial bloqueia apenas a fundação da página; depois disso, `Vale saber`, Community e empresas/serviços carregam progressivamente. Nenhum mock ocupa o lugar do conteúdo.

### Pouca atividade

Explicar com linguagem neutra, oferecer busca/serviços e, no bairro, a ampliação para a cidade.

### Community ainda não ativa

A Home territorial permanece normal. O bloco comunitário pode apresentar `coming_soon`, interesse/waitlist e contexto de expansão, sem esconder empresas, serviços, classificados, vagas, eventos, busca ou demais utilidades públicas disponíveis no território.

### Erro parcial

Manter seções bem-sucedidas e informar a indisponibilidade parcial sem atribuí-la a falta de atividade.

### Território sem resolução

Não executar queries globais como fallback. Retornar ao fluxo de resolução territorial.

## 9. Navegação

No mobile, a navegação territorial começa por:

1. `Hoje` → Home do território atual;
2. `Explorar` → busca e descoberta federada no território atual;
3. `Community` → participação no mesmo território, respeitando rollout;
4. `Atividade` → notificações do usuário, ou login quando visitante;
5. `Conta` / `Entrar` → identidade e preferências.

Busca não ocupa uma segunda tab concorrente com Explorar. Mapa, serviços, empresas, classificados e gastronomia permanecem como atalhos contextuais da Home e superfícies de descoberta. `Mais` deixa de ser depósito de módulos: destinos sem prioridade primária devem ser encontrados pela Home, por Explorar ou pelo contexto da Conta.

`Publicar` não é destino global permanente. É ação contextual condicionada à policy e à disponibilidade comunitária do contexto.

No desktop, a Home usa largura real: conteúdo principal e rail lateral com serviços/contexto. Não é uma coluna mobile centralizada.

### Contrato visual Território Vivo

- mobile abaixo de 768 px: topbar territorial, conteúdo editorial e bottom navigation com cinco modos;
- tablet entre 768 e 1279 px: navigation rail fixa de 72 px; o conteúdo nunca fica sem navegação;
- desktop a partir de 1280 px: sidebar fixa de 224 px, conteúdo principal fluido e rail contextual somente quando agrega informação;
- a sidebar representa `Hoje`, `Explorar`, `Community`, `Atividade` e `Conta/Entrar`; módulos são destinos contextuais;
- Home e Explorar compartilham topbar, busca, superfícies, títulos, estados e linguagem visual;
- mapas entram sob demanda e como contexto; não substituem a Home;
- `prefers-reduced-motion` reduz transições e animações no shell;
- todos os alvos principais preservam pelo menos 40 px, e a navegação fixa preserva 52–64 px por item conforme o viewport.

## 10. Microcopy

- Preferir “Hoje em [território]”, “Vale saber” e “Resolver por aqui”.
- Não chamar cidade de bairro.
- Não declarar território “movimentado”, empresa “aberta” ou conteúdo “agora” sem evidência.
- Community deve ser explicada como participação local, não como todo o produto.
- Em bairro sem Community ativa, comunicar que **a Community** está chegando, e não que o Achegue-se inteiro está indisponível.

## 11. Critérios de aceite

- Salvador e Pituba resolvem e mantêm URLs canônicas.
- `/` possui uma única implementação, mapa responsivo e diferencia Salvador, bairro e Community;
- localização negada e território não encontrado preservam alternativa pública explícita;
- território sem atividade apresenta vazio honesto;
- visitante público explora sem onboarding obrigatório;
- bairros fora do cluster inicial continuam com Home e módulos públicos utilizáveis;
- Community ativa e `coming_soon` produzem estados diferentes sem alterar a identidade do Territory;
- `Publicar` só aparece com policy positiva e contexto comunitário elegível;
- refresh direto mantém o mesmo contexto;
- nenhuma seção contém mock/fallback fictício em Production;
- mobile não tem overflow horizontal e desktop usa composição própria;
- 320 px preserva conteúdo e navegação; 390×844 é a referência mobile; 820 px exibe rail; 1440×1000 exibe sidebar e rail contextual;
- loading, erro parcial e vazio são distinguíveis;
- console não contém erro novo e requests territoriais não falham por URL incorreta.

## 12. Prova E2E

- a suíte pública intercepta apenas leituras PostgREST no navegador de teste e injeta territórios determinísticos; não existe caminho de fixture no bundle de Production;
- cidade, bairro com conteúdo, território vazio, busca, troca territorial, refresh, navegação e deep-link são cobertos sem depender do estado corrente do banco;
- sessão autenticada usa exclusivamente `E2E_USER_EMAIL` e `E2E_USER_PASSWORD` fornecidos ao ambiente; sem essas credenciais o cenário é explicitamente pulado, nunca preenchido com segredo padrão;
- a suíte não publica Post nem executa mutation;
- console sem exceção, requests críticos sem HTTP 4xx/5xx e ausência de overflow horizontal fazem parte da prova pública.

## 13. Evolução posterior

- telemetria de utilidade e atalhos semânticos;
- métricas de demanda para orientar expansão da Community;
- alertas cívicos quando o launch scope e o contrato de validade forem ativados;
- ranking contextual explicável;
- busca assistida por IA com respostas rastreáveis a fontes locais;
- preferências pessoais sem criar bolha ou ocultar informação cívica relevante.

Essas evoluções não podem reintroduzir conteúdo fictício nem contornar Territory, Rollout ou CommunityAccessPolicy.
