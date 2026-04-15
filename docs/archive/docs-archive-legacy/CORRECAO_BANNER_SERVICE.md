# Correção: BannerService.getBanners is not a function

## Problema Identificado
```
TypeError: BannerService.getBanners is not a function
at loadBanners (BannerDisplay.tsx:39:40)
```

## Causa Raiz
O componente `BannerDisplay.tsx` estava chamando o método `BannerService.getBanners(page, position)` que não existe no BannerService.

## Métodos Disponíveis no BannerService
- `getActiveBanners(position?)` - Busca banners ativos, opcionalmente filtrados por posição
- `getAllBanners()` - Busca todos os banners (admin)
- `getBannersByAudience(position, userTags)` - Busca banners por posição e audiência
- `getBannerById(id)` - Busca banner específico
- Outros métodos de CRUD e estatísticas

## Correção Aplicada

### Arquivo: `src/core/banners/components/BannerDisplay.tsx`

**Antes:**
```typescript
async function loadBanners() {
  try {
    const data = await BannerService.getBanners(page, position);
    setBanners(data.slice(0, 3));
  } catch (error) {
    logger.error("Error loading banners", error as Error);
  }
}
```

**Depois:**
```typescript
async function loadBanners() {
  try {
    const data = await BannerService.getActiveBanners(position);
    setBanners(data.slice(0, 3));
  } catch (error) {
    logger.error("Error loading banners", error as Error);
  }
}
```

## Mudanças
1. Substituído `getBanners(page, position)` por `getActiveBanners(position)`
2. Removido parâmetro `page` (não utilizado pelo método correto)
3. O método `getActiveBanners()` já filtra por posição e retorna apenas banners ativos

## Validação
- ✅ Diagnóstico TypeScript: sem erros
- ✅ Método correto do BannerService utilizado
- ✅ Assinatura de tipos compatível

## Status
✅ **CORRIGIDO** - Erro resolvido, aguardando teste no navegador

---
*Data: 2026-03-23*
*Arquivo: BannerDisplay.tsx*
