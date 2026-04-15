# Solução: Localização Padrão para Desenvolvimento

## Problema Identificado

Após a integração dos módulos community e business com a fundação geográfica, a página da comunidade estava bloqueando o acesso com a mensagem:

```
Community não disponível
Localização não selecionada
Selecione uma localização para acessar a comunidade
```

## Causa

A integração está funcionando corretamente - ela bloqueia o acesso quando não há localização ativa no contexto, conforme especificado nos requisitos:

- Community deve ler a localização ativa do usuário
- Quando não houver localização ativa, usar comportamento padrão claramente definido
- Rollout do módulo community deve verificar se há localização ativa

## Solução Implementada

### 1. Utilitário de Configuração de Localização para Dev

Criado `src/core/location/utils/devLocationSetup.ts`:

```typescript
/**
 * Configura Salvador como localização padrão para desenvolvimento
 */
export async function setupDefaultDevLocation(): Promise<void> {
  // Apenas em desenvolvimento
  if (import.meta.env.PROD) {
    return;
  }

  // Verificar se já há localização ativa
  const currentLocation = locationContextStore.getActiveLocation();
  if (currentLocation) {
    console.log('📍 Localização já configurada:', currentLocation.name);
    return;
  }

  try {
    // Obter Salvador do mock repository
    const repository = new LocationRepositoryMock();
    const salvador = await repository.findById('loc-salvador');

    if (salvador) {
      locationContextStore.setActiveLocation(salvador);
      console.log('📍 Localização padrão configurada para desenvolvimento:', salvador.name);
    }
  } catch (error) {
    console.error('❌ Erro ao configurar localização padrão:', error);
  }
}
```

### 2. Componente Inicializador

Criado `src/app/components/DevLocationInitializer.tsx`:

```typescript
export function DevLocationInitializer() {
  useEffect(() => {
    // Configurar localização padrão para desenvolvimento
    setupDefaultDevLocation();
  }, []);

  return null; // Não renderiza nada
}
```

### 3. Integração no App.tsx

Adicionado o inicializador no App.tsx:

```typescript
<LocationProvider>
  <DevLocationInitializer />
  <SkipToContent />
  // ... resto do app
</LocationProvider>
```

## Resultado

Agora, quando o app inicializa em modo de desenvolvimento:

1. ✅ Salvador é configurada automaticamente como localização ativa
2. ✅ Community e Business funcionam normalmente
3. ✅ Rollout é verificado para Salvador
4. ✅ Não há bloqueio de acesso
5. ✅ Console mostra: "📍 Localização padrão configurada para desenvolvimento: Salvador"

## Localizações Disponíveis no Mock

O `LocationRepositoryMock` fornece:

- **Brasil** (`loc-br`) - País
- **Bahia** (`loc-ba`) - Estado
- **Salvador** (`loc-salvador`) - Cidade (padrão)
- **Pituba** (`loc-pituba`) - Bairro
- **Rio Vermelho** (`loc-rio-vermelho`) - Bairro
- **Barra** (`loc-barra`) - Bairro
- **Itaigara** (`loc-itaigara`) - Bairro
- **Amaralina** (`loc-amaralina`) - Bairro

## Utilitários Adicionais

### Configurar Localização Específica

```typescript
import { setupDevLocation } from '@/core/location';

// Configurar Pituba
await setupDevLocation('loc-pituba');
```

### Listar Localizações Disponíveis

```typescript
import { listAvailableDevLocations } from '@/core/location';

// No console do navegador
await listAvailableDevLocations();
```

## Comportamento em Produção

- ✅ Em produção (`import.meta.env.PROD === true`), nada acontece
- ✅ Usuário precisará selecionar localização manualmente
- ✅ Integração com sistema real de localização

## Próximos Passos

### Para Produção
1. Implementar seletor de localização na UI
2. Salvar localização selecionada no localStorage
3. Integrar com localização GPS do usuário
4. Conectar com Supabase para localizações reais

### Para Desenvolvimento
- Localização padrão já configurada
- Pode ser alterada via console do navegador
- Facilita testes de diferentes localizações

## Arquivos Modificados

1. ✅ `src/core/location/utils/devLocationSetup.ts` - Criado
2. ✅ `src/app/components/DevLocationInitializer.tsx` - Criado
3. ✅ `src/core/location/index.ts` - Exports atualizados
4. ✅ `src/App.tsx` - Inicializador adicionado

## Conclusão

A solução mantém a integridade da integração geográfica (bloqueio quando sem localização) enquanto fornece uma experiência de desenvolvimento fluida com localização padrão automática.