# DISPATCH AUTOMÁTICO - README

## O QUE É

Sistema que automaticamente busca e oferece corridas para motoristas disponíveis, com timeout, retry e realtime.

## COMO FUNCIONA

1. Passageiro cria corrida
2. Sistema busca motoristas próximos
3. Oferece para motorista 1 → aguarda 30s
4. Se aceitar: ✓ corrida confirmada
5. Se timeout: oferece para motorista 2
6. Repete até 5 motoristas ou 10 minutos
7. Se ninguém aceitar: corrida expira

## INSTALAÇÃO

```bash
# 1. Criar tabela de auditoria
psql -f CREATE_DISPATCH_AUDIT_TABLE.sql

# 2. Verificar
psql -f TESTAR_DISPATCH_AUTOMATICO.sql
```

## USO

### Frontend - Passageiro
```tsx
import { PassengerSearchStatus } from '@/modules/mobility/components/PassengerSearchStatus';

<PassengerSearchStatus 
  rideId={rideId} 
  passengerProfileId={userId} 
/>
```

### Frontend - Motorista
```tsx
import { DriverOfferCard } from '@/modules/mobility/components/DriverOfferCard';

<DriverOfferCard />
```

### Backend - Criar Corrida
```typescript
import { RideOperationalService } from '@/modules/mobility/core';

const result = await RideOperationalService.createRide({
  passengerProfileId: userId,
  pickupAddressId: originId,
  dropoffAddressId: destId,
  pickupLocationId: locationId,
  suggestedPrice: 25.00,
});
// Dispatch automático já iniciou!
```

## ARQUIVOS PRINCIPAIS

- `src/modules/mobility/core/AutoDispatchService.ts` - Dispatch automático
- `src/modules/mobility/hooks/useDriverOffers.ts` - Hook motorista
- `src/modules/mobility/hooks/useRideSearch.ts` - Hook passageiro
- `CREATE_DISPATCH_AUDIT_TABLE.sql` - Tabela de auditoria

## CONFIGURAÇÃO

Editar `AutoDispatchService.ts`:
```typescript
const CONFIG = {
  OFFER_TIMEOUT_SECONDS: 30,      // Tempo por motorista
  MAX_RETRY_ATTEMPTS: 5,          // Quantos motoristas tentar
  TOTAL_TIMEOUT_MINUTES: 10,      // Timeout total
  SEARCH_RADIUS_KM: 10,           // Raio de busca
};
```

## MONITORAMENTO

```sql
-- Taxa de sucesso
SELECT 
  COUNT(DISTINCT CASE WHEN status = 'accepted' THEN ride_id END) * 100.0 / 
  COUNT(DISTINCT ride_id) as taxa_sucesso_pct
FROM ride_dispatch_audit;

-- Tempo médio de aceite
SELECT AVG(EXTRACT(EPOCH FROM (responded_at - offered_at))) as tempo_medio_seg
FROM ride_dispatch_audit WHERE status = 'accepted';
```

## DOCUMENTAÇÃO COMPLETA

- `RELATORIO_FINAL_DISPATCH_AUTOMATICO.md` - Relatório técnico completo
- `EXEMPLO_USO_DISPATCH.md` - Exemplos de código
- `DIAGRAMA_FLUXO_DISPATCH.md` - Diagramas visuais
- `CHECKLIST_VALIDACAO_DISPATCH.md` - Checklist de testes
- `COMANDOS_RAPIDOS_DISPATCH.md` - Comandos úteis

## GARANTIAS

✅ Apenas 1 motorista aceita (optimistic locking)  
✅ Timeout de 30s por motorista  
✅ Retry até 5 motoristas  
✅ Realtime para passageiro e motorista  
✅ Auditoria completa  
✅ Sem race conditions  

## TROUBLESHOOTING

**Motorista não recebe oferta?**
- Verificar `is_online = true`
- Verificar `is_available = true`
- Verificar coordenadas não nulas

**Corrida expira imediatamente?**
- Verificar se há motoristas disponíveis
- Verificar raio de busca

**Realtime não funciona?**
- Verificar autenticação
- Verificar RLS policies
- Verificar console do navegador

## SUPORTE

Ver documentação completa em:
- `RELATORIO_FINAL_DISPATCH_AUTOMATICO.md`
- `COMANDOS_RAPIDOS_DISPATCH.md`

## STATUS

✅ IMPLEMENTADO E PRONTO PARA USO

**Próximo passo**: Executar SQL e testar fluxo.
