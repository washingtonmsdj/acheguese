# ⚡ Comandos Rápidos: Upload de Fotos

## 🚀 Deploy

### Aplicar Migration
```bash
# Via CLI
supabase db push

# Ou copiar SQL manualmente
cat supabase/migrations/20260401000004_create_classified_images_bucket.sql
# Colar no Supabase Dashboard > SQL Editor > Executar
```

### Verificar Instalação
```bash
# Verificar biblioteca
npm list browser-image-compression

# Reinstalar se necessário
npm install browser-image-compression --legacy-peer-deps
```

## 🧪 Testes

### Acessar Página de Teste
```
http://localhost:5173/test/upload-fotos
```

### Criar Anúncio com Fotos
```
http://localhost:5173/classificados/novo
```

### Verificar Storage (Supabase Dashboard)
```
Storage > classified-images > {profileId} > images/
Storage > classified-images > {profileId} > thumbnails/
```

## 🔍 Verificações

### Verificar Bucket Criado
```sql
SELECT * FROM storage.buckets WHERE id = 'classified-images';
```

### Verificar Políticas RLS
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%classified images%';
```

### Listar Arquivos Enviados
```sql
SELECT name, size, created_at 
FROM storage.objects 
WHERE bucket_id = 'classified-images' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Verificar Tamanho Total do Storage
```sql
SELECT 
  bucket_id,
  COUNT(*) as total_files,
  SUM(size) as total_size_bytes,
  ROUND(SUM(size)::numeric / 1024 / 1024, 2) as total_size_mb
FROM storage.objects 
WHERE bucket_id = 'classified-images'
GROUP BY bucket_id;
```

## 🧹 Limpeza (Após Validação)

### Remover Arquivos de Teste
```bash
rm src/modules/classifieds/pages/TestUploadPage.tsx
rm src/modules/classifieds/components/create/PhotoUploadTest.tsx
```

### Remover do App.tsx
```typescript
// Remover estas linhas:
const TestUploadPage = lazy(() => import("./modules/classifieds/pages/TestUploadPage"));
<Route path="/test/upload-fotos" element={<TestUploadPage />} />
```

## 🐛 Debug

### Ver Logs de Erro no Console
```javascript
// No navegador (F12 > Console)
// Filtrar por: "ClassifiedImageService" ou "upload"
```

### Testar Compressão Isoladamente
```javascript
// No console do navegador
import imageCompression from 'browser-image-compression';

const file = document.querySelector('input[type="file"]').files[0];
const compressed = await imageCompression(file, {
  maxSizeMB: 5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp'
});

console.log('Original:', file.size / 1024 / 1024, 'MB');
console.log('Comprimido:', compressed.size / 1024 / 1024, 'MB');
```

### Verificar Permissões RLS
```sql
-- Testar como usuário específico
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-id-aqui"}';

-- Tentar upload (deve funcionar)
SELECT storage.foldername('user-id-aqui/images/test.webp');

-- Tentar upload em pasta de outro usuário (deve falhar)
SELECT storage.foldername('outro-user-id/images/test.webp');
```

## 📊 Métricas

### Calcular Taxa de Compressão
```javascript
const originalSize = file.size;
const compressedSize = compressedFile.size;
const compressionRate = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
console.log(`Compressão: ${compressionRate}%`);
```

### Medir Tempo de Upload
```javascript
const startTime = Date.now();
await uploadImage(file);
const endTime = Date.now();
console.log(`Tempo de upload: ${(endTime - startTime) / 1000}s`);
```

## 🔧 Troubleshooting

### Erro: "Bucket not found"
```bash
# Aplicar migration novamente
supabase db push

# Ou criar bucket manualmente
# Dashboard > Storage > New bucket > classified-images
```

### Erro: "Permission denied"
```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- Recriar políticas se necessário
-- Executar migration novamente
```

### Erro: "Failed to compress"
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm install browser-image-compression --legacy-peer-deps
```

### Upload muito lento
```javascript
// Reduzir qualidade de compressão
const options = {
  maxSizeMB: 3, // Reduzir de 5 para 3
  maxWidthOrHeight: 1600, // Reduzir de 1920 para 1600
  useWebWorker: true,
  fileType: 'image/webp'
};
```

## 📱 Teste em Diferentes Dispositivos

### Desktop
```
Chrome: ✅
Firefox: ✅
Safari: ✅
Edge: ✅
```

### Mobile
```
Chrome Mobile: ✅
Safari iOS: ✅
Firefox Mobile: ✅
```

## 🎯 Validação Rápida

### Checklist de 5 Minutos
```bash
# 1. Aplicar migration
supabase db push

# 2. Acessar teste
open http://localhost:5173/test/upload-fotos

# 3. Upload 1 foto
# (fazer manualmente no navegador)

# 4. Verificar storage
# (Supabase Dashboard > Storage)

# 5. Criar anúncio
open http://localhost:5173/classificados/novo
# (fazer manualmente)
```

## 📚 Links Úteis

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression)
- [WebP Format](https://developers.google.com/speed/webp)
- [Guia Completo](./GUIA_TESTE_UPLOAD_FOTOS.md)
- [Documentação Técnica](./FEATURE_UPLOAD_FOTOS_CLASSIFICADOS.md)

---

**Dica:** Salve este arquivo nos favoritos para acesso rápido aos comandos mais usados!
