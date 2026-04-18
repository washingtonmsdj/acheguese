/**
 * ESLint Security Configuration
 * 
 * Regras de segurança para prevenir XSS e outras vulnerabilidades.
 */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import noUnsanitized from 'eslint-plugin-no-unsanitized';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      security,
      'no-unsanitized': noUnsanitized,
    },
    rules: {
      // ══════════════════════════════════════════════════════════════
      // REGRAS CRÍTICAS - BLOQUEIAM BUILD
      // ══════════════════════════════════════════════════════════════
      
      // Bloqueia innerHTML sem sanitização
      'no-unsanitized/property': ['error', {
        escape: {
          methods: ['DOMPurify.sanitize']
        }
      }],
      
      // Bloqueia eval e similares
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      
      // Força validação de URLs
      'security/detect-unsafe-regex': 'error',
      'security/detect-non-literal-regexp': 'warn',
      
      // ══════════════════════════════════════════════════════════════
      // REGRAS DE AVISO - NÃO BLOQUEIAM MAS ALERTAM
      // ══════════════════════════════════════════════════════════════
      
      'security/detect-object-injection': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
    },
  },
  {
    // Permite innerHTML APENAS em arquivos específicos com sanitização
    files: ['**/SafeHtml.tsx', '**/safeSvg.ts'],
    rules: {
      'no-unsanitized/property': 'off',
    },
  },
];
