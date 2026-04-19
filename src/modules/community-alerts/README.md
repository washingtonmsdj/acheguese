# Community Alerts Module

Módulo de alertas comunitários de segurança e emergência.

## 🎯 Responsabilidades

- Criação, leitura e moderação de alertas comunitários
- Validação de elegibilidade (telefone verificado, idade da conta, rate limit)
- Deduplicação territorial (mesmo alerta no mesmo território em 30min)
- Expiração automática por categoria
- Integração com SSOT territorial via `location_id`
- Exibição no feed (por território) e no mapa (por centroide)

## 🏗️ Arquitetura

### Hierarquia de Camadas

```
SQL → RPC → Service → Hook → Component
```

- **SQL**: Schema, índices, triggers, RLS
- **RPC**: `create_community_alert` (SECURITY DEFINER)
- **Service**: `CommunityAlertService` (SSOT de lógica)
- **Hooks**: `useAlerts`, `useAlertsBySpatialRadius`, `useCreateAlert`
- **Components**: `AlertFeedSection`, `AlertCard`, `CreateAlertModal`

### Integração Territorial

**Antes (❌ Quebrado):**
```typescript
// Filtro frágil por texto livre
const alerts = await communityAlertService.getAlerts({
  city: 'salvador',
  neighborhood: 'pituba'
});
```

**Depois (✅ SSOT):**
```typescript
// Filtro robusto por território
const territoryFilter = useTerritoryFilter(resolved);
const { data: alerts } = useAlerts({ territoryFilter });
```

## 📊 Schema

### Tabela Principal: `community_alerts`

```sql
CREATE TABLE community_alerts (
  id                   UUID PRIMARY KEY,
  author_user_id       UUID NOT NULL,           -- nunca exposto
  author_profile_id    UUID NOT NULL,
  category             TEXT NOT NULL,           -- 8 categorias fechadas
  status               TEXT NOT NULL,           -- ativo | encerrado | expirado | removido
  location_id          UUID REFERENCES locations(id),  -- SSOT territorial
  latitude             DOUBLE PRECISION,        -- centroide do território
  longitude            DOUBLE PRECISION,        -- centroide do território
  neighborhood_display TEXT,                    -- display legível
  city                 TEXT,                    -- display legível
  description          TEXT NOT NULL,           -- 20-280 chars
  seen_personally      BOOLEAN NOT NULL,
  started_at_approx    TEXT NOT NULL,
  is_happening_now     BOOLEAN NOT NULL,
  still_risky          BOOLEAN NOT NULL,
  expires_at           TIMESTAMPTZ NOT NULL,
  trust_snapshot       JSONB NOT NULL,          -- imutável
  report_count         INTEGER DEFAULT 0,
  under_review         BOOLEAN DEFAULT FALSE,   -- sticky
  edit_count           INTEGER DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  ended_at             TIMESTAMPTZ,
  removed_at           TIMESTAMPTZ,
  removal_reason       TEXT
);
```

### Índices

- `idx_ca_location_spatial`: Busca espacial (GIST)
- `idx_ca_location_status`: Feed territorial
- `idx_ca_location_dedup`: Deduplicação territorial
- `idx_ca_rate_limit`: Rate limit por usuário
- `idx_ca_expiry`: Job de expiração

## 🔐 Segurança

### RLS (Row Level Security)

- **SELECT**: Apenas alertas ativos e não expirados
- **INSERT**: Bloqueado — obrigatório usar RPC
- **UPDATE**: Apenas autor, apenas campos permitidos
- **DELETE**: Bloqueado — soft delete via status

### RPC: `create_community_alert`

Validações server-side:
1. ✅ Usuário autenticado
2. ✅ Telefone verificado
3. ✅ Conta >= 7 dias
4. ✅ Rate limit (3 alertas/24h)
5. ✅ `location_id` válido (type=district, status=active)
6. ✅ Categoria válida (8 categorias fechadas)
7. ✅ Descrição (20-280 chars)
8. ✅ Termos proibidos (tabela `alert_blocked_terms`)
9. ✅ Deduplicação territorial (30min)

### View Pública: `community_alerts_public`

Campos **NUNCA** expostos:
- `author_user_id`
- `trust_snapshot`
- `removal_reason`
- `under_review`
- `neighborhood` (deprecated)

## 🗺️ Integração com Mapa

### Privacidade por Design

- ✅ Alertas aparecem no **centroide do território** (bairro)
- ✅ **NÃO** aparecem na localização exata do usuário
- ✅ Popup mostra "Alerta em [Bairro]", não coordenadas

### Busca Espacial

```typescript
const { data: alerts } = useAlertsBySpatialRadius({
  center: [-12.9777, -38.5016], // Salvador
  radiusMeters: 5000,           // 5km
  territoryFilter,              // opcional
  limit: 50
});
```

