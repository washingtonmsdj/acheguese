# ✅ Feature: Upload Real de Fotos com Compressão e Thumbnails

## 📋 Resumo
Sistema completo de upload de imagens para classificados integrado ao Supabase Storage, com compressão automática, geração de thumbnails e indicadores de progresso em tempo real.

## 🎯 Arquitetura SSOT

### 1. Service Layer
**Arquivo:** `src/core/classifieds/services/ClassifiedImageService.ts`

Serviço centralizado que gerencia todo o ciclo de vida das imagens:

#### Features Implementadas:
- ✅ Validação de tipo e tamanho de arquivo
- ✅ Compressão automática (max 1920px, WebP)
- ✅ Geração de thumbnails (max 400px, WebP)
- ✅ Upload para Supabase Storage
- ✅ Obtenção de dimensões da imagem
- ✅ Deleção de imagens e thumbnails
- ✅ Upload em lote com progresso individual
- ✅ Tratamento de erros robusto

#### Constantes:
```typescript
STORAGE_BUCKET = "classified-images"
MAX_FILE_SIZE = 10MB (antes da compressão)
ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

IMAGE_CONSTRAINTS:
  - maxSizeMB: 5
  - maxWidthOrHeight: 1920
  - fileType: "image/webp"

THUMBNAIL_CONSTRAINTS:
  - maxSizeMB: 0.5
  - maxWidthOrHeight: 400
  - fileType: "image/webp"
```

#### Métodos Principais:

```typescript
// Validação
validateImage(file: File): { valid: boolean; error?: string }

// Compressão
compressImage(file: File): Promise<File>
generateThumbnail(file: File): Promise<File>

// Dimensões
getImageDimensions(file: File): Promise<{ width, height }>

// Upload
uploadToStorage(file: File, userId: string, folder: "images" | "thumbnails"): Promise<string>
uploadClassifiedImage(file: File, userId: string, onProgress?: callback): Promise<UploadedImage>
uploadMultipleImages(files: File[], userId: string, onProgress?: callback): Promise<UploadedImage[]>

// Deleção
deleteImage(imageUrl: string): Promise<void>
deleteMultipleImages(imageUrls: string[]): Promise<void>
```

### 2. Hook React
**Arquivo:** `src/modules/classifieds/hooks/useClassifiedImageUpload.ts`

Hook que encapsula o serviço com estado React e callbacks:

#### Estado Gerenciado:
```typescript
{
  uploading: boolean,
  progress: Record<string, UploadProgress>,
  uploadedImages: UploadedImage[],
  error: string | null
}
```

#### Métodos Expostos:
```typescript
validateImage(file: File)
uploadImage(file: File): Promise<UploadedImage | null>
uploadMultipleImages(files: File[]): Promise<UploadedImage[]>
deleteImage(imageUrl: string): Promise<void>
reset(): void
```

#### Features:
- ✅ Validação automática com toast de erro
- ✅ Progresso individual por arquivo
- ✅ Toast de sucesso/erro
- ✅ Estado de loading global
- ✅ Histórico de imagens enviadas

### 3. Integração no Formulário
**Arquivo:** `src/modules/classifieds/pages/NovoClassificadoPage.tsx`

#### Mudanças Implementadas:

1. **Import do Hook:**
```typescript
const {
  uploadMultipleImages,
  uploading: uploadingImages,
  progress: uploadProgress,
} = useClassifiedImageUpload();
```

2. **Upload no Submit:**
```typescript
// Upload das fotos antes de criar anúncio
if (photos.length > 0) {
  toast.info("Enviando fotos...");
  const uploadedImages = await uploadMultipleImages(photos);
  photoUrls = uploadedImages.map((img) => img.url);
}

// Criar anúncio com URLs das fotos
await classifiedService.createClassified(activeProfile.id, {
  // ...outros campos
  photos: photoUrls,
});
```

3. **Indicadores de Progresso:**
```typescript
{uploadingImages && Object.keys(uploadProgress).length > 0 && (
  <div className="space-y-2 p-3 rounded-xl bg-primary/5">
    {Object.entries(uploadProgress).map(([fileName, progress]) => (
      <div key={fileName}>
        <span>{fileName}</span>
        <span>{progress.progress}%</span>
        <div className="progress-bar" style={{ width: `${progress.progress}%` }} />
      </div>
    ))}
  </div>
)}
```

4. **Botão Desabilitado Durante Upload:**
```typescript
<Button
  onClick={handlePublish}
  disabled={publishing || uploadingImages}
>
  {uploadingImages ? "Enviando fotos..." : "Publicar Anúncio"}
</Button>
```

## 🎨 Fluxo de Upload

### Passo a Passo:

1. **Usuário seleciona fotos** → Preview local imediato
2. **Clica em "Publicar"** → Validação dos campos
3. **Upload inicia:**
   - Para cada foto:
     - Validação (tipo, tamanho)
     - Compressão (1920px, WebP)
     - Geração de thumbnail (400px, WebP)
     - Upload da imagem principal
     - Upload do thumbnail
     - Callback de progresso (0-100%)
