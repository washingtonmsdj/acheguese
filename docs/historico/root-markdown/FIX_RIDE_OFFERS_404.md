# Fix: Erro 404 em ride_offers

## 🔴 Problema Identificado

Ao cancelar uma corrida, o sistema tenta atualizar a tabela `ride_offers` mas recebe erro 404:

```
PATCH https://xhdowzacfujckjelqhtd.supabase.co/rest/v1/ride_offers?ride_id=eq.7b3815bb-6617-443a-abeb-90fac503e7b2&status=in.%28pending%2Csent%29 404 (Not Found)
```

### Causa Raiz

A tabela `ride_offers` **não existe** no banco de dados Supabase, mas o código está tentando usá-la em:

1. **MobilityAuditService.cancelPendingOffers()** - Linha 88-96
2. **RideOperationalService.stopDispatchForRide()** - Linha 535-545

### Fluxo do Erro

```
Usuário cancela corrida
  ↓
RideOperationalService.cancelRide()
  ↓
RideOperationalService.stopDispatchForRide()
  ↓
MobilityAuditService.cancelPendingOffers()
  ↓
supabase.from("ride_offers").update(...) ❌ 404 Not Found
```

## ✅ Solução Implementada

### 1. Migration Criada

**Arquivo:** `supabase/migrations/20260416000000_create_ride_offers.sql`

Cria a tabela `ride_offers` com:

- **Campos:**
  - `id` - UUID primary key
  - `ride_id` - Referência à corrida
  - `driver_profile_id` - Perfil do motorista
  - `status` - pending, accepted, rejected, expired, cancelled
  - `offered_at` - Timestamp da oferta
  - `expires_at` - Timestamp de expiração
  - `responded_at` - Timestamp da resposta
  - `rejection_reason` - Motivo da rejeição (opcional)
  - `created_at`, `updated_at` - Timestamps de auditoria

- **Índices:**
  - `idx_ride_offers_ride_id` - Busca por corrida
  - `idx_ride_offers_driver_profile_id` - Busca por motorista
  - `idx_ride_offers_status` - Filtro por status
  - `idx_ride_offers_expires_at` - Ofertas pendentes
  - `idx_ride_offers_ride_status` - Índice composto

- **RLS Policies:**
  - Service role: acesso total
  - Motoristas: ver e responder suas ofertas
  - Passageiros: ver ofertas das suas corridas

### 2. Script de Aplicação

**Arquivo:** `apply-ride-offers-migration.mjs`

Script Node.js para aplicar a migration automaticamente:

```bash
node apply-ride-offers-migration.mjs
```

O script:
1. Verifica se a tabela já existe
2. Lê o arquivo de migration
3. Executa o SQL no Supabase
4. Valida a criação
5. Verifica a estrutura

## 🚀 Como Aplicar

### Opção 1: Script Automático (Recomendado)

```bash
# Certifique-se de ter as variáveis de ambiente configuradas
node apply-ride-offers-migration.mjs
```

### Opção 2: Manual via Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Abra o arquivo `supabase/migrations/20260416000000_create_ride_offers.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **Run**

### Opção 3: Supabase CLI

```bash
# Se você tem o Supabase CLI instalado
supabase db push
```

## 🧪 Validação

Após aplicar a migration, teste:

1. **Criar uma corrida:**
   - Faça login como passageiro
   - Solicite uma corrida

2. **Cancelar a corrida:**
   - Clique em cancelar
   - Verifique o console do navegador
   - **NÃO deve aparecer erro 404 em ride_offers**

3. **Verificar logs:**
   ```
   ✅ RideOperationalService.stopDispatchForRide - offers cancelled
   ✅ useMobilidade.cancelRide - sucesso
   ```

## 📊 Impacto

### Antes (❌ Com Erro)
- Cancelamento de corrida funciona parcialmente
- Erro 404 no console
- Ofertas pendentes não são canceladas
- Motoristas podem receber ofertas de corridas já canceladas

### Depois (✅ Corrigido)
- Cancelamento completo e limpo
- Sem erros no console
- Ofertas são canceladas automaticamente
- Motoristas não recebem ofertas inválidas

## 🔍 Arquivos Modificados

### Criados
- `supabase/migrations/20260416000000_create_ride_offers.sql`
- `apply-ride-offers-migration.mjs`
- `FIX_RIDE_OFFERS_404.md` (este arquivo)

### Não Modificados (código já estava correto)
- `src/modules/mobility/services/MobilityAuditService.ts`
- `src/modules/mobility/core/RideOperationalService.ts`

O código estava correto, apenas faltava a tabela no banco de dados.

## 📝 Notas Técnicas

### Por que a tabela não existia?

A tabela `ride_offers` faz parte do sistema de **dispatch de corridas** (GATE 6), que permite:
- Enviar ofertas para múltiplos motoristas
- Motoristas aceitarem/rejeitarem ofertas
- Expiração automática de ofertas
- Cancelamento em cascata

A migration provavelmente não foi aplicada anteriormente porque:
1. O sistema de dispatch ainda não estava totalmente implementado
2. A migration foi documentada mas não criada
3. O código foi desenvolvido assumindo que a tabela existiria

### Dependências

A tabela `ride_offers` depende de:
- ✅ `ride_requests` - Tabela de corridas (existe)
- ✅ `profiles` - Tabela de perfis (existe)

Não há dependências circulares ou bloqueios.

## 🎯 Próximos Passos

Após aplicar esta correção:

1. **Implementar sistema de dispatch completo:**
   - Criar ofertas quando corrida é solicitada
   - Enviar notificações para motoristas
   - Gerenciar expiração de ofertas

2. **Adicionar testes:**
   - Teste de cancelamento com ofertas pendentes
   - Teste de expiração de ofertas
   - Teste de aceitação/rejeição

3. **Monitorar:**
   - Verificar logs de cancelamento
   - Confirmar que não há mais erros 404
   - Validar performance das queries

## 📚 Referências

- Documentação original: `docs/archive/root-legacy/gate/GATE_6_PROPOSTA_CORRIGIDA_SSOT.md`
- Código relacionado: `src/modules/mobility/services/MobilityAuditService.ts`
- Serviço operacional: `src/modules/mobility/core/RideOperationalService.ts`
