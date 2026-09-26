# FEATURE-MAP

> **MVP 2026-09-26**
>
> **Domínio de produto ativo:** Empresas (`business`).
>
> **Capacidades horizontais ativas:** Mapa, Perto de mim, Busca, Mensagens,
> Auth, Conta/Perfis, Território, Localização, Notificações e Central.
>
> Owners executáveis:
> - `src/app/config/productModuleRegistry.ts`;
> - `src/app/config/platformCapabilityRegistry.ts`;
> - `src/app/config/lifecycleRegistry.ts`.

## Domínio ativo

### Empresas

Responsabilidade: catálogo institucional público de Business, detalhe canônico,
contato, localização, gestão da empresa e integrações horizontais.

Superfícies ativas do MVP:

- catálogo público de empresas;
- detalhe público canônico;
- cadastro de empresa em três etapas;
- edição de identidade, contato/localização e apresentação;
- Central da empresa com visão geral, dados e configurações;
- CTA de Mensagens quando a capability está habilitada;
- projeção no Mapa;
- descoberta em Perto de mim;
- resultados em Busca.

Regras:

- não depende de Gastronomia, Educação ou outras verticalizações;
- categorias continuam válidas mesmo quando a vertical especializada está pausada;
- `Business.id` é identidade de Profile; `Business.business_data_id` é a identidade do agregado Business;
- registros sem identidade/slug/território válidos falham fechado;
- fixtures sintéticas não podem aparecer como conteúdo público;
- Billing/premium pausado não pode gerar CTA ou rota funcional dentro da Central ativa;
- horários alimentam catálogo e detalhe público e devem convergir para o SSOT de Business Hours;
- localização pessoal só aparece quando existe coordenada real adequada para proximidade.

## Capacidades horizontais ativas

### Mapa

Projeta geograficamente providers de domínios ativos. No MVP, Business é o único layer de domínio público. Mapa não possui Business nem acessa seus internals; consome o port público do domínio.

### Perto de mim

Descoberta por proximidade. Depende de:

- capability `map`;
- capability `location`;
- módulo `business`.

Distância pessoal só pode ser apresentada com localização real. Fallback territorial não pode ser rotulado como posição do usuário.

A superfície visual do MVP usa a mesma linguagem de Empresas e apresenta separadamente referência territorial e GPS real.

### Busca

Orquestra providers de domínios ativos. No MVP, Business é o provider público principal. Providers de Community, Serviços, Classificados, Eventos e Vagas permanecem fail-closed.

Busca não possui os dados dos domínios e não reativa módulos pausados. Copy pública não deve expor termos internos como “módulos ativos”, registry ou provider.

### Mensagens

Inbox/Chat horizontal do produto.

No MVP:

- `messaging=true`;
- provider ativo: **Business Direct Messaging**;
- CTA `Mensagem` no detalhe de Empresa cria/reusa thread privada;
- Inbox canônica: `/mensagens`;
- thread canônica: `/mensagens/business/:threadId`;
- Classificados e Community preservam agregados próprios, mas seus providers não estão registrados na Inbox ativa;
- a Inbox não pertence a Community, Business ou Comunicação Territorial;
- não existe tabela ou `MessagingService` monolítico universal.

Persistência Business Messaging:

- `business_direct_threads`;
- `business_direct_thread_participants`;
- `business_direct_messages`;
- `business_direct_message_reports`;
- audit metadata-only em schema `private`.

Escritas são server-owned por RPC e autorização usa o Profile ativo.

## Plataforma ativa

Auth, sessão, Conta/Perfis, Território, Localização, Notificações, Central, segurança, storage e observabilidade são infraestrutura transversal. Não devem ser modelados como verticais de negócio.

## Domínios pausados

Permanecem versionados e fail-closed até certificação individual:

- Community;
- Gastronomia;
- Serviços/Profissionais;
- Classificados;
- Pontos Turísticos;
- Educação;
- Vagas/Oportunidades;
- Eventos;
- Comunicação territorial;
- Mobilidade;
- Cupons;
- Gamificação;
- Analytics público;
- Alertas/Issues/Achados e Perdidos;
- Safety familiar;
- Billing.

Código preservado não autoriza rota pública, navegação, prefetch, query, provider de Busca, provider de Mensagens ou layer de Mapa.

## Lifecycle

Novo domínio nasce `paused`. Nova capability horizontal também nasce `paused` quando sua ativação puder expor funcionalidade incompleta.

Ativar exige:

1. owner e contratos claros;
2. autorização e dados reais;
3. dependências explícitas;
4. testes de fronteira;
5. E2E/smoke quando aplicável;
6. alteração no registry correto.

Redirect não é mecanismo de lifecycle.
