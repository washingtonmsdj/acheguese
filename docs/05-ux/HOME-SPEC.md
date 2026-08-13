# Territory Home — contrato canônico

> Status: SSOT de produto e implementação da Home territorial.
> Versão: 3.3 (cobertura territorial + rollout gradual da Community).
> Escopo: entrada territorial, Home pública, navegação primária, regras de composição e relação com rollout da Community.

## 1. Decisão de produto

O Achegue-se é Territory-first. Community é a camada de participação do território, não um sinônimo da Home.

A Home responde:

> Onde estou, o que mudou, o que merece atenção e o que consigo resolver por aqui?

Ela deve ser útil antes de social, funcionar publicamente e ser honesta quando há pouca atividade.

## 2. Contrato de rotas

| Rota | Papel |
|---|---|
| `/` | Entrada e resolução territorial. Nunca é a Home de conteúdo. |
| `/:uf/:cidade` | Home territorial ampla da cidade. |
| `/:uf/:cidade/:territorio` | Home territorial prioritária de bairro ou grupo resolvido. |
| `/comunidade/:uf/:cidade[/:territorio]` ou alias público | Community: participação e vida comunitária do contexto. |
| `/busca/:uf/:cidade[/:territorio]` e `/mapa/...` | Explorar: descoberta, busca e mapa. |
| `/inicio` | Hub nacional legado; não é alias da Home territorial. |

O retorno de `/` pode redirecionar para o último território ou território do perfil. Sem contexto, `/` apresenta um seletor público. Escolher Salvador ou um bairro suportado permite explorar sem cadastro e sem onboarding obrigatório.

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
6. Resumo de Community, respeitando seu rollout independente.
7. Empresas e serviços úteis.
8. Contexto territorial e ampliação bairro → cidade.
9. Descoberta adicional.
10. Bottom navigation mobile.

Se uma seção não tiver conteúdo real, ela deve ser omitida ou exibir um estado vazio útil. A ordem pode formar duas colunas no desktop, mas o modelo de dados e a prioridade semântica são os mesmos do mobile.

## 6. Dados e composição

| Bloco | Fonte canônica | Regra |
|---|---|---|
| território | `TerritorialLayout` + `useModuleTerritoryFilter` | rota resolvida; cidade inclui descendentes |
| busca/URLs | builders de `territoryUrls` + hooks de URLs de domínio | todo destino preserva o território |
| posts | `PostService.getFeed` | somente publicados e recentes para resumo da Home |
| eventos | `EventReadService` | status permitido **e** data vigente |
| vagas | `WorkOpportunitiesService` | lifecycle ativo; conjunto de locations resolvido |
| empresas/serviços/classificados | `LandingFeaturedService` | registros públicos do território |
| destaques | `TerritorialHighlightService` | ativos e dentro da janela editorial |
| Community | `CommunityExperienceService` + rollout | ativa somente onde o contrato comunitário estiver liberado; `coming_soon` não bloqueia a Home |
| publicação | `useCommunityAccess` / `CommunityAccessPolicy` | CTA apenas com `create_post = true` |
| sessão | `SessionContext` | personalização sem alterar visibilidade pública |

Falhas parciais não derrubam a Home. A seção afetada fica vazia e a interface informa que parte dos dados não pôde ser atualizada. Não existe fallback editorial fictício na Home de Production.

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

Skeletons preservam a estrutura. Nenhum mock ocupa o lugar do conteúdo.

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
2. `Explorar` → mapa territorial;
3. `Community` → participação no mesmo território, respeitando rollout;
4. `Busca` → busca territorial;
5. `Mais` → módulos públicos habilitados pelo launch scope.

`Publicar` não é destino global permanente. É ação contextual condicionada à policy e à disponibilidade comunitária do contexto.

No desktop, a Home usa largura real: conteúdo principal e rail lateral com serviços/contexto. Não é uma coluna mobile centralizada.

## 10. Microcopy

- Preferir “Hoje em [território]”, “Vale saber” e “Resolver por aqui”.
- Não chamar cidade de bairro.
- Não declarar território “movimentado”, empresa “aberta” ou conteúdo “agora” sem evidência.
- Community deve ser explicada como participação local, não como todo o produto.
- Em bairro sem Community ativa, comunicar que **a Community** está chegando, e não que o Achegue-se inteiro está indisponível.

## 11. Critérios de aceite

- Salvador e Pituba resolvem e mantêm URLs canônicas.
- território sem atividade apresenta vazio honesto;
- visitante público explora sem onboarding obrigatório;
- bairros fora do cluster inicial continuam com Home e módulos públicos utilizáveis;
- Community ativa e `coming_soon` produzem estados diferentes sem alterar a identidade do Territory;
- `Publicar` só aparece com policy positiva e contexto comunitário elegível;
- refresh direto mantém o mesmo contexto;
- nenhuma seção contém mock/fallback fictício em Production;
- mobile não tem overflow horizontal e desktop usa composição própria;
- loading, erro parcial e vazio são distinguíveis;
- console não contém erro novo e requests territoriais não falham por URL incorreta.

## 12. Evolução posterior

- telemetria de utilidade e atalhos semânticos;
- métricas de demanda para orientar expansão da Community;
- alertas cívicos quando o launch scope e o contrato de validade forem ativados;
- ranking contextual explicável;
- busca assistida por IA com respostas rastreáveis a fontes locais;
- preferências pessoais sem criar bolha ou ocultar informação cívica relevante.

Essas evoluções não podem reintroduzir conteúdo fictício nem contornar Territory, Rollout ou CommunityAccessPolicy.