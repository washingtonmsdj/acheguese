# 🔓 COMO REDEFINIR PERMISSÕES DE LOCALIZAÇÃO

## 🐛 PROBLEMA

Você está vendo "Permissão negada" assim que entra na página, sem aparecer o prompt.

**Causa:** O navegador salvou que você negou a permissão anteriormente.

---

## ✅ SOLUÇÃO RÁPIDA

### Chrome (Desktop)

1. **Abrir a página:** http://localhost:8080/mapa

2. **Clicar no cadeado** (barra de endereço, antes da URL)

3. **Clicar em "Configurações do site"**

4. **Localizar "Localização"**

5. **Selecionar "Permitir"** ou **"Redefinir permissões"**

6. **Recarregar a página** (F5)

7. **Clicar em "Minha Localização"** novamente

---

### Chrome (Android)

1. **Abrir a página no Chrome**

2. **Tocar nos 3 pontos** (canto superior direito)

3. **Configurações**

4. **Configurações do site**

5. **Localização**

6. **Encontrar o site** (localhost ou URL)

7. **Tocar e selecionar "Permitir"**

8. **Voltar e recarregar a página**

---

### Safari (iOS)

1. **Sair do Safari**

2. **Abrir Ajustes** (Settings)

3. **Rolar até "Safari"**

4. **Tocar em "Localização"**

5. **Selecionar "Perguntar" ou "Permitir"**

6. **Voltar ao Safari**

7. **Recarregar a página**

---

### Firefox (Desktop)

1. **Abrir a página**

2. **Clicar no ícone (i)** (barra de endereço)

3. **Clicar na seta** ao lado de "Permissões"

4. **Localizar "Acessar sua localização"**

5. **Clicar no X** para remover o bloqueio

6. **Recarregar a página** (F5)

---

## 🧹 LIMPAR TUDO (Método Alternativo)

Se os métodos acima não funcionarem:

### Chrome

1. **Abrir:** chrome://settings/content/location

2. **Localizar o site** na lista "Bloquear"

3. **Clicar nos 3 pontos** ao lado

4. **Remover**

5. **Recarregar a página**

### Firefox

1. **Abrir:** about:preferences#privacy

2. **Rolar até "Permissões"**

3. **Clicar em "Configurações"** ao lado de "Localização"

4. **Localizar o site**

5. **Remover**

6. **Recarregar a página**

---

## 🧪 TESTAR

Depois de redefinir:

1. **Recarregar a página** (F5)

2. **Abrir console** (F12)

3. **Limpar cache:**
```javascript
localStorage.clear()
```

4. **Recarregar novamente** (F5)

5. **Clicar em "Minha Localização"**

6. **VERIFICAR:** Agora o prompt deve aparecer!

---

## 📊 LOGS ESPERADOS

Após redefinir, você deve ver:

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
```

---

## ❌ SE AINDA NÃO FUNCIONAR

### 1. Verificar se é HTTPS (Mobile)

```javascript
// No console
console.log('Protocolo:', window.location.protocol);
```

**Mobile requer:** `https:`

**Se for `http:` no mobile:**
- Usar ngrok ou cloudflare tunnel

### 2. Testar Manualmente

```javascript
// No console - forçar prompt
navigator.geolocation.getCurrentPosition(
  pos => console.log('✅ Sucesso:', pos.coords),
  err => console.error('❌ Erro:', err.code, err.message),
  { enableHighAccuracy: true }
);
```

**Códigos de erro:**
- `1` = Permissão negada (redefinir permissões)
- `2` = Posição indisponível (problema de GPS)
- `3` = Timeout (aguardar mais ou ir para área externa)

### 3. Modo Anônimo

Testar em janela anônima/privada:
- Chrome: Ctrl+Shift+N
- Firefox: Ctrl+Shift+P

Isso ignora permissões salvas.

---

## 🎯 CHECKLIST

- [ ] Redefinir permissões do navegador
- [ ] Recarregar página (F5)
- [ ] Limpar cache (localStorage.clear())
- [ ] Recarregar novamente (F5)
- [ ] Clicar "Minha Localização"
- [ ] Prompt aparece?
- [ ] Clicar "Permitir"
- [ ] Localização obtida?
- [ ] Marcador aparece?

---

## 💡 DICA

Se você negou a permissão por engano:
- Não precisa fechar o navegador
- Basta redefinir as permissões
- Recarregar a página
- Tentar novamente

---

**Tempo estimado:** 2 minutos
**Dificuldade:** Fácil
**Resultado:** Prompt de permissão volta a aparecer