4. **URLs retornadas** → Salvas no banco de dados
5. **Anúncio criado** → Redirecionamento

### Estrutura no Storage:

```
classified-images/
├── {userId}/
│   ├── images/
│   │   ├── 1234567890-abc123.webp
│   │   └── 1234567891-def456.webp
│   └── thumbnails/
│       ├── 1234567890-abc123.webp
│       └── 1234567891-def456.webp
```

## 📊 Tipos TypeScript

```typescript
interface UploadedImage {
  url: string;
  thumbnailUrl: string;
  fileName: string;
  size: number;
  width?: number;
  height?: number;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "compressing" | "uploading" | "complete" | "error";
  error?: string;
}
```

## 🔒 Validações

### Tipo de Arquivo:
- JPEG/JPG ✅
- PNG ✅
- WebP ✅
- GIF ✅
- Outros ❌

### Tamanho:
- Antes da compressão: max 10MB
- Após compressão: ~1-2MB (imagem principal)
- Thumbnail: ~100-200KB

### Dimensões:
- Imagem principal: max 1920px (lado maior)
- Thumbnail: max 400px (lado maior)
- Proporção mantida automaticamente

## ⚡ Performance

### Otimizações:
- ✅ Compressão com Web Worker (não bloqueia UI)
- ✅ Upload paralelo de múltiplas imagens
- ✅ Conversão para WebP (menor tamanho)
- ✅ Cache de 1 ano no Storage
- ✅ Preview local antes do upload

### Métricas Esperadas:
- Foto 5MB (JPEG) → ~1.5MB (WebP comprimido)
- Thumbnail → ~150KB
- Upload de 5 fotos: ~10-15 segundos (depende da conexão)

## 🎯 UX/UI

### Feedback Visual:
1. **Preview imediato** ao selecionar fotos
2. **Barra de progresso** individual por foto
3. **Porcentagem** em tempo real
4. **Status textual**: "Comprimindo...", "Enviando...", "Completo"
5. **Toast notifications** de sucesso/erro
6. **Botão desabilitado** durante upload
7. **Texto dinâmico** no botão

### Estados:
- Idle: "Publicar Anúncio"
- Uploading: "Enviando fotos..." + spinner
- Publishing: "Publicando..." + spinner
- Error: Toast vermelho com mensagem
- Success: Toast verde + redirecionamento

## 🔧 Configuração Necessária

### 1. Supabase Storage Bucket

Criar bucket `classified-images` com:
- Public: ✅ (para URLs públicas)
- File size limit: 10MB
- Allowed MIME types: image/*

### 2. Políticas RLS (Row Level Security)

```sql
-- Permitir upload para usuários autenticados
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'classified-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir leitura pública
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'classified-images');

-- Permitir deleção das próprias imagens
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'classified-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. Dependências NPM

```bash
npm install browser-image-compression --legacy-peer-deps
```

## 🐛 Tratamento de Erros

### Erros Capturados:
- ❌ Tipo de arquivo inválido
- ❌ Arquivo muito grande
- ❌ Falha na compressão
- ❌ Falha no upload
- ❌ Falha ao obter dimensões
- ❌ Usuário não autenticado

### Mensagens Amigáveis:
```typescript
"Tipo não suportado. Use: JPEG, PNG, WebP ou GIF"
"Arquivo muito grande. Máximo: 10MB"
"Falha ao comprimir imagem"
"Falha no upload: [mensagem do erro]"
"Você precisa estar logado para fazer upload"
```

## 🔄 Próximos Passos (Sugestões)

1. **Edição de Imagens:**
   - Crop/recorte
   - Rotação
   - Filtros básicos

2. **Otimizações:**
   - Lazy loading de thumbnails
   - Progressive JPEG
   - CDN para imagens

3. **Features Avançadas:**
   - Drag & drop para reordenar
   - Zoom/preview em fullscreen
   - Marca d'água automática
   - Detecção de conteúdo impróprio (AI)

4. **Analytics:**
   - Tempo médio de upload
   - Taxa de compressão
   - Formatos mais usados

## 📝 Notas Técnicas

- Todas as imagens são convertidas para WebP (melhor compressão)
- Thumbnails são gerados localmente (não no servidor)
- Upload é feito diretamente para Supabase Storage (não passa pelo backend)
- URLs são públicas mas path contém userId (organização)
- Cache de 1 ano configurado (performance)
- Nomes de arquivo únicos (timestamp + random)

## ✅ Checklist de Implementação

- [x] Criar ClassifiedImageService
- [x] Criar useClassifiedImageUpload hook
- [x] Instalar browser-image-compression
- [x] Integrar no NovoClassificadoPage
- [x] Adicionar indicadores de progresso
- [x] Atualizar botão de publicar
- [x] Tratamento de erros
- [x] Toast notifications
- [ ] Criar bucket no Supabase
- [ ] Configurar políticas RLS
- [ ] Testar upload real
- [ ] Testar compressão
- [ ] Testar thumbnails
- [ ] Validar performance
