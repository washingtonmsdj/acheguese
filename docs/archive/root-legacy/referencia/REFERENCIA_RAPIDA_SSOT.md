# REFERÊNCIA RÁPIDA - SSOT DO PROJETO

**Última atualização**: 07/04/2026  
**Documento completo**: `MAPA_DOMINIOS_CONSOLIDADO.md`

---

## ✅ O QUE USAR (OFICIAL)

### Services Core (SSOT)

```typescript
// Routing (rotas, ETA, distâncias)
import { routingService } from '@/core/routing';

// Geocoding (endereços, coordenadas, CEP)
import { geocodingService } from '@/core/geocoding';

// Tracking (localização em tempo real)
import { trackingService } from '@/core/tracking';

// Safety (segurança, alertas, emergências)
import { safetyService } from '@/core/safety';

// Pricing (precificação de corridas)
import { pricingService } from '@/core/pricing';
```

### Edge Functions Ativas

1. `admin-suspend-profile` - Suspensão de perfil
2. `admin-verify-profile` - Verificação de perfil
3. `auto-dispatch-ride` - Dispatch automático
4. `nominatim-proxy` - Proxy geocoding
5. `process-timeouts` - Timeouts de corridas
6. `send-emergency-email` - Emails de emergência
7. `territory-ai-content` - Conteúdo territorial IA

### Tabelas SQL Principais

**Territorial**:
- `locations` - Territórios (SSOT)
- `addresses` - Endereços físicos (SSOT)
- `territorial_groups` - Grupos territoriais

**Mobilidade**:
- `ride_requests` - Solicitações de corrida
- `driver_data` - Dados de motoristas
- `driver_locations` - Localização de motoristas
- `ride_dispatch_audit` - Auditoria de dispatch

**Segurança**:
- `emergency_alerts` - Alertas de emergência
- `ride_shares` - Compartilhamentos de viagem
- `safety_incidents` - Incidentes de segurança

**Pricing**:
- `pricing_rules` - Regras de precificação
- `pricing_peak_hour_multipliers` - Multiplicadores
- `pricing_additional_fees` - Taxas adicionais

**Community**:
- `posts` - Posts da comunidade
- `community_questions` - Perguntas Q&A
- `comments` - Comentários
- `community_polls` - Enquetes

**Business**:
- `business_data` - Dados de empresas

**Gastronomy**:
- `gastronomy_profiles` - Perfis gastronômicos
- `menus` - Cardápios
- `menu_items` - Itens do cardápio

**Guide**:
- `tourist_points_v2` - Pontos turísticos (SSOT)

**Jobs**:
- `job_postings` - Vagas de emprego

---

## ❌ O QUE NÃO USAR (DEPRECATED)

### Services Deprecated

```typescript
// ❌ NÃO USAR
import { CepService } from '@/core/address';

// ✅ USAR
import { geocodingService } from '@/core/geocoding';
await geocodingService.lookupPostalCode({ postalCode: '40000-000' });
```

### Campos Deprecated

```typescript
// ❌ NÃO USAR em posts
post.city
post.neighborhood
post.street
post.autor_id
post.texto

// ✅ USAR
post.location_id  // FK para locations
post.author_profile_id
post.content
```

```typescript
// ❌ NÃO USAR em business_data
business.address
business.latitude
business.longitude
business.city
business.neighborhood

// ✅ USAR
business.location_id  // FK para locations
business.address_id   // FK para addresses
```

### Tabelas Deprecated

```typescript
// ❌ NÃO USAR
tourist_points  // v1

// ✅ USAR
tourist_points_v2  // SSOT
```

### Funções Deprecated

```typescript
// ❌ NÃO USAR
createCommunityPost()
createSimplePost()

// ✅ USAR
useCreatePost()  // Hook oficial
```

---

## 🚫 O QUE É PROIBIDO

### Importações Proibidas

```typescript
// ❌ NUNCA importar provider diretamente
import { mockRoutingProvider } from '@/integrations/maps';

// ❌ NUNCA acessar Supabase diretamente em componente
import { supabase } from '@/integrations/supabase';

// ❌ NUNCA duplicar lógica de domínio
function calculateMyOwnETA() { ... }
```

### Padrões Proibidos

```typescript
// ❌ NUNCA calcular ETA manualmente
const distance = Math.sqrt(...);

// ✅ USAR service
const eta = await routingService.calculateSimpleETA(origin, destination);

// ❌ NUNCA fazer tracking manual
supabase.from('driver_locations').insert(...);

// ✅ USAR service
await trackingService.updatePosition(profileId, position);

// ❌ NUNCA buscar CEP manualmente
fetch('https://viacep.com.br/ws/...');

// ✅ USAR service
await geocodingService.lookupPostalCode({ postalCode });
```

---

## 📋 REGRAS DE IMPORTAÇÃO

### ✅ PERMITIDO

```typescript
// Módulos importam de core
import { routingService } from '@/core/routing';
import { geocodingService } from '@/core/geocoding';
import { trackingService } from '@/core/tracking';
import { safetyService } from '@/core/safety';
import { pricingService } from '@/core/pricing';

// Core importa de core (apenas tipos)
import type { Coordinates } from '@/core/maps/types';

// Módulos importam de módulos (mesmo nível)
import { RideService } from '@/modules/mobility/services/RideService';
```

### ❌ PROIBIDO

```typescript
// Core NÃO importa de modules
import { RideService } from '@/modules/mobility/services/RideService';  // ❌

// Modules NÃO importam providers diretamente
import { mockRoutingProvider } from '@/integrations/maps';  // ❌

// Components NÃO acessam Supabase diretamente
import { supabase } from '@/integrations/supabase';  // ❌
```

---

## 🔍 COMO VERIFICAR

### Verificar se está usando SSOT

```bash
# Buscar imports incorretos
grep -r "from '@/integrations/supabase'" src/modules/
grep -r "from '@/integrations/maps'" src/modules/

# Buscar código deprecated
grep -r "CepService" src/
grep -r "createCommunityPost" src/
grep -r "tourist_points[^_]" src/
```

### Verificar se tabela existe

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'nome_da_tabela';
```

### Verificar se função existe

```sql
SELECT proname 
FROM pg_proc 
WHERE proname = 'nome_da_funcao';
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

- `MAPA_DOMINIOS_CONSOLIDADO.md` - Mapa completo de todos os domínios
- `FECHAMENTO_DISPATCH_FINAL.md` - Documentação do dispatch
- `OPERACAO_DISPATCH.md` - Operação do dispatch
- `RELATORIO_HARDENING_FINAL_E_LIMPEZA.md` - Hardening e limpeza

---

## 🆘 EM CASO DE DÚVIDA

1. Consultar `MAPA_DOMINIOS_CONSOLIDADO.md`
2. Buscar no código por exemplos de uso
3. Verificar se o service/tabela/função existe
4. Seguir as regras de importação

**Regra de ouro**: Se não está neste documento como "✅ O QUE USAR", não use!

---

**Última atualização**: 07/04/2026  
**Versão**: 1.0.0  
**Manutenção**: Atualizar após mudanças arquiteturais
