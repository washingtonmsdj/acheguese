# TESTE RUNTIME - ADMIN PRICING

## EXECUÇÃO: [DATA/HORA]

---

## TESTE 1: ACESSO À PÁGINA

### Ação
Acessar `http://localhost:8080/admin/pricing`

### Resultado
- [ ] Página carregou
- [ ] Header exibe "Gerenciamento de Pricing"
- [ ] Botões visíveis: "Ver Auditoria", "Refresh", "Nova Regra"
- [ ] Lista de regras exibida
- [ ] Sem erros no console

### Observações
```
[Anotar aqui qualquer erro ou comportamento inesperado]
```

---

## TESTE 2: LISTAR REGRAS

### Ação
Observar lista de regras

### Resultado
- [ ] Regras agrupadas por modalidade
- [ ] Cada grupo exibe nome da modalidade
- [ ] Cada regra exibe: nome, status, valores
- [ ] Badges de status corretos (Ativa/Inativa)
- [ ] Contadores de multiplicadores/taxas visíveis
- [ ] Botões de ação (Editar, Power) visíveis

### Dados Observados
```
Modalidade: [nome]
- Regra 1: [nome] - Status: [ativa/inativa]
- Regra 2: [nome] - Status: [ativa/inativa]
...
```

---

## TESTE 3: CRIAR REGRA

### Ação
1. Clicar "Nova Regra"
2. Preencher:
   - Modalidade: Corrida
   - Nome: "Teste Runtime"
   - Tarifa Base: 5.00
   - Preço por Km: 2.50
   - Preço por Minuto: 0.50
   - Valor Mínimo: 8.00
   - Regra Ativa: Desativada
3. Clicar "Criar"

### Resultado
- [ ] Dialog abriu
- [ ] Form preenchido corretamente
- [ ] Toast de sucesso exibido
- [ ] Dialog fechou
- [ ] Lista atualizou automaticamente
- [ ] Nova regra aparece na lista
- [ ] Sem erros no console

### Observações
```
[Anotar aqui qualquer erro ou comportamento inesperado]
```

---

## TESTE 4: EDITAR REGRA

### Ação
1. Clicar ícone de editar na regra "Teste Runtime"
2. Alterar:
   - Nome: "Teste Runtime Editado"
   - Tarifa Base: 6.00
3. Clicar "Atualizar"

### Resultado
- [ ] Dialog abriu com dados preenchidos
- [ ] Alterações aplicadas
- [ ] Toast de sucesso exibido
- [ ] Dialog fechou
- [ ] Lista atualizou automaticamente
- [ ] Regra exibe novos valores
- [ ] Sem erros no console

### Observações
```
[Anotar aqui qualquer erro ou comportamento inesperado]
```

---

## TESTE 5: ATIVAR REGRA

### Ação
Clicar ícone de power (verde) na regra "Teste Runtime Editado"

### Resultado
- [ ] Toast de sucesso exibido
- [ ] Badge mudou para "Ativa"
- [ ] Ícone mudou para power off (vermelho)
- [ ] Lista atualizou
- [ ] Sem erros no console

### Observações
```
[Anotar aqui qualquer erro ou comportamento inesperado]
```

---

## TESTE 6: CONFLITO DE REGRA ATIVA

### Ação
Tentar ativar outra regra de "Corrida"

### Resultado
- [ ] Toast de erro exibido
- [ ] Mensagem: "Conflito: já existe regra ativa para este modo"
- [ ] Operação não realizada
- [ ] Regra anterior permanece ativa
- [ ] Estado consistente

### Observações
```
[Anotar aqui qualquer erro ou comportamento inesperado]
```

---

## TESTE 7: VER AUDITORIA

### Ação
Clicar "Ver Auditoria"

### Resultado
- [ ] Seção de auditoria expandiu
- [ ] Lista de alterações exibida
- [ ] Cada entrada mostra: badge, nome, modo, timestamp
- [ ] Badges coloridos por tipo de ação
- [ ] Timestamps relativos corretos
- [ ] Sem erros no console

### Dados Observados
```
Total de registros: [número]
Ações listadas:
- [ação] - [regra] - [timestamp]
...
```

---

## TESTE 8: DESATIVAR REGRA

### Ação
Clicar ícone de power off (vermelho) na regra ativa

### Resultado
- [ ] Toast de sucesso exibido
- [ ] Badge mudou para "Inativa"
- [ ] Ícone mudou para power (verde)
- [ ] Lista atualizou
- [ ] Sem erros no console

### Observações
```
[Anotar aqui qualquer erro ou comportamento inesperado]
```

---

## TESTE 9: REFRESH

### Ação
Clicar botão "Refresh"

### Resultado
- [ ] Ícone girou (animação)
- [ ] Lista recarregou
- [ ] Dados atualizados
- [ ] Sem erros no console

### Observações
```
[Anotar aqui qualquer erro ou comportamento inesperado]
```

---

## RESUMO DOS TESTES

### Sucessos
- [ ] Teste 1: Acesso à página
- [ ] Teste 2: Listar regras
- [ ] Teste 3: Criar regra
- [ ] Teste 4: Editar regra
- [ ] Teste 5: Ativar regra
- [ ] Teste 6: Conflito de regra ativa
- [ ] Teste 7: Ver auditoria
- [ ] Teste 8: Desativar regra
- [ ] Teste 9: Refresh

### Falhas
```
[Listar testes que falharam e motivo]
```

### Erros Encontrados
```
[Listar erros encontrados durante os testes]
```

### Console Logs
```
[Colar logs relevantes do console do navegador]
```

---

## VEREDITO

- [ ] ✅ TODOS OS TESTES PASSARAM
- [ ] ⚠️ ALGUNS TESTES FALHARAM (detalhar acima)
- [ ] ❌ TESTES BLOQUEADOS (detalhar motivo)

### Próximos Passos
```
[Anotar próximos passos baseado nos resultados]
```
