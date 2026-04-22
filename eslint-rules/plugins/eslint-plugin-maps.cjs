/**
 * ESLint Plugin: Maps Architecture Enforcement
 * 
 * Garante blindagem arquitetural do sistema de mapas:
 * 1. Proíbe import direto de providers
 * 2. Proíbe cross-layer imports (modules <-> integrations/maps)
 * 3. Detecta projeção manual de entidades
 */

module.exports = {
  rules: {
    /**
     * Regra: no-direct-provider-import
     * 
     * Proíbe import direto de providers de maps.
     * Exceção: src/integrations/maps/setup.ts
     */
    "no-direct-provider-import": {
      meta: {
        type: "problem",
        docs: {
          description: "Proíbe import direto de providers de maps",
          category: "Architecture",
          recommended: true,
        },
        messages: {
          directProviderImport: "❌ MAPS BLINDAGEM: Não importe '{{provider}}' diretamente. Use providerRegistry de '@/core/maps'",
        },
        schema: [],
      },
      create(context) {
        const filename = context.getFilename();
        
        // Exceção: setup.ts pode importar providers
        if (filename.includes('integrations/maps/setup.ts')) {
          return {};
        }

        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            
            // Detecta imports de providers
            const providerPatterns = [
              '@/integrations/maps/providers/',
              '../integrations/maps/providers/',
              '../../integrations/maps/providers/',
              '../../../integrations/maps/providers/',
            ];

            const isProviderImport = providerPatterns.some(pattern => 
              importPath.includes(pattern)
            );

            if (isProviderImport) {
              context.report({
                node: node.source,
                messageId: "directProviderImport",
                data: {
                  provider: importPath,
                },
              });
            }
          },
        };
      },
    },

    /**
     * Regra: no-cross-layer-import
     * 
     * Proíbe imports entre modules e integrations/maps
     */
    "no-cross-layer-import": {
      meta: {
        type: "problem",
        docs: {
          description: "Proíbe cross-layer imports entre modules e integrations/maps",
          category: "Architecture",
          recommended: true,
        },
        messages: {
          modulesImportingIntegrations: "❌ MAPS BLINDAGEM: Modules não podem importar de integrations/maps. Use '@/core/maps'",
          integrationsImportingModules: "❌ MAPS BLINDAGEM: integrations/maps não pode importar de modules. Mantenha separação de camadas",
        },
        schema: [],
      },
      create(context) {
        const filename = context.getFilename();
        const isInModules = filename.includes('/modules/') || filename.includes('\\modules\\');
        const isInIntegrationsMaps = filename.includes('/integrations/maps/') || filename.includes('\\integrations\\maps\\');

        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;

            // Modules não podem importar de integrations/maps
            if (isInModules) {
              const integrationsPatterns = [
                '@/integrations/maps',
                '../integrations/maps',
                '../../integrations/maps',
                '../../../integrations/maps',
              ];

              const isImportingIntegrations = integrationsPatterns.some(pattern =>
                importPath === pattern || importPath.startsWith(pattern + '/')
              );

              if (isImportingIntegrations) {
                context.report({
                  node: node.source,
                  messageId: "modulesImportingIntegrations",
                });
              }
            }

            // integrations/maps não pode importar de modules
            if (isInIntegrationsMaps) {
              const modulesPatterns = [
                '@/modules/',
                '../modules/',
                '../../modules/',
                '../../../modules/',
              ];

              const isImportingModules = modulesPatterns.some(pattern =>
                importPath.includes(pattern)
              );

              if (isImportingModules) {
                context.report({
                  node: node.source,
                  messageId: "integrationsImportingModules",
                });
              }
            }
          },
        };
      },
    },

    /**
     * Regra: no-manual-entity-projection
     * 
     * Detecta projeção manual de entidades (criação de objetos marker sem usar mapEntityProjection)
     */
    "no-manual-entity-projection": {
      meta: {
        type: "problem",
        docs: {
          description: "Detecta projeção manual de entidades para mapas",
          category: "Architecture",
          recommended: true,
        },
        messages: {
          manualProjection: "❌ MAPS BLINDAGEM: Não crie marcadores manualmente. Use mapEntityProjection.project{{entityType}}() de '@/core/maps'",
        },
        schema: [],
      },
      create(context) {
        const filename = context.getFilename();
        
        // Ignora arquivos de teste e o próprio service de projeção
        if (
          filename.includes('__tests__') ||
          filename.includes('.test.') ||
          filename.includes('.spec.') ||
          filename.includes('MapEntityProjectionService')
        ) {
          return {};
        }

        let hasMapEntityProjectionImport = false;

        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            if (importPath.includes('@/core/maps')) {
              const specifiers = node.specifiers || [];
              hasMapEntityProjectionImport = specifiers.some(spec => 
                spec.imported && spec.imported.name === 'mapEntityProjection'
              );
            }
          },

          ObjectExpression(node) {
            // Detecta objetos com estrutura de marker
            const properties = node.properties || [];
            const propertyNames = properties
              .filter(prop => prop.key && prop.key.name)
              .map(prop => prop.key.name);

            // Padrão suspeito: objeto com id, type, coordinates
            const hasId = propertyNames.includes('id');
            const hasType = propertyNames.includes('type');
            const hasCoordinates = propertyNames.includes('coordinates');

            if (hasId && hasType && hasCoordinates) {
              // Verifica se está dentro de um componente/hook de mapa
              const sourceCode = context.getSourceCode();
              const text = sourceCode.getText();
              
              const isInMapContext = 
                text.includes('MapMarker') ||
                text.includes('useMap') ||
                text.includes('Map.tsx') ||
                text.includes('Map.ts');

              // Se está em contexto de mapa e não importou mapEntityProjection, é suspeito
              if (isInMapContext && !hasMapEntityProjectionImport) {
                context.report({
                  node,
                  messageId: "manualProjection",
                  data: {
                    entityType: propertyNames.includes('business') ? 'Business' : 
                               propertyNames.includes('service') ? 'Service' : 
                               'Entity',
                  },
                });
              }
            }
          },
        };
      },
    },
  },
};
