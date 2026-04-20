# 🗺️ MAPA DE NAVEGAÇÃO - MÓDULO MOTOBOY

**Servidor:** http://localhost:8082/

---

## 📍 ROTAS PRINCIPAIS

### 🏠 Páginas Públicas
- **Home:** http://localhost:8082/
- **Login:** http://localhost:8082/login
- **Cadastro:** http://localhost:8082/signup

### 👤 Perfil e Identidades
- **Perfil Hub:** http://localhost:8082/perfil/hub
- **Identidades:** http://localhost:8082/perfil/identidades
- **Dados Pessoais:** http://localhost:8082/perfil/dados-pessoais

### 🚗 Motorista/Motoboy
- **Criar Motorista:** http://localhost:8082/create-driver
- **Criar Motoboy:** http://localhost:8082/create-driver?type=motoboy
- **Dashboard Motorista (Corridas):** http://localhost:8082/mobilidade/motorista
- **Dashboard Motoboy (Entregas):** http://localhost:8082/mobilidade/motoboy
- **Minhas Corridas:** http://localhost:8082/driver/rides
- **Disponibilidade:** http://localhost:8082/driver/availability

### 📦 Entregas (Delivery)
- **Seção Delivery:** http://localhost:8082/perfil/hub (aba "Delivery / Motoboy")
- **Solicitar Entrega:** (Modal dentro da aplicação)
- **Minhas Entregas:** (Dentro do dashboard)
- **Histórico:** (Dentro do perfil hub)

### 🧪 Páginas de Desenvolvimento
- **Validação Motoboy:** http://localhost:8082/dev/mobility/motoboy-validation
- **Dev Tools:** http://localhost:8082/dev

---

## 🎯 FLUXO DE NAVEGAÇÃO POR PERSONA

### 👨‍💼 SOLICITANTE (Passageiro/Empresa)

#### Primeira Vez
1. http://localhost:8082/ → Home
2. http://localhost:8082/signup → Criar conta
3. http://localhost:8082/login → Fazer login
4. http://localhost:8082/perfil/hub → Acessar hub
5. Clicar em "Delivery / Motoboy" → Ver seção de entregas
6. Clicar em "Solicitar Motoboy" → Abrir modal de criação

#### Usuário Recorrente
1. http://localhost:8082/login → Login
2. http://localhost:8082/perfil/hub → Hub
3. Aba "Delivery / Motoboy" → Ver entregas ativas
4. "Minhas Entregas" → Ver histórico

### 🏍️ MOTOBOY (Motorista com Entregas)

#### Primeira Vez - Cadastro
1. http://localhost:8082/ → Home
2. http://localhost:8082/signup → Criar conta
3. http://localhost:8082/login → Fazer login
4. http://localhost:8082/perfil/identidades → Ver identidades
5. Clicar em "Ser motorista" → Criar perfil de motorista
6. OU http://localhost:8082/create-driver?type=motoboy → Criar direto como motoboy

#### Primeira Vez - Habilitar Entregas
1. http://localhost:8082/perfil/identidades → Ver identidades
2. Localizar card de motorista
3. Clicar em "Ser motoboy" → Habilitar entregas
4. Preencher formulário (veículo tipo moto, can_do_delivery)

#### Usuário Recorrente
1. http://localhost:8082/login → Login
2. http://localhost:8082/mobilidade/motoboy → Dashboard Motoboy (NOVO)
3. Ver lista de entregas disponíveis
4. Aceitar entrega
5. Executar fluxo operacional

#### Dual-Capability (Motorista + Motoboy)
1. http://localhost:8082/login → Login
2. **Para corridas:** http://localhost:8082/mobilidade/motorista
3. **Para entregas:** http://localhost:8082/mobilidade/motoboy
4. Alternar entre páginas conforme necessidade

---

## 🔍 COMPONENTES CHAVE NA UI

### Badge "Motoboy"
**Localização:** `/perfil/identidades`
```tsx
// Aparece no card do motorista quando:
// - profile_type === 'driver'
// - vehicle_type === 'motorcycle'
// - can_do_delivery !== false
```

**Visual:**
- Ícone: 🏍️ (Bike)
- Cor: Laranja (orange-600)
- Texto: "Motoboy"

### Botão "Ser Motoboy"
**Localização:** `/perfil/identidades` (dentro do card de motorista)
```tsx
// Aparece quando:
// - Já existe perfil de motorista
// - Ainda não é motoboy
```

**Ação:** Navega para `/create-driver?type=motoboy`

