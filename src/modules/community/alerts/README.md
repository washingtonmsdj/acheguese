# Community Alerts Module

MÃ³dulo de alertas comunitÃ¡rios de seguranÃ§a e emergÃªncia.

## ðŸŽ¯ Responsabilidades

- CriaÃ§Ã£o, leitura e moderaÃ§Ã£o de alertas comunitÃ¡rios
- ValidaÃ§Ã£o de elegibilidade (telefone verificado, idade da conta, rate limit)
- DeduplicaÃ§Ã£o territorial (mesmo alerta no mesmo territÃ³rio em 30min)
- ExpiraÃ§Ã£o automÃ¡tica por categoria
- IntegraÃ§Ã£o com SSOT territorial via `location_id`
- ExibiÃ§Ã£o no feed (por territÃ³rio) e no mapa (por centroide)

## ðŸ—ï¸ Arquitetura

### Hierarquia de Camadas

```
SQL â†’ RPC â†’ Service â†’ Hook â†’ Component
```

- **SQL**: Schema, Ã­ndices, triggers, RLS
- **RPC**: `create_community_alert` (SECURITY DEFINER)
- **Service**: `CommunityAlertService` (SSOT de lÃ³gica)
- **Hooks**: `useAlerts`, `useAlertsBySpatialRadius`, `useCreateAlert`
- **Components**: `AlertFeedSection`, `AlertCard`, `CreateAlertModal`

### IntegraÃ§Ã£o Territorial

**Antes (âŒ Quebrado):**
```typescript
// Filtro frÃ¡gil por texto livre
const alerts = await communityAlertService.getAlerts({
  city: 'salvador',
  neighborhood: 'pituba'
});
```

**Depois (âœ… SSOT):**
```typescript
// Filtro robusto por territÃ³rio
const territoryFilter = useTerritoryFilter(resolved);
const { data: alerts } = useAlerts({ territoryFilter });
```

## ðŸ“Š Schema

### Tabela Principal: `community_alerts`

```sql
CREATE TABLE community_alerts (
  id                   UUID PRIMARY KEY,
  author_user_id       UUID NOT NULL,           -- nunca exposto
  author_profile_id    UUID NOT NULL,
  category             TEXT NOT NULL,           -- 8 categorias fechadas
  status               TEXT NOT NULL,           -- ativo | encerrado | expirado | removido
  location_id          UUID REFERENCES locations(id),  -- SSOT territorial
  latitude             DOUBLE PRECISION,        -- centroide do territÃ³rio
  longitude            DOUBLE PRECISION,        -- centroide do territÃ³rio
  neighborhood_display TEXT,                    -- display legÃ­vel
  city                 TEXT,                    -- display legÃ­vel
  description          TEXT NOT NULL,           -- 20-280 chars
  seen_personally      BOOLEAN NOT NULL,
  started_at_approx    TEXT NOT NULL,
  is_happening_now     BOOLEAN NOT NULL,
  still_risky          BOOLEAN NOT NULL,
  expires_at           TIMESTAMPTZ NOT NULL,
  trust_snapshot       JSONB NOT NULL,          -- imutÃ¡vel
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

### Ãndices

- `idx_ca_location_spatial`: Busca espacial (GIST)
- `idx_ca_location_status`: Feed territorial
- `idx_ca_location_dedup`: DeduplicaÃ§Ã£o territorial
- `idx_ca_rate_limit`: Rate limit por usuÃ¡rio
- `idx_ca_expiry`: Job de expiraÃ§Ã£o

## ðŸ” SeguranÃ§a

### RLS (Row Level Security)

- **SELECT**: Apenas alertas ativos e nÃ£o expirados
- **INSERT**: Bloqueado â€” obrigatÃ³rio usar RPC
- **UPDATE**: Apenas autor, apenas campos permitidos
- **DELETE**: Bloqueado â€” soft delete via status

### RPC: `create_community_alert`

ValidaÃ§Ãµes server-side:
1. âœ… UsuÃ¡rio autenticado
2. âœ… Telefone verificado
3. âœ… Conta >= 7 dias
4. âœ… Rate limit (3 alertas/24h)
5. âœ… `location_id` vÃ¡lido (type=district, status=active)
6. âœ… Categoria vÃ¡lida (8 categorias fechadas)
7. âœ… DescriÃ§Ã£o (20-280 chars)
8. âœ… Termos proibidos (tabela `alert_blocked_terms`)
9. âœ… DeduplicaÃ§Ã£o territorial (30min)

### View PÃºblica: `community_alerts_public`

Campos **NUNCA** expostos:
- `author_user_id`
- `trust_snapshot`
- `removal_reason`
- `under_review`
- `neighborhood` (deprecated)

Nota de implementaÃ§Ã£o SSOT:
- O `CommunityAlertService` usa projeÃ§Ã£o pÃºblica explÃ­cita (`PUBLIC_SELECT`) na tabela `community_alerts`.
- Isso evita drift entre versÃµes de view em produÃ§Ã£o e mantÃ©m contrato pÃºblico estÃ¡vel sem expor campos sensÃ­veis.

## ðŸ—ºï¸ IntegraÃ§Ã£o com Mapa

### Privacidade por Design

- âœ… Alertas aparecem no **centroide do territÃ³rio** (bairro)
- âœ… **NÃƒO** aparecem na localizaÃ§Ã£o exata do usuÃ¡rio
- âœ… Popup mostra "Alerta em [Bairro]", nÃ£o coordenadas

### Busca Espacial

```typescript
const { data: alerts } = useAlertsBySpatialRadius({
  center: [-12.9777, -38.5016], // Salvador
  radiusMeters: 5000,           // 5km
  territoryFilter,              // opcional
  limit: 50
});
```

### IntegraÃ§Ã£o no MapaPageV4

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

## ðŸ“ Uso

### Feed de Alertas

```typescript
import { useAlerts } from '@/modules/community/alerts';
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
import { useCreateAlert } from '@/modules/community/alerts';
import { useUserTerritory } from '@/core/location';

