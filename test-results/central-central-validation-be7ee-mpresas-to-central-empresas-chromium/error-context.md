# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: central\central-validation.spec.ts >> Central - Redirects Legados >> should redirect /perfil/empresas to /central/empresas
- Location: tests\e2e\central\central-validation.spec.ts:60:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "/central/empresas"
Received string:    "http://localhost:8080/perfil/empresas"
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - button "Pular para o conteúdo principal" [ref=e3] [cursor=pointer]
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
  - generic [ref=e6]:
    - generic [ref=e7]:
      - img [ref=e9]
      - generic [ref=e11]:
        - heading "Privacidade e Cookies" [level=3] [ref=e12]
        - paragraph [ref=e13]: Utilizamos cookies e dados pessoais para melhorar sua experiencia.
    - generic [ref=e14]:
      - button "Personalizar" [ref=e15] [cursor=pointer]
      - button "Rejeitar" [ref=e16] [cursor=pointer]
      - button "Aceitar Todos" [ref=e17] [cursor=pointer]
      - button "Fechar" [ref=e18] [cursor=pointer]:
        - img [ref=e19]
  - main [ref=e23]
```

# Test source

```ts
  1   | /**
  2   |  * E2E Tests - Central Module: Validation
  3   |  *
  4   |  * Testa as rotas da Central para homologação visual/manual final (Fase 3.4).
  5   |  * Valida rotas principais, subrotas de empresa, subrotas de mobilidade, redirects legados,
  6   |  * rotas pessoais preservadas e regras de acesso básicas.
  7   |  */
  8   | 
  9   | import { test, expect } from '@playwright/test';
  10  | 
  11  | test.describe('Central - Rotas Principais', () => {
  12  |   test('should load /central', async ({ page }) => {
  13  |     const response = await page.goto('/central', {
  14  |       waitUntil: 'domcontentloaded',
  15  |       timeout: 30000,
  16  |     });
  17  | 
  18  |     // Aceitar 200 ou 401 (redireciona para login se não autenticado)
  19  |     expect(response?.status()).toBeLessThan(500);
  20  |   });
  21  | 
  22  |   test('should load /central/empresas', async ({ page }) => {
  23  |     const response = await page.goto('/central/empresas', {
  24  |       waitUntil: 'domcontentloaded',
  25  |       timeout: 30000,
  26  |     });
  27  | 
  28  |     expect(response?.status()).toBeLessThan(500);
  29  |   });
  30  | 
  31  |   test('should load /central/profissional', async ({ page }) => {
  32  |     const response = await page.goto('/central/profissional', {
  33  |       waitUntil: 'domcontentloaded',
  34  |       timeout: 30000,
  35  |     });
  36  | 
  37  |     expect(response?.status()).toBeLessThan(500);
  38  |   });
  39  | 
  40  |   test('should load /central/motorista', async ({ page }) => {
  41  |     const response = await page.goto('/central/motorista', {
  42  |       waitUntil: 'domcontentloaded',
  43  |       timeout: 30000,
  44  |     });
  45  | 
  46  |     expect(response?.status()).toBeLessThan(500);
  47  |   });
  48  | 
  49  |   test('should load /central/motoboy', async ({ page }) => {
  50  |     const response = await page.goto('/central/motoboy', {
  51  |       waitUntil: 'domcontentloaded',
  52  |       timeout: 30000,
  53  |     });
  54  | 
  55  |     expect(response?.status()).toBeLessThan(500);
  56  |   });
  57  | });
  58  | 
  59  | test.describe('Central - Redirects Legados', () => {
  60  |   test('should redirect /perfil/empresas to /central/empresas', async ({ page }) => {
  61  |     const response = await page.goto('/perfil/empresas', {
  62  |       waitUntil: 'domcontentloaded',
  63  |       timeout: 30000,
  64  |     });
  65  | 
  66  |     expect(response?.status()).toBeLessThan(500);
> 67  |     expect(page.url()).toContain('/central/empresas');
      |                        ^ Error: expect(received).toContain(expected) // indexOf
  68  |   });
  69  | 
  70  |   test('should redirect /perfil/mobilidade/motorista to /central/motorista', async ({ page }) => {
  71  |     const response = await page.goto('/perfil/mobilidade/motorista', {
  72  |       waitUntil: 'domcontentloaded',
  73  |       timeout: 30000,
  74  |     });
  75  | 
  76  |     expect(response?.status()).toBeLessThan(500);
  77  |     expect(page.url()).toContain('/central/motorista');
  78  |   });
  79  | 
  80  |   test('should redirect /perfil/mobilidade/motorista/corridas to /central/motorista/corridas', async ({ page }) => {
  81  |     const response = await page.goto('/perfil/mobilidade/motorista/corridas', {
  82  |       waitUntil: 'domcontentloaded',
  83  |       timeout: 30000,
  84  |     });
  85  | 
  86  |     expect(response?.status()).toBeLessThan(500);
  87  |     expect(page.url()).toContain('/central/motorista/corridas');
  88  |   });
  89  | 
  90  |   test('should redirect /perfil/mobilidade/motoboy to /central/motoboy', async ({ page }) => {
  91  |     const response = await page.goto('/perfil/mobilidade/motoboy', {
  92  |       waitUntil: 'domcontentloaded',
  93  |       timeout: 30000,
  94  |     });
  95  | 
  96  |     expect(response?.status()).toBeLessThan(500);
  97  |     expect(page.url()).toContain('/central/motoboy');
  98  |   });
  99  | 
  100 |   test('should redirect /perfil/mobilidade/motoboy/entregas to /central/motoboy/entregas', async ({ page }) => {
  101 |     const response = await page.goto('/perfil/mobilidade/motoboy/entregas', {
  102 |       waitUntil: 'domcontentloaded',
  103 |       timeout: 30000,
  104 |     });
  105 | 
  106 |     expect(response?.status()).toBeLessThan(500);
  107 |     expect(page.url()).toContain('/central/motoboy/entregas');
  108 |   });
  109 | });
  110 | 
  111 | test.describe('Central - Rotas Pessoais Preservadas', () => {
  112 |   test('should load /perfil', async ({ page }) => {
  113 |     const response = await page.goto('/perfil', {
  114 |       waitUntil: 'domcontentloaded',
  115 |       timeout: 30000,
  116 |     });
  117 | 
  118 |     expect(response?.status()).toBeLessThan(500);
  119 |   });
  120 | 
  121 |   test('should load /perfil/planos', async ({ page }) => {
  122 |     const response = await page.goto('/perfil/planos', {
  123 |       waitUntil: 'domcontentloaded',
  124 |       timeout: 30000,
  125 |     });
  126 | 
  127 |     expect(response?.status()).toBeLessThan(500);
  128 |   });
  129 | 
  130 |   test('should load /perfil/configuracoes', async ({ page }) => {
  131 |     const response = await page.goto('/perfil/configuracoes', {
  132 |       waitUntil: 'domcontentloaded',
  133 |       timeout: 30000,
  134 |     });
  135 | 
  136 |     expect(response?.status()).toBeLessThan(500);
  137 |   });
  138 | 
  139 |   test('should load /perfil/conta', async ({ page }) => {
  140 |     const response = await page.goto('/perfil/conta', {
  141 |       waitUntil: 'domcontentloaded',
  142 |       timeout: 30000,
  143 |     });
  144 | 
  145 |     expect(response?.status()).toBeLessThan(500);
  146 |   });
  147 | 
  148 |   test('should load /perfil/familia', async ({ page }) => {
  149 |     const response = await page.goto('/perfil/familia', {
  150 |       waitUntil: 'domcontentloaded',
  151 |       timeout: 30000,
  152 |     });
  153 | 
  154 |     expect(response?.status()).toBeLessThan(500);
  155 |   });
  156 | });
  157 | 
  158 | test.describe('Central - Subrotas de Mobilidade', () => {
  159 |   test('should load /central/motorista/cadastro', async ({ page }) => {
  160 |     const response = await page.goto('/central/motorista/cadastro', {
  161 |       waitUntil: 'domcontentloaded',
  162 |       timeout: 30000,
  163 |     });
  164 | 
  165 |     expect(response?.status()).toBeLessThan(500);
  166 |   });
  167 | 
```