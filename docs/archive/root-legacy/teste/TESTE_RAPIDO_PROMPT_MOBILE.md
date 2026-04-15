# ⚡ TESTE RÁPIDO - Prompt de Permissão Mobile

## 🎯 OBJETIVO

Verificar se o prompt de permissão de localização aparece no mobile.

---

## 🖥️ TESTE 1: Desktop (2 minutos)

### Preparação

```bash
# 1. Iniciar aplicação
npm run dev

# 2. Abrir navegador
http://localhost:8080/mapa

# 3. Abrir console (F12)

# 4. Limpar cache e permissões
localStorage.clear()
```

### Redefinir Permissões

**Chrome:**
1. Clicar no cadeado (barra de endereço)
2. Configurações do site
3. Redefinir permissões

**Firefox:**
1. Clicar no ícone de informações (barra de endereço)
2. Limpar permissões

### Executar Teste

1. Recarregar página (F5)
2. Clicar no botão **"Minha Localização"** (ícone de alvo)
3. **VERIFICAR:** Prompt de permissão aparece?

**✅ Sucesso se:**
- Prompt aparece perguntando "Permitir acesso à localização?"
- Opções: Permitir / Bloquear

**❌ Falha se:**
- Nenhum prompt aparece
- Erro imediato

### Logs Esperados (Console)

```
🎯 [GeolocationService] Iniciando busca de localização...
🔐 [GeolocationService] Status de permissão: prompt
🔄 [GeolocationService] forcePrompt=true, ignorando cache
📡 [GeolocationService] GPS tentativa 1/3: Desktop preciso
```

**→ PROMPT APARECE AQUI**

Após permitir:
```
✅ [GeolocationService] GPS sucesso: 23m precisão
✅ [useMapaPage] Localização obtida
🗺️ [useMapaPage] Centralizando mapa
```

---

## 📱 TESTE 2: Mobile Simulado (3 minutos)

### Preparação

```bash
# 1. Aplicação já deve estar rodando
npm run dev

# 2. Abrir DevTools (F12)
# 3. Toggle device toolbar (Ctrl+Shift+M)
# 4. Selecionar dispositivo: iPhone 12 Pro ou Galaxy S20
```

### Limpar Estado

```javascript
// No console
localStorage.clear()
```

### Executar Teste

1. Recarregar página (F5)
2. Clicar em **"Minha Localização"**
3. **VERIFICAR:** Prompt aparece?

**✅ Sucesso se:**
- Prompt aparece
- Pode permitir/bloquear

### Logs Esperados

```
🎯 [GeolocationService] Iniciando busca de localização...
🔐 [GeolocationService] Status de permissão: prompt
🔄 [GeolocationService] forcePrompt=true, ignorando cache
📡 [GeolocationService] GPS tentativa 1/3: Mobile rápido (cache 1min)
```

**→ PROMPT APARECE AQUI**

---

## 📱 TESTE 3: Mobile Real (10 minutos)

⚠️ **IMPORTANTE:** Mobile real requer HTTPS!

### Opção A: ngrok (Recomendado)

```bash
# Terminal 1: Aplicação
npm run dev

# Terminal 2: Túnel HTTPS
ngrok http 8080

# Copiar URL HTTPS
# Exemplo: https://abc123.ngrok.io
```

### Opção B: Cloudflare Tunnel

```bash
# Terminal 1: Aplicação
npm run dev

# Terminal 2: Túnel HTTPS
npx cloudflared tunnel --url http://localhost:8080

# Copiar URL HTTPS
# Exemplo: https://xyz.trycloudflare.com
```

### No Celular

1. Abrir navegador (Chrome/Safari)
2. Acessar URL HTTPS copiada
3. Navegar para `/mapa`
4. Clicar em **"Minha Localização"**
5. **VERIFICAR:** Prompt aparece?

**✅ Sucesso se:**
- Navegador solicita permissão de localização
- Opções: Permitir / Negar
- Após permitir, mapa centraliza
- Marcador verde aparece

**❌ Falha se:**
- Nenhum prompt aparece
- Erro "Geolocalização não suportada"
- Erro "Permissão negada" sem ter negado

---

## 🐛 DEBUG

### Se Prompt NÃO Aparece

#### 1. Verificar Protocolo

```javascript
// No console
console.log('Protocolo:', window.location.protocol);
```

**Esperado:**
- Desktop: `http:` (localhost) ou `https:`
- Mobile: `https:` (obrigatório)

