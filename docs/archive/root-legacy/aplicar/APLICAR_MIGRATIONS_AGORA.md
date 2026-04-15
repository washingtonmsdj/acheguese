# ✅ Aplicar Migrations - tourist_points_v2

## Arquivo Gerado
Foi criado o arquivo `apply-tourist-points.sql` com todas as migrations consolidadas.

## Como Aplicar (2 minutos)

### Passo 1: Abrir SQL Editor
Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new

### Passo 2: Copiar o SQL
Abra o arquivo `apply-tourist-points.sql` e copie TODO o conteúdo.

### Passo 3: Colar e Executar
1. Cole o conteúdo no SQL Editor do Supabase
2. Clique no botão **"Run"** (ou pressione Ctrl+Enter)
3. Aguarde a execução (deve levar alguns segundos)

### Passo 4: Verificar
Execute esta query para confirmar:

```sql
SELECT COUNT(*) FROM tourist_points_v2;
-- Deve retornar: 10

SELECT COUNT(*) FROM tourist_point_media;
-- Deve retornar: 30
```

## O que será criado?

1. **Tabela `tourist_points_v2`**
   - Pontos turísticos com modelo territorial canônico
   - Campos: título, descrição, endereço, preço, horários, etc.
   - RLS configurado (público pode ler, admin pode editar)

2. **Tabela `tourist_point_media`**
   - Fotos dos pontos turísticos
   - Relacionamento com tourist_points_v2

3. **10 Pontos Turísticos de Salvador**
   - Praia do Porto da Barra
   - Farol da Barra
   - Pelourinho
   - Elevador Lacerda
   - Mercado Modelo
   - Igreja do Bonfim
   - Forte de Santo Antônio da Barra
   - Solar do Unhão
   - Dique do Tororó
   - Parque da Cidade

4. **30 Fotos** (3 por ponto turístico)

## Após Aplicar

Recarregue a página da aplicação e o erro 404 desaparecerá. Os pontos turísticos estarão disponíveis em:
- `/guia/pontos-turisticos/ba/salvador`
- `/guia/pontos-turisticos/ba/salvador/brotas` (etc)
