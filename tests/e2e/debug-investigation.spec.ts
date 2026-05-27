import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8081';

test.describe('Investigação de Problemas', () => {
  
  test('Investigar Listagem - Verificar todos os pontos', async ({ page }) => {
    await page.goto(`${BASE_URL}/pontos-turisticos/ba/salvador`);
    await page.waitForLoadState('networkidle');

    // Capturar screenshot
    await page.screenshot({ path: 'debug-listagem.png', fullPage: true });

    // Verificar quantos links de pontos turísticos existem
    const links = await page.locator('a[href*="/pontos-turisticos/ba/salvador/"]').all();
    console.log(`Total de links encontrados: ${links.length}`);

    // Listar todos os textos
    for (let i = 0; i < links.length; i++) {
      const text = await links[i].textContent();
      console.log(`Link ${i + 1}: ${text}`);
    }

    // Verificar se Shopping da Bahia está no HTML
    const html = await page.content();
    const hasShoppingText = html.includes('Shopping da Bahia');
    console.log(`Shopping da Bahia no HTML: ${hasShoppingText}`);
  });

  test('Investigar Detail Page - Pelourinho', async ({ page }) => {
    await page.goto(`${BASE_URL}/pontos-turisticos/ba/salvador/pelourinho`);
    await page.waitForLoadState('networkidle');

    // Capturar screenshot
    await page.screenshot({ path: 'debug-pelourinho.png', fullPage: true });

    // Verificar título da página
    const title = await page.title();
    console.log(`Título da página: ${title}`);

    // Verificar se há mensagem de erro
    const html = await page.content();
    const hasError = html.includes('não encontrado') || html.includes('não existe');
    console.log(`Tem mensagem de erro: ${hasError}`);

    // Verificar h1
    const h1Elements = await page.locator('h1').all();
    console.log(`Total de h1: ${h1Elements.length}`);
    for (let i = 0; i < h1Elements.length; i++) {
      const text = await h1Elements[i].textContent();
      console.log(`H1 ${i + 1}: ${text}`);
    }
  });

  test('Investigar Detail Page - Farol da Barra (Bairro)', async ({ page }) => {
    await page.goto(`${BASE_URL}/pontos-turisticos/ba/salvador/farol-da-barra`);
    await page.waitForLoadState('networkidle');

    // Capturar screenshot
    await page.screenshot({ path: 'debug-farol.png', fullPage: true });

    // Procurar por "Barra" no HTML
    const html = await page.content();
    const barraMatches = html.match(/Barra/g);
    console.log(`Ocorrências de "Barra" no HTML: ${barraMatches?.length || 0}`);

    // Verificar todos os elementos que contêm "Barra"
    const barraElements = await page.getByText('Barra').all();
    console.log(`Total de elementos com "Barra": ${barraElements.length}`);

    for (let i = 0; i < Math.min(barraElements.length, 5); i++) {
      const isVisible = await barraElements[i].isVisible();
      const text = await barraElements[i].textContent();
      console.log(`Elemento ${i + 1}: "${text}" - Visível: ${isVisible}`);
    }
  });
});
