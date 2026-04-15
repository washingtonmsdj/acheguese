/**
 * ESLint Rule: no-direct-supabase-queries
 * 
 * Detecta queries diretas ao Supabase fora dos serviços SSOT.
 * 
 * Uso no .eslintrc:
 * {
 *   "rules": {
 *     "no-direct-supabase-queries": "error"
 *   }
 * }
 */

const PROTECTED_TABLES = [
  'locations',
  'profiles',
  'business_data',
  'professional_data',
  'driver_data',
  'posts',
  'comments',
  'classifieds',
  'events',
  'reviews',
  'user_subscriptions',
  'gastronomy_establishments',
  'menu_categories',
  'menu_items',
  'tourist_points',
];

const ALLOWED_PATHS = [
  '/repositories/',
  '/services/',
  '/integrations/supabase',
  '/migrations/',
  '/seeds/',
  '.test.',
  '.spec.',
  '/__tests__/',
  '/e2e/',
];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow direct Supabase queries to protected tables outside SSOT services',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      directQuery: 'Direct query to protected table "{{table}}". Use {{service}} instead. See SSOT_REGISTRY.md',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();
    
    // Verificar se o arquivo está em um diretório permitido
    const isAllowed = ALLOWED_PATHS.some(path => filename.includes(path));
    if (isAllowed) {
      return {};
    }

    return {
      CallExpression(node) {
        // Detectar padrão: supabase.from('table')
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.name === 'from' &&
          node.arguments.length > 0 &&
          node.arguments[0].type === 'Literal'
        ) {
          const tableName = node.arguments[0].value;
          
          if (PROTECTED_TABLES.includes(tableName)) {
            const serviceMap = {
              'locations': 'locationService',
              'profiles': 'profileService',
              'business_data': 'BusinessService',
              'professional_data': 'ProfessionalService',
              'driver_data': 'MobilityService',
              'posts': 'postService',
              'comments': 'commentService',
              'classifieds': 'classifiedService',
              'events': 'eventService',
              'reviews': 'ReviewsService',
              'user_subscriptions': 'SubscriptionService',
              'gastronomy_establishments': 'GastronomyService',
              'menu_categories': 'MenuService',
              'menu_items': 'MenuService',
              'tourist_points': 'TouristPointService',
            };
            
            context.report({
              node,
              messageId: 'directQuery',
              data: {
                table: tableName,
                service: serviceMap[tableName] || 'appropriate SSOT service',
              },
            });
          }
        }
      },
    };
  },
};
