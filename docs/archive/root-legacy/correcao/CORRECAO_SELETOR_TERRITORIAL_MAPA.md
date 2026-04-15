# Correção: Seletor Territorial Não Muda ao Clicar no Mapa

## Problema Identificado

Quando o usuário clicava em um marcador no mapa (ex: Elevador Lacerda), o seletor territorial mudava automaticamente para o bairro do ponto clicado (ex: Centro Histórico), mesmo que o usuário estivesse visualizando outro território.

### Causa Raiz

A navegação ao clicar em marcadores do mapa usava o `geographic_path` da empresa/ponto, que incluía o bairro específico do estabelecimento. Isso fazia o sistema interpretar como uma mudança de território intencional.

```typescript
// ❌ ANTES (INCORRETO)
onBusinessClick={(id) => {
  const biz = businessesToShow.find(b => b.id === id);
  if (biz) navigate(getBusinessUrl(biz, moduleUrls.business));
  // getBusinessUrl usa geographic_path da empresa, mudando o território
}}
```

## Solução Implementada

A correção mantém o contexto territorial atual ao navegar a partir do mapa. O seletor permanece no território que o usuário escolheu (cidade ou bairro).

```typescript
// ✅ DEPOIS (CORRETO)
onBusinessClick={(id) => {
  const biz = businessesToShow.find(b => b.id === id);
  if (biz && biz.slug) {
    // Mantém contexto territorial atual
    const currentPath = moduleUrls.business.list; // Ex: /empresas/ba/salvador
    navigate(`${currentPath}/${biz.slug}`);
    // URL final: /empresas/ba/salvador/elevador-lacerda
    // Território permanece: Salvador (não muda para Centro Histórico)
  }
}}
```

## Comportamento Correto

### Seletor Territorial (TerritorySelectorV2)

O seletor é **restrito à configuração feita no admin**:

1. **Cidades e Bairros Disponíveis**: Apenas os territórios com `metadata.is_selector_active = true` aparecem no seletor
2. **Modo Bairro**: Usuário cadastrado pode filtrar apenas pelo seu bairro
3. **Modo Cidade**: Usuário vê toda a cidade com filtros por bairro
4. **Explorar**: Usuário pode explorar outros territórios configurados no admin

### Regras de Modo Territorial

#### 🏠 Modo Bairro (FIXO)
- **Bairro do usuário é FIXO**: Não muda para outro bairro
- **Se clicar em link de outro bairro**: Sistema muda automaticamente para "Modo Cidade"
- **Banner de aviso**: Mostra "Você saiu de [Nordeste] e está visualizando [Salvador]"
- **Exemplo**: 
  - Usuário mora no Nordeste de Amaralina
  - Está em "Modo Bairro" (vê apenas Nordeste)
  - Clica em empresa da Pituba
  - ✅ Sistema muda para "Modo Cidade" (Salvador)
  - ✅ Banner oferece voltar para "Meu Bairro"

#### 🏙️ Modo Cidade (DINÂMICO)
- **Cidade pode mudar**: Ao navegar para outro território
- **Bairros dentro da cidade**: Não muda o modo, apenas filtra
- **Exemplo**:
  - Usuário em "Modo Cidade" (Salvador)
  - Clica em empresa da Pituba
  - ✅ Permanece em "Modo Cidade" (Salvador)
  - ✅ Mostra conteúdo da Pituba

### Regras de Navegação

| Origem | Comportamento | Modo Muda? | Observação |
|--------|--------------|------------|------------|
| **Mapa** | Mantém território atual | ❌ NÃO | Preserva contexto do usuário |
| **Link de outro bairro** | Muda para Modo Cidade | ✅ SIM | Bairro é fixo, não muda |
| **Busca Global** | Navega para território da empresa | ✅ SIM | Navegação intencional |
| **Lista de Empresas** | Navega para território da empresa | ✅ SIM | Navegação intencional |
| **Seletor Manual** | Muda para território escolhido | ✅ SIM | Escolha explícita |

