# Business / Empresas — contrato de validação

**Status:** contrato vivo do domínio Business  
**Escopo MVP:** ativo

Este arquivo descreve o que precisa permanecer verdadeiro para o domínio Empresas. Ele não registra SHA atual, diário de PRs, estado de runner ou checkpoint de release. Evidências datadas pertencem a `docs/08-roadmap/checkpoints/`, `docs/10-archive/` ou ao histórico do Git.

## Ownership

- UI e fluxos de aplicação: `src/modules/business`;
- domínio, persistência e contratos reutilizáveis: `src/core/business`;
- criação geral: `BusinessService.createBusiness()`;
- URLs e identidade pública: `BusinessUrlService` + `PublicIdentityService`;
- gestão canônica: `/central/empresas/*`;
- lifecycle de produto: `src/app/config/productModuleRegistry.ts`.

Nenhum writer paralelo de `business_data` deve ser criado fora do owner canônico.

## Identidades

- `profiles.id`: identidade de Profile, rotas e autoridade multi-profile;
- `business_data.id`: identidade do agregado Business e de extensões que exigem Business Data ID;
- adapters entre essas identidades devem ser explícitos;
- slug, username ou nome público nunca substituem ID canônico de ownership.

## Regras de segurança

- autorização de browser é somente UX; mutações sensíveis dependem de RLS/RPC/Edge Function confiável;
- owner/gestor é revalidado pelo backend;
- campos server-owned não entram em payload de criação/edição comum;
- fixture de teste não pode aparecer no runtime público;
- fluxos administrativos passam pelo owner/broker administrativo aplicável;
- Billing mutante permanece separado do domínio Business e respeita seu lifecycle próprio.

## Regras do MVP

Business deve funcionar independentemente de Gastronomia, Educação, Serviços, Mobilidade, Billing e outras verticais pausadas.

Integrações horizontais são provider-scoped:

- Mapa recebe a layer Business pelo boundary da capability;
- Perto de mim recebe o provider Business;
- Busca recebe o provider/bucket Business;
- Mensagens recebe Business Direct Messaging;
- Notificações preservam histórico, mas ações obedecem ao lifecycle.

Pausar outra vertical não pode quebrar listagem, detalhe, criação, edição ou gestão de Empresa.

## Dados públicos

Superfícies públicas devem:

- usar dados reais/autorizados;
- falhar fechado para identidade, slug ou território inválido;
- não fabricar distância/localização;
- não usar fixtures sintéticas como fallback;
- manter rotas canônicas e 404 para superfície sem owner ativo.

## Persistência e consistência

Fluxos de criação/edição devem:

- validar slug antes da primeira mutação persistente;
- manter compensação somente onde necessária para reverter partial state real;
- usar operações idempotentes quando o contrato permitir retry;
- preservar a distinção Profile ID × Business Data ID;
- não recriar RPC/service paralelo para mascarar falha de transação.

## Gates obrigatórios

Antes de declarar Business pronto em um candidato de release:

1. testes arquiteturais e de segurança do domínio;
2. lint + typecheck + build;
3. lifecycle autenticado real: criar → editar → página pública → gestão → cleanup;
4. autorização negativa de usuário não-owner;
5. integração com Mapa, Nearby, Busca e Mensagens;
6. deploy exact-SHA;
7. smoke do mesmo SHA.

O status global de MVP READY pertence a `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`, não a este arquivo.

## Histórico

Campanhas G5/G6, probes, SHAs e evidências antigas pertencem aos checkpoints históricos e ao histórico do Git. Este contrato vivo não repete esses snapshots.

Histórico não reabre owner, rota, facade ou regra substituída.
