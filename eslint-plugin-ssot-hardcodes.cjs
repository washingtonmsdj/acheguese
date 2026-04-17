/**
 * ESLint Plugin: SSOT Hardcodes Detection
 * 
 * Detecta hardcodes indevidos que violam princípios SSOT
 * 
 * Uso:
 * 1. Adicionar ao eslint.config.js
 * 2. Configurar regras desejadas
 * 3. Rodar: npm run lint
 */

module.exports = {
  rules: {
    /**
     * Detectar preços hardcoded
     * 
     * Busca por variáveis com nomes relacionados a preço
     * que contêm valores numéricos hardcoded
     */
    'no-hardcoded-prices': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Detectar preços, tarifas e comissões hardcoded',
          category: 'SSOT Compliance',
          recommended: true,
        },
        messages: {
          hardcodedPrice: 'Preço hardcoded detectado ({{value}}). Use PricingService ou SubscriptionPlanService.',
        },
        schema: [],
      },
      create(context) {
        const priceKeywords = [
          'price', 'fare', 'rate', 'fee', 'commission', 'tariff', 
          'cost', 'amount', 'valor', 'preco', 'tarifa', 'taxa'
        ];

        function isPriceRelated(name) {
          const lowerName = name.toLowerCase();
          return priceKeywords.some(keyword => lowerName.includes(keyword));
        }

        function looksLikePrice(value) {
          // Números entre 1 e 100000 (possíveis preços)
          return typeof value === 'number' && value >= 1 && value <= 100000;
        }

        return {
          VariableDeclarator(node) {
            if (node.init && node.init.type === 'Literal') {
              const value = node.init.value;
              const varName = node.id.name;

              if (isPriceRelated(varName) && looksLikePrice(value)) {
                context.report({
                  node,
                  messageId: 'hardcodedPrice',
                  data: { value },
                });
              }
            }
          },

          // Detectar em objetos: { price: 29 }
          Property(node) {
            if (node.key.type === 'Identifier' && node.value.type === 'Literal') {
              const keyName = node.key.name;
              const value = node.value.value;

              if (isPriceRelated(keyName) && looksLikePrice(value)) {
                context.report({
                  node,
                  messageId: 'hardcodedPrice',
                  data: { value },
                });
              }
            }
          },
        };
      },
    },

    /**
     * Detectar imports de mock em código de produção
     */
    'no-mock-in-production': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Detectar imports de mock em código de produção',
          category: 'SSOT Compliance',
          recommended: true,
        },
        messages: {
          mockInProduction: 'Import de mock detectado em código de produção. Mova para tests/fixtures/ ou use service real.',
        },
        schema: [],
      },
      create(context) {
        return {
          ImportDeclaration(node) {
            const source = node.source.value;
            const filename = context.getFilename();

            // Detectar imports de mock
            const isMockImport = 
              source.includes('/mock-') || 
              source.includes('/data/mock') ||
              source.includes('mock.ts') ||
              source.includes('mock.tsx');

            // Permitir em arquivos de teste, fixtures e Storybook
            const isTestFile = 
              filename.includes('test.') ||
              filename.includes('spec.') ||
              filename.includes('/tests/') ||
              filename.includes('/fixtures/') ||
              filename.includes('.stories.') ||
              filename.includes('/__tests__/') ||
              filename.includes('/__mocks__/');

            if (isMockImport && !isTestFile) {
              context.report({
                node,
                messageId: 'mockInProduction',
              });
            }
          },
        };
      },
    },

    /**
     * Detectar IDs de localização hardcoded
     */
    'no-hardcoded-location-ids': {
      meta: {
        type: 'warning',
        docs: {
          description: 'Detectar UUIDs de localização hardcoded',
          category: 'SSOT Compliance',
          recommended: true,
        },
        messages: {
          hardcodedLocationId: 'ID de localização hardcoded. Use LocationService.getBySlug() ou busque do banco.',
        },
        schema: [],
      },
      create(context) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        function isLocationRelated(name) {
          const lowerName = name.toLowerCase();
          return lowerName.includes('location') || 
                 lowerName.includes('territory') ||
                 lowerName.includes('place');
        }

        return {
          VariableDeclarator(node) {
            if (node.init && node.init.type === 'Literal') {
              const value = node.init.value;
              const varName = node.id.name;

              if (typeof value === 'string' && 
                  uuidRegex.test(value) && 
                  isLocationRelated(varName)) {
                context.report({
                  node,
                  messageId: 'hardcodedLocationId',
                });
              }
            }
          },
        };
      },
    },

    /**
     * Detectar categorias hardcoded em arrays
     */
    'no-hardcoded-categories': {
      meta: {
        type: 'warning',
        docs: {
          description: 'Detectar categorias e taxonomias hardcoded',
          category: 'SSOT Compliance',
          recommended: true,
        },
        messages: {
          hardcodedCategories: 'Categorias hardcoded detectadas. Use CategoryService ou busque do banco.',
        },
        schema: [],
      },
      create(context) {
        const categoryKeywords = [
          'categories', 'category', 'types', 'status', 'options',
          'categorias', 'tipos', 'opcoes'
        ];

        function isCategoryRelated(name) {
          const lowerName = name.toLowerCase();
          return categoryKeywords.some(keyword => lowerName.includes(keyword));
        }

        return {
          VariableDeclarator(node) {
            if (node.init && node.init.type === 'ArrayExpression') {
              const varName = node.id.name;
              const elements = node.init.elements;

              // Detectar arrays de strings que parecem categorias
              const isStringArray = elements.every(
                el => el && el.type === 'Literal' && typeof el.value === 'string'
              );

              if (isCategoryRelated(varName) && isStringArray && elements.length > 2) {
                context.report({
                  node,
                  messageId: 'hardcodedCategories',
                });
              }
            }
          },
        };
      },
    },

    /**
     * Detectar status duplicados
     */
    'no-duplicate-status-definitions': {
      meta: {
        type: 'warning',
        docs: {
          description: 'Detectar definições duplicadas de status',
          category: 'SSOT Compliance',
          recommended: true,
        },
        messages: {
          duplicateStatus: 'Definição de status detectada. Use enum centralizado de @/shared/types/enums.',
        },
        schema: [],
      },
      create(context) {
        const commonStatuses = [
          'active', 'inactive', 'pending', 'approved', 'rejected',
          'completed', 'cancelled', 'expired', 'draft', 'published'
        ];

        return {
          VariableDeclarator(node) {
            if (node.init && node.init.type === 'ObjectExpression') {
              const varName = node.id.name.toLowerCase();
              
              if (varName.includes('status')) {
                const properties = node.init.properties;
                const hasCommonStatus = properties.some(prop => {
                  if (prop.value && prop.value.type === 'Literal') {
                    const value = prop.value.value;
                    return typeof value === 'string' && 
                           commonStatuses.includes(value.toLowerCase());
                  }
                  return false;
                });

                if (hasCommonStatus) {
                  context.report({
                    node,
                    messageId: 'duplicateStatus',
                  });
                }
              }
            }
          },
        };
      },
    },

    /**
     * Detectar acesso direto ao Supabase em componentes
     */
    'no-direct-supabase-in-components': {
      meta: {
        type: 'error',
        docs: {
          description: 'Detectar acesso direto ao Supabase em componentes',
          category: 'Architecture',
          recommended: true,
        },
        messages: {
          directSupabase: 'Acesso direto ao Supabase em componente. Use service ou hook.',
        },
        schema: [],
      },
      create(context) {
        const filename = context.getFilename();
        const isComponent = 
          filename.includes('/components/') ||
          filename.includes('/pages/') ||
          filename.endsWith('.tsx');

        if (!isComponent) return {};

        return {
          MemberExpression(node) {
            // Detectar: supabase.from(...)
            if (node.object.name === 'supabase' && 
                node.property.name === 'from') {
              context.report({
                node,
                messageId: 'directSupabase',
              });
            }
          },
        };
      },
    },
  },
};

/**
 * Configuração recomendada para eslint.config.js:
 * 
 * import ssotHardcodes from './eslint-plugin-ssot-hardcodes.cjs';
 * 
 * export default [
 *   {
 *     plugins: {
 *       'ssot-hardcodes': ssotHardcodes,
 *     },
 *     rules: {
 *       'ssot-hardcodes/no-hardcoded-prices': 'error',
 *       'ssot-hardcodes/no-mock-in-production': 'error',
 *       'ssot-hardcodes/no-hardcoded-location-ids': 'warn',
 *       'ssot-hardcodes/no-hardcoded-categories': 'warn',
 *       'ssot-hardcodes/no-duplicate-status-definitions': 'warn',
 *       'ssot-hardcodes/no-direct-supabase-in-components': 'error',
 *     },
 *   },
 * ];
 */
