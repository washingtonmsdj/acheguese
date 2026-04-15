# Implementação de Subcategorias na Sidebar

## Resumo
Sistema de navegação com submenu expansível implementado na sidebar. Subcategorias aparecem automaticamente expandidas quando o usuário está na página correspondente.

## Mudanças Realizadas

### 1. Estrutura de Subcategorias
- Apenas "Comunidade" possui subcategorias funcionais
- Subcategorias: Grupos (`/grupos`) e Eventos (`/eventos`)
- Outras seções (Empresas, Classificados, Mapa) não possuem subcategorias pois as rotas não existem

### 2. Auto-Expansão Inteligente
- Subcategorias expandem automaticamente quando:
  - Usuário está em uma das subcategorias (ex: `/grupos` expande "Comunidade")
  - Usuário está na página principal da categoria (ex: `/comunidade` expande suas subcategorias)
- Estado de expansão atualiza automaticamente ao navegar entre páginas
- Usuário ainda pode colapsar/expandir manualmente clicando no ícone chevron

### 3. Rotas Validadas
Rotas que existem no projeto:
- `/` - Página inicial (ComunidadePage)
- `/businesss` - Empresas
- `/services` - Serviços
- `/classificados` - Classificados
- `/eventos` - Eventos
- `/grupos` - Grupos
- `/mapa` - Mapa
- `/mobilidade` - Mobilidade

### 4. Funcionalidades
- Auto-expansão baseada na rota atual
- Ícone ChevronDown/ChevronRight indica estado expandido/colapsado
- Click no botão de chevron expande/colapsa subcategorias manualmente
- Click no item principal navega para a rota
- Subcategorias aparecem indentadas (pl-14)
- Estado ativo visual tanto para item principal quanto subcategorias
- Border-left de 4px como indicador visual do item ativo
- useEffect sincroniza estado com mudanças de rota

### 5. Design
- Alinhamento à esquerda consistente
- Fonte text-base para itens principais
- Fonte text-sm para subcategorias
- Espaçamento adequado entre itens
- Transições suaves de hover e expansão

## Implementação Técnica

```typescript
// Auto-expand baseado na rota atual
const getInitialExpandedItems = () => {
  const expanded: string[] = [];
  mainNavItems.forEach(item => {
    if (item.subItems && item.subItems.length > 0) {
      const hasActiveSubItem = item.subItems.some(subItem => 
        location.pathname.startsWith(subItem.href)
      );
      const isMainActive = location.pathname.startsWith(item.href) && item.href !== "/";
      
      if (hasActiveSubItem || isMainActive) {
        expanded.push(item.href);
      }
    }
  });
  return expanded;
};

// Atualiza quando a rota muda
useEffect(() => {
  setExpandedItems(getInitialExpandedItems());
}, [location.pathname]);
```

## Próximos Passos (Opcional)

Se quiser adicionar mais subcategorias no futuro:

1. Criar as páginas correspondentes
2. Adicionar as rotas no `App.tsx`
3. Adicionar os subItems no array `mainNavItems` da sidebar

Exemplo:
```typescript
{ 
  icon: Building2, 
  label: "Empresas", 
  href: "/businesss",
  subItems: [
    { icon: Store, label: "Lojas", href: "/businesss/lojas" },
    { icon: Briefcase, label: "Serviços", href: "/businesss/servicos" },
  ]
}
```

## Arquivos Modificados
- `src/app/components/AppSidebar.tsx` - Implementada auto-expansão inteligente baseada na rota atual

