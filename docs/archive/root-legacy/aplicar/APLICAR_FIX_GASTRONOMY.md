# 🔧 Aplicar Fix de Gastronomia - SSOT

## 📋 Problema

O erro ocorre porque os dados de gastronomia não seguem a arquitetura SSOT:
- `BusinessUrlService` exige `geographic_path` com 4 segmentos: `/br/ba/salvador/bairro`
- Os dados antigos apontam para cidade (`/br/ba/salvador`) em vez de bairro

## ✅ Solução

Execute o arquivo `fix_gastronomy_complete.sql` no SQL Editor do Supabase.

### Passo a Passo

1. **Abra o SQL Editor**
   - Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor
   - Clique em "SQL Editor" → "New Query"

2. **Copie o conteúdo**
   - Abra o arquivo: `fix_gastronomy_complete.sql`
   - Copie TODO o conteúdo (Ctrl+A, Ctrl+C)

3. **Execute no SQL Editor**
   - Cole no SQL Editor (Ctrl+V)
   - Clique em "Run" (ou F5)

4. **Verifique o resultado**
   - Deve mostrar 5 empresas de gastronomia
   - Todos os `geographic_path` devem ter 4 segmentos

## 📊 Resultado Esperado

```
✅ VALIDAÇÃO: Dados de Gastronomia
total_empresas: 5

business_name              | slug                    | geographic_path              | cuisine_type
---------------------------|-------------------------|------------------------------|-------------
Bar do Rio                 | bar-do-rio              | /br/ba/salvador/rio-vermelho | Brasileira
Casa da Moqueca            | casa-da-moqueca         | /br/ba/salvador/pelourinho   | Baiana
Pizzaria Bella Napoli      | pizzaria-bella-napoli   | /br/ba/salvador/itaigara     | Italiana
Restaurante Barra Mar      | restaurante-barra-mar   | /br/ba/salvador/barra        | Frutos do Mar
Sushi House Pituba         | sushi-house-pituba      | /br/ba/salvador/pituba       | Japonesa
```

## 🎯 Após Aplicar

1. Recarregue a página no navegador (F5)
2. O erro deve desaparecer
3. Os cards de gastronomia devem exibir corretamente
4. As URLs devem seguir o padrão: `/gastronomia/ba/salvador/{bairro}/{slug}`

## 🏗️ Arquitetura Correta

```
profiles (identidade pública)
    ↓
business_data (SSOT empresarial)
    ├── location_id → locations (BAIRRO/district) ✅
    ├── address_id → addresses
    └── profile_id → profiles
        ↓
gastronomy_profiles (extensão gastronômica)
    └── business_id → business_data.id
```

## ⚠️ Importante

- Todos os `location_id` em `business_data` devem apontar para BAIRROS (type='district')
- Nunca apontar para cidades (type='city')
- O `geographic_path` SEMPRE deve ter 4 segmentos: `/país/estado/cidade/bairro`