function CreateAlertButton() {
  const { homeDistrict } = useUserTerritory();
  const createAlert = useCreateAlert();

  const handleCreate = async () => {
    const result = await createAlert.mutateAsync({
      category: 'tiroteio_disparos',
      location_id: homeDistrict.id,  // SSOT territorial
      description: 'Tiroteio na rua principal, evitem a Ã¡rea',
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

## ðŸ”„ ExpiraÃ§Ã£o AutomÃ¡tica

Alertas expiram automaticamente por categoria:

| Categoria | Tempo de ExpiraÃ§Ã£o |
|-----------|-------------------|
| Tiroteio/Disparos | 60 min |
| Assalto em Andamento | 60 min |
| Tentativa de InvasÃ£o | 60 min |
| IncÃªndio/ExplosÃ£o | 90 min |
| Acidente Grave | 90 min |
| Alagamento/Deslizamento | 180 min |
| Risco na Via | 180 min |
| Pessoa VulnerÃ¡vel em Risco | 120 min |

Job de expiraÃ§Ã£o: `fn_expire_community_alerts()` (executar via pg_cron a cada 5min)

## ðŸš¨ ModeraÃ§Ã£o

### Report de Abuso

```typescript
import { useAlertReport } from '@/modules/community/alerts';

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

### Triggers AutomÃ¡ticos

- **3+ reports**: `under_review = true` (sticky)
- **Moderador**: Pode remover alerta via `alertModerationService.removeAlert()`

## ðŸ“š DependÃªncias

### Internas
- `@/core/location` â€” SSOT territorial
- `@/shared/utils/logger` â€” Logging
- `@/integrations/supabase` â€” Fronteira canÃ´nica de persistÃªncia

### Externas
- `@tanstack/react-query` â€” Data fetching
- `zod` â€” ValidaÃ§Ã£o de schemas

## ðŸ§ª Testes

```bash
# Unit tests
npm run test:unit -- community-alerts

# Integration tests
npm run test:integration -- community-alerts

# E2E tests
npm run test:e2e -- community-alerts
```

## ðŸ“– DocumentaÃ§Ã£o Adicional

- [CHECKLIST.md](./CHECKLIST.md) â€” CritÃ©rios de aceitaÃ§Ã£o
- [docs/fixes/20260419_COMMUNITY_ALERTS_STRUCTURAL_FIX.md](../../docs/fixes/20260419_COMMUNITY_ALERTS_STRUCTURAL_FIX.md) â€” CorreÃ§Ã£o estrutural AAA

## ðŸš€ Roadmap

### V1 (Atual)
- âœ… CriaÃ§Ã£o e exibiÃ§Ã£o de alertas
- âœ… IntegraÃ§Ã£o territorial via `location_id`
- âœ… ExibiÃ§Ã£o no mapa por centroide
- âœ… ValidaÃ§Ã£o e moderaÃ§Ã£o

### Proximas melhorias
- [ ] NotificaÃ§Ãµes push por proximidade
- [ ] Heatmap de alertas por territÃ³rio
- [ ] Alertas em mÃºltiplos territÃ³rios
- [ ] Geometria completa (polÃ­gonos)
- [ ] Analytics por categoria/territÃ³rio

---

**Ãšltima atualizaÃ§Ã£o**: 2026-04-19  
**Status**: âœ… Integrado com SSOT Territorial

