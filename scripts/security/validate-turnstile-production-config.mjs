#!/usr/bin/env node

const isVercelProduction = process.env.VERCEL_ENV?.trim().toLowerCase() === 'production';

if (!isVercelProduction) {
  console.log('PASS: validacao de VITE_TURNSTILE_SITE_KEY reservada ao build de producao Vercel.');
  process.exit(0);
}

const siteKey = process.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? '';
const looksLikePlaceholder = /placeholder|example|your[-_]|site[_-]?key|_here$/i.test(siteKey);

if (!siteKey || looksLikePlaceholder) {
  console.error(
    'LOCAL_FAILURE: VITE_TURNSTILE_SITE_KEY deve estar configurada sem placeholder no ambiente Production da Vercel.',
  );
  process.exit(1);
}

console.log('PASS: VITE_TURNSTILE_SITE_KEY configurada para o build de producao Vercel.');
