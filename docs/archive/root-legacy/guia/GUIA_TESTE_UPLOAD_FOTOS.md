# 🧪 Guia de Teste: Upload de Fotos de Classificados

## 📋 Pré-requisitos

### 1. Aplicar Migration do Bucket
```bash
# Aplicar migration no Supabase
supabase db push

# Ou via Supabase Dashboard:
# SQL Editor > Copiar conteúdo de: supabase/migrations/20260401000004_create_classified_images_bucket.sql
```

### 2. Verificar Bucket Criado
No Supabase Dashboard:
1. Ir em **Storage**
2. Verificar se bucket `classified-images` existe
3. Configurações do bucket:
   - Public: ✅ Sim
   - File size limit: 10MB
   - Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif

### 3. Verificar Políticas RLS
No Supabase Dashboard > Storage > classified-images > Policies:
- ✅ Users can upload own classified images
- ✅ Public read access to classified images
- ✅ Users can update own classified images
- ✅ Users can delete own classified images

## 🧪 Testes

### Teste 1: Página de Teste Isolada

**URL:** `/test/upload-fotos`

**Objetivo:** Validar upload, compressão e thumbnails isoladamente

**Passos:**
1. Fazer login na aplicação
2. Acessar `/test/upload-fotos`
3. Selecionar 1-3 fotos (diferentes tamanhos e formatos)
4. Clicar em "Upload"
5. Observar:
   - ✅ Barra de progresso aparece
   - ✅ Status muda: "Comprimindo..." → "X%" → "✓ Completo"
   - ✅ Imagens aparecem após upload
   - ✅ Links funcionam (imagem completa e thumbnail)
   - ✅ Tamanho reduzido (comparar com original)

**Validações:**
- [ ] Upload bem-sucedido
- [ ] Compressão funcionando (tamanho menor)
- [ ] Thumbnails gerados
- [ ] URLs públicas acessíveis
- [ ] Imagens no formato WebP
- [ ] Progresso em tempo real

### Teste 2: Formulário de Criação de Anúncio

**URL:** `/classificados/novo`

**Objetivo:** Validar integração completa no fluxo real

**Passos:**
1. Fazer login
2. Acessar `/classificados/novo`
3. Preencher campos obrigatórios:
   - Título
   - Descrição
   - Categoria
   - Preço
4. Ir para step "Fotos"
5. Adicionar 3-5 fotos
6. Observar preview local
7. Avançar até "Revisão"
8. Clicar em "Publicar Anúncio"
9. Observar:
   - ✅ Mensagem "Enviando fotos..."
   - ✅ Progresso de upload
   - ✅ Mensagem "Publicando..."
   - ✅ Sucesso e redirecionamento

**Validações:**
- [ ] Fotos aparecem no preview
- [ ] Upload durante publicação
- [ ] Anúncio criado com fotos
- [ ] Fotos visíveis no anúncio publicado
- [ ] Primeira foto é a capa

### Teste 3: Validações de Erro

**Objetivo:** Garantir que validações funcionam

**Cenários:**

#### 3.1 Arquivo Muito Grande
- Selecionar arquivo > 10MB
- ✅ Deve mostrar erro: "Arquivo muito grande. Máximo: 10MB"

#### 3.2 Tipo Inválido
- Selecionar arquivo .pdf ou .txt
- ✅ Deve mostrar erro: "Tipo não suportado..."

#### 3.3 Sem Login
- Fazer logout
- Tentar acessar `/test/upload-fotos`
- ✅ Deve mostrar erro: "Você precisa estar logado..."

#### 3.4 Falha de Rede
- Desconectar internet durante upload
- ✅ Deve mostrar erro e permitir retry

**Validações:**
- [ ] Validação de tamanho funciona
- [ ] Validação de tipo funciona
- [ ] Validação de autenticação funciona
- [ ] Erros são exibidos claramente

### Teste 4: Performance

**Objetivo:** Validar compressão e velocidade

**Cenários:**

#### 4.1 Foto Grande (5-10MB)
- Upload de foto 8MB JPEG
- ✅ Deve comprimir para ~1-2MB WebP
- ✅ Thumbnail ~100-200KB
- ✅ Upload em < 10 segundos (conexão normal)

#### 4.2 Múltiplas Fotos
- Upload de 5 fotos simultaneamente
- ✅ Progresso individual por foto
- ✅ Upload paralelo (não sequencial)
- ✅ Todas completam com sucesso

#### 4.3 Foto Pequena (< 1MB)
- Upload de foto 500KB PNG
- ✅ Ainda comprime para WebP
- ✅ Mantém qualidade visual
- ✅ Upload rápido (< 3 segundos)

**Validações:**
- [ ] Compressão efetiva (50-70% redução)
- [ ] Qualidade visual mantida
- [ ] Upload paralelo funciona
- [ ] Performance aceitável

