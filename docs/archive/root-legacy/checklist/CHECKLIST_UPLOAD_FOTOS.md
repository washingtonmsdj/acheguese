# ✅ Checklist: Sistema de Upload de Fotos

## 📦 Implementação (COMPLETO)

- [x] ClassifiedImageService criado
- [x] useClassifiedImageUpload hook criado
- [x] Integração no NovoClassificadoPage
- [x] Migration SQL criada
- [x] Componentes de teste criados
- [x] Rota de teste adicionada
- [x] Biblioteca instalada (browser-image-compression)
- [x] Documentação completa
- [x] Guia de testes criado

## 🚀 Deploy (PENDENTE)

### 1. Aplicar Migration
- [ ] Executar: `supabase db push`
- [ ] OU aplicar via Dashboard SQL Editor
- [ ] Verificar bucket criado: Storage > classified-images

### 2. Configurar Bucket
- [ ] Bucket é público: ✅
- [ ] File size limit: 10MB
- [ ] Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif

### 3. Verificar Políticas RLS
- [ ] "Users can upload own classified images" ativa
- [ ] "Public read access to classified images" ativa
- [ ] "Users can update own classified images" ativa
- [ ] "Users can delete own classified images" ativa

## 🧪 Testes (PENDENTE)

### Teste Isolado
- [ ] Acessar `/test/upload-fotos`
- [ ] Upload de 1 foto funciona
- [ ] Upload de múltiplas fotos funciona
- [ ] Compressão reduz tamanho
- [ ] Thumbnails são gerados
- [ ] Progresso em tempo real
- [ ] URLs acessíveis

### Teste Integrado
- [ ] Criar anúncio em `/classificados/novo`
- [ ] Adicionar fotos no step 4
- [ ] Preview local funciona
- [ ] Upload durante publicação
- [ ] Anúncio criado com fotos
- [ ] Fotos aparecem no anúncio publicado
- [ ] Primeira foto é a capa

### Validações de Erro
- [ ] Arquivo > 10MB é rejeitado
- [ ] Tipo inválido é rejeitado
- [ ] Sem login mostra erro
- [ ] Mensagens de erro são claras

### Performance
- [ ] Foto 5MB → ~1.5MB (compressão)
- [ ] Thumbnail ~150KB
- [ ] Upload 5 fotos < 15 segundos
- [ ] UI não trava durante compressão

### Storage
- [ ] Estrutura de pastas correta
- [ ] Arquivos em formato WebP
- [ ] Thumbnails menores que originais
- [ ] Nomes únicos (timestamp + random)

## 🧹 Limpeza (APÓS VALIDAÇÃO)

- [ ] Deletar `src/modules/classifieds/pages/TestUploadPage.tsx`
- [ ] Deletar `src/modules/classifieds/components/create/PhotoUploadTest.tsx`
- [ ] Remover import de TestUploadPage do `App.tsx`
- [ ] Remover rota `/test/upload-fotos` do `App.tsx`
- [ ] Atualizar documentação (remover referências a testes)

## 📊 Monitoramento (PÓS-DEPLOY)

- [ ] Configurar logs de erro
- [ ] Monitorar uso de storage
- [ ] Acompanhar taxa de sucesso/falha
- [ ] Coletar métricas de performance
- [ ] Verificar tamanho médio de upload

## 🎯 Validação Final

### Funcionalidade
- [ ] Upload funciona 100%
- [ ] Compressão efetiva
- [ ] Thumbnails corretos
- [ ] Progresso preciso
- [ ] Validações funcionam

### Segurança
- [ ] RLS protege uploads
- [ ] Apenas próprias pastas
- [ ] Leitura pública OK
- [ ] Validações de tipo/tamanho

### Performance
- [ ] Tempo aceitável (< 15s para 5 fotos)
- [ ] UI responsiva
- [ ] Sem memory leaks
- [ ] Upload paralelo funciona

### UX/UI
- [ ] Feedback visual claro
- [ ] Mensagens compreensíveis
- [ ] Botões desabilitados corretamente
- [ ] Preview funciona
- [ ] Progresso visível

## 📝 Documentação

- [x] FEATURE_UPLOAD_FOTOS_CLASSIFICADOS.md
- [x] GUIA_TESTE_UPLOAD_FOTOS.md
- [x] IMPLEMENTACAO_COMPLETA_UPLOAD_FOTOS.md
- [x] CHECKLIST_UPLOAD_FOTOS.md (este arquivo)
- [ ] Atualizar README.md (se necessário)
- [ ] Documentar APIs (se necessário)

## 🚦 Status Geral

| Componente | Status |
|------------|--------|
| Service Layer | ✅ Completo |
| Hook React | ✅ Completo |
| Integração UI | ✅ Completo |
| Migration SQL | ✅ Completo |
| Testes | ⏳ Pendente |
| Deploy | ⏳ Pendente |
| Validação | ⏳ Pendente |
| Limpeza | ⏳ Pendente |

## 🎓 Próximos Passos Imediatos

1. **Aplicar Migration**
   ```bash
   supabase db push
   ```

2. **Testar Upload**
   - Acessar `/test/upload-fotos`
   - Fazer upload de 2-3 fotos
   - Verificar sucesso

3. **Testar Integração**
   - Criar anúncio completo
   - Verificar fotos no anúncio

4. **Validar Storage**
   - Verificar estrutura de pastas
   - Confirmar formato WebP

5. **Limpar Código de Teste**
   - Remover arquivos de teste
   - Atualizar App.tsx

---

**Última atualização:** 2026-04-01
**Status:** ✅ Código completo - Aguardando deploy e testes
