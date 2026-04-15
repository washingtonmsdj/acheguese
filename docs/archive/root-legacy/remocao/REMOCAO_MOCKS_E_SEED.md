# ✅ Remoção de Mocks e Seed de Dados

## O que foi feito

### 1. Removido Fallback para Mocks

**Arquivo:** `src/modules/classifieds/pages/ClassificadosLandingPage.tsx`

**Antes:**
```typescript
import { MOCK_CLASSIFIEDS } from "@/modules/classifieds/data/mock-classifieds";

const classificados = classificadosFromDB.length > 0 
  ? classificadosFromDB 
  : MOCK_CLASSIFIEDS;
```

**Depois:**
```typescript
// Import removido
const classificados = classificadosFromDB;
```

**Resultado:** Página agora usa APENAS dados do banco de dados.

---

### 2. Criado Script de Seed

**Arquivos criados:**
- `scripts/seed-classifieds.ts` - Script TypeScript para popular o banco
- `scripts/README.md` - Instruções de uso
- `supabase/seed_classifieds.sql` - Alternativa SQL

---

## Como Popular o Banco

### Opção 1: Script TypeScript (Recomendado)

```bash
# 1. Instalar dependência
npm install -D tsx

# 2. Executar script
npx tsx scripts/seed-classifieds.ts
```

**O script:**
- Busca localidades existentes automaticamente
- Busca um usuário vendedor automaticamente
- Insere 3 classificados de teste

---

### Opção 2: SQL Direto

1. Abra o Supabase Dashboard → SQL Editor
2. Copie o conteúdo de `supabase/seed_classifieds.sql`
3. Substitua os placeholders:
   - `{SELLER_ID}` → ID de um usuário real
   - `{LOCATION_ID_PITUBA}` → ID de uma localidade
   - `{LOCATION_ID_BARRA}` → ID de outra localidade
4. Execute o SQL

---


## Classificados Inseridos

O script insere 3 anúncios de teste:

### 1. iPhone 14 Pro Max 256GB
- **Preço:** R$ 4.500
- **Categoria:** eletrônicos
- **Condição:** usado
- **Fotos:** 2 imagens
- **Descrição:** Completa com detalhes do produto

### 2. Sofá 3 Lugares Retrátil
- **Preço:** R$ 1.200
- **Categoria:** móveis
- **Condição:** usado
- **Fotos:** 1 imagem
- **Descrição:** Medidas e estado de conservação

### 3. Notebook Dell Inspiron 15
- **Preço:** R$ 3.200
- **Categoria:** eletrônicos
- **Condição:** usado
- **Fotos:** 1 imagem
- **Descrição:** Especificações técnicas completas

---

## Verificar Dados Inseridos

Execute no SQL Editor do Supabase:

```sql
SELECT 
  c.id,
  c.title,
  c.price,
  c.category,
  c.status,
  l.name as location_name,
  p.name as seller_name,
  c.created_at
FROM classifieds c
LEFT JOIN locations l ON c.location_id = l.id
LEFT JOIN profiles p ON c.seller_id = p.id
ORDER BY c.created_at DESC
LIMIT 10;
```

---

## Comportamento da Página Agora

### Quando há dados no banco:
✅ Mostra classificados reais
✅ Destaques com produtos reais
✅ Filtro territorial funcionando

### Quando NÃO há dados:
✅ Mostra estado vazio apropriado
✅ Mensagem contextual por território
✅ CTA para criar primeiro anúncio

---

## Próximos Passos

1. Execute o script de seed: `npx tsx scripts/seed-classifieds.ts`
2. Acesse a página de classificados
3. Verifique se os anúncios aparecem
4. Teste o filtro territorial
5. Teste os filtros de categoria

---

## Status

- [x] Mocks removidos da landing page
- [x] Script de seed criado
- [x] Documentação completa
- [x] Página usando apenas dados do banco
- [ ] Executar seed no banco
- [ ] Testar página com dados reais