### Seção "Delivery / Motoboy"
**Localização:** `/perfil/hub`
```tsx
// Mostra:
// - Empresas com delivery ativo
// - Rede de motoboy disponível
// - Rastreio de entregas
// - Configurações de taxas
```

### Dashboard do Motorista
**Localização:** `/driver/dashboard`
```tsx
// Mostra:
// - Lista de pedidos disponíveis
// - Filtros (tipo: ride/motoboy, distância, preço)
// - Minhas entregas ativas
// - Histórico
```

---

## 🧪 ROTAS DE TESTE/DESENVOLVIMENTO

### Página de Validação Motoboy
**URL:** http://localhost:8082/dev/mobility/motoboy-validation

**Funcionalidades:**
- Criar entrega de teste
- Aceitar entrega
- Confirmar coleta
- Iniciar entrega
- Confirmar entrega
- Registrar falha
- Ver logs
- Ver auditoria

**Uso:**
```
1. Acessar URL
2. Seguir fluxo guiado na página
3. Validar cada etapa
4. Ver logs em tempo real
```

---

## 📊 VERIFICAÇÃO DE ESTADO NA UI

### Como Verificar se é Motoboy
**Localização:** `/perfil/identidades`

**Indicadores Visuais:**
- ✅ Badge "Motoboy" aparece no card
- ✅ Ícone de moto (🏍️) visível
- ✅ Cor laranja no badge
- ✅ Diferenciação clara de motorista comum

### Como Verificar Entregas Disponíveis
**Localização:** `/driver/dashboard`

**Indicadores:**
- ✅ Lista de pedidos mostra apenas entregas (ride_mode = 'motoboy')
- ✅ Corridas de passageiro NÃO aparecem (quando filtro ativo)
- ✅ Informações visíveis: origem, destino, tamanho, preço, distância

### Como Verificar Entrega Aceita
**Localização:** `/driver/dashboard` → "Minhas Entregas"

**Indicadores:**
- ✅ Entrega aparece em "Minhas Entregas"
- ✅ Status visível (driver_accepted, pickup_confirmed, in_delivery, etc.)
- ✅ Botões de ação disponíveis (Confirmar Coleta, Iniciar Entrega, etc.)

---

## 🐛 TROUBLESHOOTING

### Página não carrega
```
1. Verificar se servidor está rodando
2. Verificar console do navegador (F12)
3. Verificar URL correta
4. Limpar cache do navegador (Ctrl+Shift+R)
```

### Badge "Motoboy" não aparece
```
1. Verificar no banco:
   - profile_type = 'driver'
   - vehicle_type = 'motorcycle'
   - can_do_delivery = true

2. Fazer logout/login
3. Limpar cache
4. Verificar console por erros
```

### Entregas não aparecem na lista
```
1. Verificar se há entregas criadas (ride_mode = 'motoboy')
2. Verificar filtros ativos no dashboard
3. Verificar se motorista está disponível
4. Verificar console por erros de query
```

### Não consegue aceitar entrega
```
1. Verificar se motorista está online
2. Verificar se motorista não está busy
3. Verificar se entrega ainda está disponível
4. Verificar console por erros de RLS/permissões
```

---

## 📝 CHECKLIST DE NAVEGAÇÃO

### Teste de Navegação Básica
- [ ] Home carrega sem erros
- [ ] Login funciona
- [ ] Perfil Hub carrega
- [ ] Identidades carrega
- [ ] Dashboard motorista carrega
- [ ] Seção Delivery carrega

### Teste de Navegação Motoboy
- [ ] `/create-driver?type=motoboy` carrega
- [ ] Formulário de cadastro aparece
- [ ] Badge "Motoboy" aparece após cadastro
- [ ] Dashboard mostra entregas
- [ ] Filtros funcionam
- [ ] Detalhes de entrega carregam

### Teste de Navegação Solicitante
- [ ] Seção Delivery carrega
- [ ] Modal de criação abre
- [ ] Formulário de entrega aparece
- [ ] Minhas Entregas carrega
- [ ] Histórico carrega
- [ ] Detalhes de entrega carregam

---

## 🎯 PRÓXIMA AÇÃO

1. Abrir navegador em: http://localhost:8082/
2. Fazer login ou criar conta
3. Navegar para: http://localhost:8082/perfil/identidades
4. Verificar se badge "Motoboy" aparece (se já for motorista)
5. OU criar perfil de motoboy: http://localhost:8082/create-driver?type=motoboy

---

**Mapa atualizado em:** 2026-04-14 17:40 UTC
