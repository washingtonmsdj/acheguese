# Guia de Testes: Business com Bairro Obrigatório

**Data**: 2026-03-29  
**Servidor**: http://localhost:8081/  
**Status**: ✅ Servidor rodando e pronto para testes

---

## 🎯 URLs para Testar

### 1. Hub da Cidade (3 segmentos)
```
URL: http://localhost:8081/empresas/ba/salvador
```
**Esperado**: 
- ✅ Página carrega sem erros
- ✅ Mostra lista de empresas de Salvador
- ✅ Breadcrumb: Bahia > Salvador > Empresas

---

### 2. Hub do Bairro (4 segmentos)
```
URL: http://localhost:8081/empresas/ba/salvador/centro
```
**Esperado**: 
- ✅ Página carrega sem erros
- ✅ Mostra lista de empresas do Centro
- ✅ Breadcrumb: Bahia > Salvador > Centro > Empresas

---

### 3. Empresa Específica (5 segmentos)
```
URL: http://localhost:8081/empresas/ba/salvador/centro/test-business-1774756624886
```
**Esperado**: 
- ✅ Página da empresa carrega
- ✅ Mostra detalhes da empresa "Test Business Slug History"
- ✅ URL permanece estável (não redireciona)
- ✅ Breadcrumb: Bahia > Salvador > Centro > [Nome da Empresa]

---

### 4. URL Antiga sem Bairro (Slug History)
```
URL: http://localhost:8081/empresas/ba/salvador/test-business-1774756624886
```
**Comportamento Esperado**:

**Opção A - Se houver registro em slug history**:
- ✅ Redirect 308 para: `/empresas/ba/salvador/centro/test-business-1774756624886`
- ✅ Navegador atualiza URL automaticamente
- ✅ Página da empresa carrega

**Opção B - Se NÃO houver registro em slug history**:
- ✅ Mostra página 404
- ✅ Mensagem: "Território não encontrado"

**Nota**: Como a migration de slug history não foi aplicada, provavelmente será Opção B (404).

---

### 5. Link Premium (se aplicável)
```
URL: http://localhost:8081/p/test-business-1774756624886
```
**Esperado**: 
- ✅ Redirect 308 para URL canônica com bairro
- ✅ URL final: `/empresas/ba/salvador/centro/test-business-1774756624886`

---

## 🔍 Checklist de Validação

### Console do Navegador (F12)
- [ ] Sem erros críticos (vermelho)
- [ ] Warnings esperados (amarelo) são aceitáveis
- [ ] Logs de routing aparecem (se DEV mode)

### Network Tab (F12 > Network)
- [ ] Status 200 para página principal
- [ ] Status 308 para redirects (se aplicável)
- [ ] Requisições de API retornam dados corretos

### Comportamento Visual
- [ ] Página carrega completamente
- [ ] Imagens e estilos aplicados
- [ ] Breadcrumb correto
- [ ] Seletor de território atualiza corretamente

---

## 🐛 Troubleshooting

### Problema: 404 em todas as URLs
**Causa**: Rotas não foram aplicadas corretamente  
**Solução**: 
```bash
# Reiniciar servidor
Ctrl+C
npm run dev
```

### Problema: Empresa não carrega (404)
**Causa**: `location_id` da empresa não aponta para bairro  
**Debug**:
```bash
npx tsx scripts/check-business-location.ts
```

### Problema: Redirect infinito
**Causa**: Conflito entre rotas ou slug history  
**Debug**: 
1. Verificar console do navegador
2. Verificar Network tab para ver loop de redirects
3. Limpar cache do navegador (Ctrl+Shift+Delete)

### Problema: Seletor de território mostra slug da empresa
**Causa**: `BusinessRouteResolver` não está diferenciando corretamente  
**Debug**: Verificar logs no console (modo DEV)

---

## 📊 Dados de Teste Disponíveis

### Empresas Ativas
1. **Test Business Slug History**
   - Slug: `test-business-1774756624886`
   - Bairro: Centro
   - URL: `/empresas/ba/salvador/centro/test-business-1774756624886`

2. **Tonecos Studios**
   - Slug: `tonecos-studios`
   - Bairro: Centro
   - URL: `/empresas/ba/salvador/centro/tonecos-studios`

### Territórios
- **País**: Brasil (`br`)
- **Estado**: Bahia (`ba`)
- **Cidade**: Salvador (`salvador`)
- **Bairro**: Centro (`centro`)

---

## ✅ Resultado Esperado

Após os testes, você deve conseguir:

1. ✅ Navegar para hub da cidade
2. ✅ Navegar para hub do bairro
3. ✅ Abrir página de empresa específica
4. ✅ Ver breadcrumb correto em todas as páginas
5. ✅ Seletor de território funciona corretamente

---

## 📝 Próximos Passos Após Validação

Se todos os testes passarem:

1. ✅ Marcar implementação como concluída
2. ⚠️ Decidir sobre aplicação da migration pendente
3. 🚀 Preparar para deploy em staging
4. 📊 Monitorar logs de 404 em produção

Se houver problemas:

1. 🐛 Documentar erro encontrado
2. 🔍 Executar debug conforme troubleshooting
3. 🔧 Aplicar correção necessária
4. 🔄 Repetir testes

---

## 🎯 Conclusão

Servidor rodando e pronto para testes manuais. Siga as URLs acima e valide cada comportamento esperado.

**Boa sorte nos testes! 🚀**