### Teste 5: Verificação no Storage

**Objetivo:** Validar estrutura de pastas e arquivos

**Passos:**
1. Após upload bem-sucedido
2. Ir no Supabase Dashboard > Storage > classified-images
3. Navegar até pasta do usuário (profileId)
4. Verificar estrutura:

```
classified-images/
└── {profileId}/
    ├── images/
    │   ├── 1234567890-abc123.webp
    │   └── 1234567891-def456.webp
    └── thumbnails/
        ├── 1234567890-abc123.webp
        └── 1234567891-def456.webp
```

**Validações:**
- [ ] Pasta do usuário criada
- [ ] Subpastas images/ e thumbnails/
- [ ] Arquivos em formato WebP
- [ ] Nomes únicos (timestamp + random)
- [ ] Thumbnails menores que imagens

## 🐛 Troubleshooting

### Erro: "Bucket not found"
**Solução:** Aplicar migration do bucket

### Erro: "Permission denied"
**Solução:** Verificar políticas RLS no Storage

### Erro: "Failed to compress"
**Solução:** 
- Verificar se biblioteca está instalada: `npm list browser-image-compression`
- Reinstalar: `npm install browser-image-compression --legacy-peer-deps`

### Upload muito lento
**Possíveis causas:**
- Conexão lenta
- Arquivo muito grande (> 5MB)
- Muitas fotos simultâneas (> 10)

**Solução:**
- Reduzir número de fotos por vez
- Verificar conexão de internet

### Imagens não aparecem após upload
**Verificar:**
1. URLs retornadas são públicas?
2. Bucket está configurado como público?
3. Políticas RLS permitem leitura pública?

## ✅ Checklist Final

Antes de considerar o sistema pronto para produção:

### Funcionalidade
- [ ] Upload de imagem única funciona
- [ ] Upload de múltiplas imagens funciona
- [ ] Compressão reduz tamanho significativamente
- [ ] Thumbnails são gerados corretamente
- [ ] Progresso em tempo real funciona
- [ ] Validações de erro funcionam
- [ ] Toast notifications aparecem

### Integração
- [ ] Formulário de criação integrado
- [ ] Fotos salvas no banco de dados
- [ ] Fotos aparecem no anúncio publicado
- [ ] Primeira foto é a capa
- [ ] Reordenação de fotos funciona

### Performance
- [ ] Upload completa em tempo razoável (< 15s para 5 fotos)
- [ ] Compressão não trava a UI
- [ ] Múltiplos uploads simultâneos funcionam
- [ ] Não há memory leaks

### Segurança
- [ ] Apenas usuários autenticados podem fazer upload
- [ ] Usuários só acessam suas próprias pastas
- [ ] Validação de tipo de arquivo funciona
- [ ] Validação de tamanho funciona
- [ ] URLs são públicas mas organizadas por usuário

### UX/UI
- [ ] Feedback visual claro
- [ ] Mensagens de erro compreensíveis
- [ ] Botões desabilitados durante upload
- [ ] Preview local antes do upload
- [ ] Indicadores de progresso visíveis

## 🚀 Após Validação

### 1. Remover Código de Teste
```bash
# Deletar arquivos de teste:
rm src/modules/classifieds/pages/TestUploadPage.tsx
rm src/modules/classifieds/components/create/PhotoUploadTest.tsx

# Remover rota de teste do App.tsx
# Remover import de TestUploadPage
```

### 2. Monitoramento
- Configurar logs de erro no Sentry/similar
- Monitorar tamanho médio de upload
- Acompanhar taxa de sucesso/falha
- Verificar uso de storage

### 3. Otimizações Futuras
- [ ] Implementar retry automático em caso de falha
- [ ] Adicionar preview em fullscreen
- [ ] Implementar crop/edição básica
- [ ] Adicionar marca d'água opcional
- [ ] Implementar lazy loading de imagens
- [ ] Configurar CDN para melhor performance

## 📊 Métricas Esperadas

### Compressão
- Foto 5MB JPEG → ~1.5MB WebP (70% redução)
- Foto 2MB PNG → ~800KB WebP (60% redução)
- Thumbnail → ~150KB (95% redução vs original)

### Tempo de Upload (conexão 10Mbps)
- 1 foto (2MB) → ~3-5 segundos
- 5 fotos (10MB total) → ~10-15 segundos
- 10 fotos (20MB total) → ~20-30 segundos

### Qualidade Visual
- Imagem principal: Alta (indistinguível do original)
- Thumbnail: Boa (adequada para preview)

## 📝 Notas

- Todos os testes devem ser feitos em ambiente de desenvolvimento primeiro
- Validar em diferentes navegadores (Chrome, Firefox, Safari)
- Testar em mobile (responsividade e performance)
- Documentar qualquer comportamento inesperado
- Manter este guia atualizado conforme mudanças
