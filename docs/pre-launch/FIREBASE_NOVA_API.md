# 🔥 Firebase - Configuração da Nova API

> **Data**: 2026-04-18  
> **API**: Firebase Cloud Messaging (HTTP v1) - Nova e Moderna

---

## 🎯 Por Que Mudou?

A API legada do Firebase foi **descontinuada em 2023**. Agora usamos a **API HTTP v1** que é:
- ✅ Mais segura
- ✅ Mais moderna
- ✅ Mais recursos
- ✅ Suportada pelo Google

---

## 📝 Passo a Passo Completo

### 1️⃣ Habilitar a API

1. **Acesse:** https://console.firebase.google.com/
2. **Selecione seu projeto**
3. **Vá em:** ⚙️ Project Settings → **Cloud Messaging**
4. **Procure por:** "Firebase Cloud Messaging API (FCM API v1)"
5. **Clique em "Enable"** ou "Ativar"

---

### 2️⃣ Baixar o Service Account

1. **No Firebase Console:** ⚙️ Project Settings
2. **Clique na aba:** **"Service accounts"** (Contas de serviço)
3. **Role até embaixo**
4. **Clique em:** **"Generate new private key"** (Gerar nova chave privada)
5. **Confirme** no popup
6. **Um arquivo JSON será baixado:** `acheguese-app-firebase-adminsdk-xxxxx.json`

---

### 3️⃣ Adicionar no Supabase

#### Opção A: Arquivo JSON Completo (Mais Fácil)

1. **Abra o arquivo JSON** baixado no bloco de notas

2. **Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)

3. **No terminal:**
   ```bash
   cd supabase
   ```

4. **Cole este comando** (substitua pelo JSON real):
   ```bash
   supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"seu-projeto","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@seu-projeto.iam.gserviceaccount.com"}'
   ```

5. **Adicione o Project ID:**
   ```bash
   supabase secrets set FIREBASE_PROJECT_ID=seu-projeto-id
   ```

---

#### Opção B: Valores Separados (Mais Seguro)

Se a Opção A não funcionar, adicione cada valor separadamente:

```bash
cd supabase

# Project ID (está no JSON como "project_id")
supabase secrets set FIREBASE_PROJECT_ID=acheguese-app

# Private Key (está no JSON como "private_key")
supabase secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"

# Client Email (está no JSON como "client_email")
supabase secrets set FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@acheguese-app.iam.gserviceaccount.com
```

---

### 4️⃣ Verificar

```bash
supabase secrets list
```

**Deve aparecer:**
```
RESEND_API_KEY
FIREBASE_SERVICE_ACCOUNT  (ou FIREBASE_PROJECT_ID + FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL)
VAPID_PUBLIC_KEY
FROM_EMAIL
```

---

### 5️⃣ Fazer Deploy

```bash
supabase functions deploy send-push
```

---

## 🧪 Testar

### Teste 1: Via Console do Navegador

1. **Inicie o app:** `npm run dev`
2. **Acesse:** http://localhost:5173
3. **Abra o Console** (F12)
4. **Cole:**
   ```javascript
   const { data, error } = await supabase.functions.invoke('send-push', {
     body: {
       userId: (await supabase.auth.getUser()).data.user.id,
       notification: {
         title: 'Teste Push',
         body: 'Funcionou! 🎉',
         icon: '/icon-192x192.png'
       }
     }
   });
   
   console.log('Resultado:', data, error);
   ```

---

### Teste 2: Via UI

1. **Acesse:** http://localhost:5173/settings/notifications
2. **Clique em "Ativar"** nas notificações push
3. **Permita** quando o navegador pedir
4. **Clique em "Testar"**
5. **Deve aparecer uma notificação!** 🔔

---

## 📊 Estrutura do JSON

O arquivo JSON baixado tem esta estrutura:

```json
{
  "type": "service_account",
  "project_id": "acheguese-app",           ← Você precisa deste
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",  ← E deste
  "client_email": "firebase-adminsdk-xxxxx@acheguese-app.iam.gserviceaccount.com",  ← E deste
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

---

## ❓ Problemas Comuns

### "Não consigo baixar o JSON"

**Solução:**
1. Vá em: Firebase Console → ⚙️ Settings
2. Aba: **Service accounts**
3. Procure por: **"Firebase Admin SDK"**
4. Clique em: **"Generate new private key"**

---

### "O comando é muito grande"

**Solução:** Use a Opção B (valores separados) em vez da Opção A

---

### "Erro ao adicionar a private key"

**Solução:** A private key tem quebras de linha (`\n`). Certifique-se de copiar exatamente como está no JSON, incluindo:
```
-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n
```

---

### "Não aparece 'Generate new private key'"

**Solução:**
1. Certifique-se que você é **Owner** do projeto
2. Tente em outro navegador
3. Ou use o Google Cloud Console: https://console.cloud.google.com/

---

## 🎯 Resumo

### O Que Você Precisa:
1. ✅ Habilitar FCM API v1
2. ✅ Baixar Service Account JSON
3. ✅ Adicionar no Supabase Secrets
4. ✅ Deploy da função
5. ✅ Testar

### Secrets Necessárias:
- `FIREBASE_SERVICE_ACCOUNT` (JSON completo)
- `FIREBASE_PROJECT_ID` (project_id do JSON)

**OU**

- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

---

## 🎉 Depois de Configurar

Tudo vai funcionar automaticamente! O código já está preparado para usar a nova API.

---

**Precisa de ajuda?** Me avisa em qual passo travou! 😊

---

*Documentado por: Kiro AI*  
*Data: 2026-04-18*  
*API: Firebase Cloud Messaging HTTP v1*