## Arquivos Relevantes

### Modificados
- `src/app/pages/EmpresasLandingPage.tsx` - Correção do `onBusinessClick` no mapa

### Componentes do Sistema
- `src/core/location/components/TerritorySelectorV2.tsx` - Seletor territorial principal
- `src/core/location/components/TerritoryMismatchBanner.tsx` - Banner de aviso ao sair do bairro
- `src/core/location/hooks/useTerritoryModeInitializer.ts` - Inicializa modo territorial
- `src/core/location/hooks/useActiveTerritory.ts` - Hook para território ativo
- `src/core/location/stores/LocationContextStore.ts` - Store SSOT do território

## Configuração Admin

O seletor territorial é gerenciado em:
- **Hook**: `src/modules/admin/hooks/useAdminTerritoryManagement.ts`
- **Página**: Painel Admin → Gestão de Territórios
- **Flags**:
  - `is_selector_active`: Aparece no seletor
  - `is_landing_enabled`: Tem página de landing
  - `is_navigable`: Pode ser acessado via URL

## Testes

### Cenário 1: Usuário em "Minha Cidade" (Salvador) - Clique no Mapa
1. Seletor mostra: "Salvador - Minha Cidade"
2. Clica no Elevador Lacerda (Centro Histórico) no mapa
3. ✅ Seletor permanece: "Salvador - Minha Cidade"
4. ✅ URL: `/empresas/ba/salvador/elevador-lacerda`

### Cenário 2: Usuário em "Meu Bairro" (Nordeste) - Clique no Mapa
1. Seletor mostra: "Nordeste de Amaralina - Meu Bairro"
2. Clica em empresa do Nordeste no mapa
3. ✅ Seletor permanece: "Nordeste de Amaralina - Meu Bairro"
4. ✅ URL: `/empresas/ba/salvador/nordeste-de-amaralina/empresa-slug`

### Cenário 3: Usuário em "Meu Bairro" (Nordeste) - Link de Outro Bairro
1. Seletor mostra: "Nordeste de Amaralina - Meu Bairro"
2. Clica em link de empresa da Pituba (outro bairro)
3. ✅ Sistema muda automaticamente para: "Salvador - Minha Cidade"
4. ✅ Banner aparece: "Você saiu de Nordeste de Amaralina e está visualizando Salvador"
5. ✅ URL: `/empresas/ba/salvador/empresa-slug`
6. ✅ Botões no banner: "Meu Bairro" | "Minha Cidade"

### Cenário 4: Busca Global
1. Usuário busca "Elevador Lacerda"
2. Clica no resultado
3. ✅ Seletor muda para: "Salvador - Minha Cidade" (comportamento esperado)
4. ✅ URL: `/empresas/ba/salvador/elevador-lacerda`

## Princípios SSOT

- **Single Source of Truth**: `LocationContextStore` é a única fonte de verdade do território ativo
- **Configuração Centralizada**: Admin define quais territórios aparecem no seletor via `is_selector_active`
- **Contexto Preservado**: Navegação no mapa não altera o contexto territorial escolhido pelo usuário
- **Bairro Fixo**: O bairro do usuário NUNCA muda para outro bairro - sistema muda para modo cidade
- **Cidade Dinâmica**: A cidade pode mudar ao navegar para outros territórios
- **Navegação Intencional**: Apenas ações explícitas (seletor, busca, links diretos) mudam o território
- **Banner Informativo**: `TerritoryMismatchBanner` avisa quando o usuário sai do seu bairro

## Próximos Passos

- [ ] Aplicar mesma lógica em outros mapas (pontos turísticos, serviços, etc)
- [ ] Adicionar testes automatizados para garantir comportamento
- [ ] Documentar padrão de navegação territorial no guia de desenvolvimento

---

**Data**: 2026-04-03  
**Versão**: 1.0.0  
**Status**: ✅ Implementado