### Integração no MapaPageV4

```typescript
function makeAlertFetcher(territoryFilter: TerritoryFilter) {
  return async (bounds: BoundingBox): Promise<MapMarker[]> => {
    const center = calculateBoundsCenter(bounds);
    const radius = calculateBoundsRadius(bounds);
    
    const alerts = await communityAlertService.getBySpatialRadius(
      center,
      radius,
      { territoryFilter }
    );
    
    return mapEntityProjection.projectEntities(
      alerts.map(a => ({
        id: a.id,
        name: `Alerta: ${ALERT_CATEGORY_LABELS[a.category]}`,
        latitude: a.latitude,
        longitude: a.longitude,
        status: a.status,
        description: a.description,
      })),
      'alert',
      { includeMetadata: true, baseUrl: '/alertas' }
    );
  };
}
```

## 📝 Uso

### Feed de Alertas

```typescript
import { useAlerts } from '@/modules/community-alerts';
import { useTerritoryFilter } from '@/core/location';

function AlertFeed() {
  const territoryFilter = useTerritoryFilter();
  const { data: alerts, isLoading } = useAlerts({ 
    territoryFilter,
    limit: 20 
  });

  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      {alerts?.map(alert => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
```

### Criar Alerta

```typescript
import { useCreateAlert } from '@/modules/community-alerts';
import { useUserTerritory } from '@/core/location';

function CreateAlertButton() {
  const { homeDistrict } = useUserTerritory();
  const createAlert = useCreateAlert();

  const handleCreate = async () => {
    const result = await createAlert.mutateAsync({
      category: 'tiroteio_disparos',
      location_id: homeDistrict.id,  // SSOT territorial
      description: 'Tiroteio na rua principal, evitem a área',
      seen_personally: true,
      started_at_approx: 'just_now',
      is_happening_now: true,
      still_risky: true,
    });

    if (result.error) {
      toast.error(ALERT_ERROR_MESSAGES[result.error]);
    } else {
      toast.success('Alerta criado com sucesso');
    }
  };

  return <Button onClick={handleCreate}>Criar Alerta</Button>;
}
```

## 🔄 Expiração Automática

Alertas expiram automaticamente por categoria:

| Categoria | Tempo de Expiração |
|-----------|-------------------|
| Tiroteio/Disparos | 60 min |
| Assalto em Andamento | 60 min |
| Tentativa de Invasão | 60 min |
| Incêndio/Explosão | 90 min |
| Acidente Grave | 90 min |
| Alagamento/Deslizamento | 180 min |
| Risco na Via | 180 min |
| Pessoa Vulnerável em Risco | 120 min |

Job de expiração: `fn_expire_community_alerts()` (executar via pg_cron a cada 5min)

## 🚨 Moderação

### Report de Abuso

```typescript
import { useAlertReport } from '@/modules/community-alerts';

function ReportButton({ alertId }: { alertId: string }) {
  const reportAlert = useAlertReport();

  const handleReport = async () => {
    await reportAlert.mutateAsync({
      alert_id: alertId,
      reason: 'false_alert'
    });
  };

  return <Button onClick={handleReport}>Reportar</Button>;
}
```

### Triggers Automáticos

- **3+ reports**: `under_review = true` (sticky)
- **Moderador**: Pode remover alerta via `alertModerationService.removeAlert()`

## 📚 Dependências

### Internas
- `@/core/location` — SSOT territorial
- `@/shared/utils/logger` — Logging
- `@/integrations/supabase` — Cliente Supabase

### Externas
- `@tanstack/react-query` — Data fetching
- `zod` — Validação de schemas

## 🧪 Testes

```bash
# Unit tests
npm run test:unit -- community-alerts

# Integration tests
npm run test:integration -- community-alerts

# E2E tests
npm run test:e2e -- community-alerts
```

## 📖 Documentação Adicional

- [CHECKLIST.md](./CHECKLIST.md) — Critérios de aceitação
- [docs/fixes/20260419_COMMUNITY_ALERTS_STRUCTURAL_FIX.md](../../docs/fixes/20260419_COMMUNITY_ALERTS_STRUCTURAL_FIX.md) — Correção estrutural AAA

## 🚀 Roadmap

### V1 (Atual)
- ✅ Criação e exibição de alertas
- ✅ Integração territorial via `location_id`
- ✅ Exibição no mapa por centroide
- ✅ Validação e moderação

### V2 (Futuro)
- [ ] Notificações push por proximidade
- [ ] Heatmap de alertas por território
- [ ] Alertas em múltiplos territórios
- [ ] Geometria completa (polígonos)
- [ ] Analytics por categoria/território

---

**Última atualização**: 2026-04-19  
**Status**: ✅ Integrado com SSOT Territorial
