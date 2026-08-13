# Territory Home — contrato canônico

> Status: SSOT de produto e implementação da Home territorial.
> Versão: 3.2 (fundação real).
> Escopo: entrada territorial, Home pública, navegação primária e regras de composição.

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

## 4. Hierarquia canônica

1. Cabeçalho territorial e troca de território.
2. Proposta da Home e busca territorial.
3. `Agora`, somente quando houver informação temporalmente atual.
4. Atalhos contextuais.
5. `Vale saber em [território]`.
6. Resumo de Community.
7. Empresas e serviços úteis.
8. Contexto territorial e ampliação bairro → cidade.
9. Descoberta adicional.
10. Bottom navigation mobile.

Se uma seção não tiver conteúdo real, ela deve ser omitida ou exibir um estado vazio útil. A ordem pode formar duas colunas no desktop, mas o modelo de dados e a prioridade semântica são os mesmos do mobile.

## 5. Dados e composição

| Bloco | Fonte canônica | Regra |
|---|---|---|
| território | `TerritorialLayout` + `useModuleTerritoryFilter` | rota resolvida; cidade inclui descendentes |
| busca/URLs | builders de `territoryUrls` + hooks de URLs de domínio | todo destino preserva o território |
| posts | `PostService.getFeed` | somente publicados e recentes para resumo da Home |
| eventos | `EventReadService` | status permitido **e** data vigente |
| vagas | `WorkOpportunitiesService` | lifecycle ativo; conjunto de locations resolvido |
| empresas/serviços/classificados | `LandingFeaturedService` | registros públicos do território |
| destaques | `TerritorialHighlightService` | ativos e dentro da janela editorial |
| publicação | `useCommunityAccess` / `CommunityAccessPolicy` | CTA apenas com `create_post = true` |
| sessão | `SessionContext` | personalização sem alterar visibilidade pública |

Falhas parciais não derrubam a Home. A seção afetada fica vazia e a interface informa que parte dos dados não pôde ser atualizada. Não existe fallback editorial fictício na Home de Production.

## 6. Freshness e veracidade

- `Agora` aceita evento em andamento ou iniciando dentro da janela operacional curta (36 horas na fundação 3.2).
- Evento `upcoming` com data passada não aparece.
- Evento `ongoing` sem término não permanece atual por mais de 24 horas após o início.
- Resumo de Community aceita posts dos últimos 30 dias; atividade mais antiga continua disponível na Community, não como “recente” na Home.
- Vagas respeitam o lifecycle calculado pelo serviço; status de banco isolado não basta.
- Empresa nunca recebe “aberto agora” sem horários reais.
- Distância nunca é exibida sem cálculo real.
- Contagens vêm de queries reais; zero é um estado válido.
- Ausência de dados nunca autoriza nomes, alertas, ofertas, avaliações ou datas inventadas.

## 7. Estados

### Loading

Skeletons preservam a estrutura. Nenhum mock ocupa o lugar do conteúdo.

### Pouca atividade

Explicar com linguagem neutra, oferecer busca/serviços e, no bairro, a ampliação para a cidade.

### Erro parcial

Manter seções bem-sucedidas e informar a indisponibilidade parcial sem atribuí-la a falta de atividade.

### Território sem resolução

Não executar queries globais como fallback. Retornar ao fluxo de resolução territorial.

## 8. Navegação

No mobile, a navegação territorial começa por:

1. `Hoje` → Home do território atual;
2. `Explorar` → mapa territorial;
3. `Community` → participação no mesmo território;
4. `Busca` → busca territorial;
5. `Mais` → módulos públicos habilitados pelo launch scope.

`Publicar` não é destino global permanente. É ação contextual condicionada à policy.

No desktop, a Home usa largura real: conteúdo principal e rail lateral com serviços/contexto. Não é uma coluna mobile centralizada.

## 9. Microcopy

- Preferir “Hoje em [território]”, “Vale saber” e “Resolver por aqui”.
- Não chamar cidade de bairro.
- Não declarar território “movimentado”, empresa “aberta” ou conteúdo “agora” sem evidência.
- Community deve ser explicada como participação local, não como todo o produto.

## 10. Critérios de aceite

- Salvador e Pituba resolvem e mantêm URLs canônicas.
- território sem atividade apresenta vazio honesto;
- visitante público explora sem onboarding obrigatório;
- `Publicar` só aparece com policy positiva;
- refresh direto mantém o mesmo contexto;
- nenhuma seção contém mock/fallback fictício em Production;
- mobile não tem overflow horizontal e desktop usa composição própria;
- loading, erro parcial e vazio são distinguíveis;
- console não contém erro novo e requests territoriais não falham por URL incorreta.

## 11. Evolução posterior

- telemetria de utilidade e atalhos semânticos;
- alertas cívicos quando o launch scope e o contrato de validade forem ativados;
- ranking contextual explicável;
- busca assistida por IA com respostas rastreáveis a fontes locais;
- preferências pessoais sem criar bolha ou ocultar informação cívica relevante.

Essas evoluções não podem reintroduzir conteúdo fictício nem contornar Territory, Rollout ou CommunityAccessPolicy.