**Se for `http:` no mobile:**
- ❌ Não vai funcionar
- ✅ Usar ngrok ou cloudflare

#### 2. Verificar Geolocalização Disponível

```javascript
// No console
console.log('Geo disponível:', 'geolocation' in navigator);
```

**Esperado:** `true`

**Se for `false`:**
- Navegador muito antigo
- Contexto inseguro (HTTP no mobile)

#### 3. Verificar Status de Permissão

```javascript
// No console
navigator.permissions.query({ name: 'geolocation' })
  .then(r => console.log('Permissão:', r.state));
```

**Possíveis valores:**
- `prompt` → Primeira vez, prompt deve aparecer
- `granted` → Já permitido, não aparece prompt
- `denied` → Negado, não aparece prompt

**Se for `denied`:**
- Redefinir permissões do navegador
- Chrome: Cadeado → Configurações → Redefinir
- Safari: Ajustes → Safari → Localização → Redefinir

#### 4. Testar Manualmente

```javascript
// No console - forçar prompt
navigator.geolocation.getCurrentPosition(
  pos => console.log('✅ Sucesso:', pos.coords),
  err => console.error('❌ Erro:', err),
  { enableHighAccuracy: true }
);
```

**Se prompt aparecer:**
- ✅ Navegador está OK
- ❌ Problema no código (verificar logs)

**Se prompt NÃO aparecer:**
- ❌ Problema no navegador/permissões
- Redefinir permissões

---

## 📊 RESULTADOS

### Desktop

| Teste | Resultado | Observações |
|-------|-----------|-------------|
| Prompt aparece | ⏳ | |
| Pode permitir | ⏳ | |
| Localização obtida | ⏳ | |
| Marcador aparece | ⏳ | |

### Mobile Simulado

| Teste | Resultado | Observações |
|-------|-----------|-------------|
| Prompt aparece | ⏳ | |
| Pode permitir | ⏳ | |
| Localização obtida | ⏳ | |
| Marcador aparece | ⏳ | |

### Mobile Real

| Dispositivo | Navegador | Prompt | Localização | Observações |
|-------------|-----------|--------|-------------|-------------|
| Android | Chrome | ⏳ | ⏳ | |
| Android | Firefox | ⏳ | ⏳ | |
| iOS | Safari | ⏳ | ⏳ | |
| iOS | Chrome | ⏳ | ⏳ | |

---

## ✅ CHECKLIST

### Preparação
- [ ] Aplicação rodando (`npm run dev`)
- [ ] Console aberto (F12)
- [ ] Cache limpo (`localStorage.clear()`)
- [ ] Permissões redefinidas

### Desktop
- [ ] Prompt aparece
- [ ] Pode permitir/bloquear
- [ ] Localização obtida após permitir
- [ ] Marcador aparece no mapa

### Mobile Simulado
- [ ] DevTools device mode ativo
- [ ] Prompt aparece
- [ ] Funciona igual ao desktop

### Mobile Real
- [ ] HTTPS configurado (ngrok/cloudflare)
- [ ] URL acessível no celular
- [ ] Prompt aparece
- [ ] Localização obtida
- [ ] Marcador aparece

---

## 🎯 CRITÉRIO DE SUCESSO

**✅ PASSOU se:**
- Prompt aparece em TODOS os testes
- Usuário pode permitir ou negar
- Após permitir, localização é obtida
- Marcador aparece no mapa

**❌ FALHOU se:**
- Prompt não aparece em algum teste
- Erro antes do prompt
- Localização não é obtida após permitir

---

## 📞 REPORTAR RESULTADO

### Se PASSOU ✅

```
✅ Prompt de permissão funcionando!

Desktop: ✅
Mobile Simulado: ✅
Mobile Real: ✅

Observações: [nenhuma]
```

### Se FALHOU ❌

```
❌ Prompt não aparece

Ambiente: [Desktop/Mobile Simulado/Mobile Real]
Navegador: [Chrome/Firefox/Safari]
Protocolo: [http/https]
Status permissão: [prompt/granted/denied]

Logs do console:
[colar logs aqui]

Erro:
[descrever erro]
```

---

## 🚀 PRÓXIMO PASSO

Após testar, reporte o resultado para que possamos:
- ✅ Se passou → Marcar como resolvido
- ❌ Se falhou → Investigar e corrigir

---

**Tempo estimado:** 5-15 minutos
**Dificuldade:** Fácil
**Prioridade:** Alta (bug crítico)
