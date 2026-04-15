# COMANDOS DE HOMOLOGAÇÃO

Referência rápida para executar testes de homologação.

---

## EXECUTAR TODOS OS TESTES

```bash
# 1. Criação de perfis (6 testes)
npx tsx scripts/homologacao-criacao-perfis.ts

# 2. Membros e links (7 testes)
npx tsx scripts/homologacao-membros-links.ts

# 3. Privacidade (6 testes)
npx tsx scripts/homologacao-privacidade.ts

# 4. Segurança RLS (6 testes)
npx tsx scripts/homologacao-seguranca-rls.ts

# 5. Relatório consolidado
npx tsx scripts/gerar-relatorio-consolidado.ts

# 6. Validação do banco
npx tsx scripts/validacao-banco-final.ts
```

---

## EXECUTAR TUDO DE UMA VEZ

```bash
npx tsx scripts/homologacao-criacao-perfis.ts && \
npx tsx scripts/homologacao-membros-links.ts && \
npx tsx scripts/homologacao-privacidade.ts && \
npx tsx scripts/homologacao-seguranca-rls.ts && \
npx tsx scripts/gerar-relatorio-consolidado.ts && \
npx tsx scripts/validacao-banco-final.ts
```

---

## VERIFICAR RESULTADOS

```bash
# Ver relatórios JSON
cat HOMOLOGACAO_CONSOLIDADA.json
cat VALIDACAO_BANCO_FINAL.json

# Ver relatórios individuais
cat HOMOLOGACAO_CRIACAO_PERFIS.json
cat HOMOLOGACAO_MEMBROS_LINKS.json
cat HOMOLOGACAO_PRIVACIDADE.json
cat HOMOLOGACAO_SEGURANCA_RLS.json
```

---

## DEPLOY EDGE FUNCTIONS (PENDENTE)

```bash
# Deploy admin functions
npx supabase functions deploy admin-verify-profile --project-ref xhdowzacfujckjelqhtd
npx supabase functions deploy admin-suspend-profile --project-ref xhdowzacfujckjelqhtd

# Verificar deploy
npx supabase functions list --project-ref xhdowzacfujckjelqhtd
```

---

## VALIDAR BUILD

```bash
# Build completo
npm run build

# Apenas lint
npm run lint

# Apenas validação session-context
npm run validate:session-context
```

---

## RESULTADO ESPERADO

Todos os scripts devem retornar:
- Exit code: 0
- Todos os testes: ✅ PASSOU
- Taxa de sucesso: 100%

Se algum teste falhar:
1. Ver evidência no JSON correspondente
2. Verificar migrations aplicadas: `npx supabase db push --linked`
3. Re-executar teste específico
4. Consultar `RELATORIO_HOMOLOGACAO_FINAL.md`

---

**Última execução**: 2026-03-28 01:40  
**Resultado**: ✅ 25/25 testes passaram (100%)
