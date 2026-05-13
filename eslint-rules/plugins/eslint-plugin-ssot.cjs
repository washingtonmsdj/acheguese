/**
 * ESLint Plugin - Unified SSOT Enforcement
 * Consolidação de todos os plugins SSOT em um único arquivo.
 * Impede acesso direto às tabelas protegidas fora dos respectivos Services.
 */

const DOMAIN_RULES = {
  business: {
    tables: ['businesses', 'business_reviews', 'business_views', 'business_hours', 'business_categories'],
    service: 'BusinessService',
  },
  profile: {
    tables: ['profiles'],
    service: 'ProfileService',
    additionalServices: ['MobilityAdminQueryService'],
  },
  classified: {
    tables: ['classifieds', 'classified_views', 'classified_favorites'],
    service: 'ClassifiedService',
  },
  messaging: {
    tables: ['messages', 'conversations', 'conversation_participants'],
    service: 'MessagingService',
  },
  'community-qa': {
    tables: ['questions', 'answers', 'question_votes', 'answer_votes'],
    service: 'CommunityQAService',
  },
  'posts-polls': {
    tables: ['posts', 'polls', 'poll_options', 'poll_votes'],
    service: 'PostService',
  },
  favorites: {
    tables: ['favorites', 'business_favorites', 'post_favorites'],
    service: 'FavoritesService',
  },
  reviews: {
    tables: ['reviews', 'business_reviews', 'professional_reviews', 'driver_reviews'],
    service: 'ReviewsService',
  },
  comments: {
    tables: ['comments', 'comment_likes'],
    service: 'CommentService',
  },
  'social-interactions': {
    tables: ['likes', 'follows', 'shares', 'post_likes', 'user_follows'],
    service: 'SocialInteractionsService',
  },
  community: {
    tables: ['community_profiles', 'groups', 'group_members', 'group_posts'],
    service: 'CommunityService',
  },
  mobility: {
    tables: ['ride_requests', 'drivers', 'driver_data', 'driver_location', 'driver_documents', 'vehicle_data', 'community_ride_posts', 'community_post_interests', 'community_post_flags'],
    service: 'MobilityService',
    additionalServices: ['MobilityAdminQueryService'],
  },
  gamification: {
    tables: ['pontos_log', 'user_badges', 'badges', 'achievements', 'user_achievements'],
    service: 'GamificationService',
  },
  moderation: {
    tables: ['reports', 'moderation_actions', 'content_flags', 'banned_users'],
    service: 'ModerationService',
  },
  lostfound: {
    tables: ['lost_found_posts', 'lost_found_comments'],
    service: 'LostFoundService',
  },
  location: {
    tables: ['location_history'],
    service: 'LocationService',
  },
  admin: {
    tables: ['user_roles'],
    service: 'AdminService',
  },
};

const STORAGE_CANONICAL_ALLOWLIST = [
  'src/core/media/services/MediaService.ts',
  'src/integrations/supabase',
];

/**
 * Factory: cria uma regra ESLint para um domínio SSOT
 */
function createTableGuardRule(domain) {
  const { tables, service } = DOMAIN_RULES[domain];
  return {
    meta: {
      type: 'problem',
      docs: {
        description: `Impede acesso direto às tabelas [${tables.join(', ')}] fora do ${service}`,
        category: 'SSOT Violations',
        recommended: true,
      },
      schema: [],
    },
    create(context) {
      return {
        CallExpression(node) {
          // Skip if we're inside the canonical Service file or any additional permitted service
          const filename = context.getFilename();
          const permittedServices = [service, ...(DOMAIN_RULES[domain].additionalServices || [])];
          if (permittedServices.some(s => filename.includes(s))) {
            return;
          }

          if (
            node.callee &&
            node.callee.type === 'MemberExpression' &&
            node.callee.property &&
            node.callee.property.name === 'from' &&
            node.arguments &&
            node.arguments.length > 0 &&
            node.arguments[0].type === 'Literal'
          ) {
            const tableName = node.arguments[0].value;
            if (tables.includes(tableName)) {
              context.report({
                node,
                message: `❌ SSOT Violation: Acesso direto à tabela '${tableName}' não permitido. Use ${service}.`,
              });
            }
          }
        },
      };
    },
  };
}

// Gera todas as regras automaticamente
const rules = {};
for (const domain of Object.keys(DOMAIN_RULES)) {
  rules[`no-direct-${domain}-access`] = createTableGuardRule(domain);
}

module.exports = { rules, DOMAIN_RULES };


/**
 * ============================================================================
 * REGRA: Validação de Nomenclatura (User vs Profile vs Author)
 * ============================================================================
 * Referência: docs/SSOT_ARCHITECTURE.md
 * 
 * Proíbe nomes ambíguos e força nomenclatura explícita:
 * - Contexto social → *_profile_id
 * - Contexto global → *_user_id
 * - Proibido: author_id, owner_id, creator_id (ambíguos)
 */

const AMBIGUOUS_NAMES = [
  'author_id',
  'owner_id',
  'creator_id',
  'reviewer_id',
  'sender_id',
  'receiver_id',
  'member_id',
];

const NAMING_PATTERN_RULE = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Proíbe nomes ambíguos - use *_profile_id ou *_user_id explicitamente',
      category: 'SSOT Foundation',
      recommended: true,
    },
    messages: {
      ambiguousName: 'Nome ambíguo "{{name}}" - use "{{suggestion}}" (contexto social) ou "{{name}}_user_id" (contexto global)',
    },
    schema: [],
  },
  create(context) {
    return {
      // Detectar em interfaces TypeScript
      TSPropertySignature(node) {
        if (node.key && node.key.type === 'Identifier') {
          const name = node.key.name;
          if (AMBIGUOUS_NAMES.includes(name)) {
            const suggestion = name.replace('_id', '_profile_id');
            context.report({
              node,
              messageId: 'ambiguousName',
              data: { name, suggestion },
            });
          }
        }
      },
      
      // Detectar em objetos JavaScript
      Property(node) {
        if (node.key && node.key.type === 'Identifier') {
          const name = node.key.name;
          if (AMBIGUOUS_NAMES.includes(name)) {
            const suggestion = name.replace('_id', '_profile_id');
            context.report({
              node,
              messageId: 'ambiguousName',
              data: { name, suggestion },
            });
          }
        }
      },
      
      // Detectar em strings (queries SQL)
      Literal(node) {
        if (typeof node.value === 'string') {
          AMBIGUOUS_NAMES.forEach(ambiguous => {
            if (node.value.includes(ambiguous)) {
              const suggestion = ambiguous.replace('_id', '_profile_id');
              context.report({
                node,
                messageId: 'ambiguousName',
                data: { name: ambiguous, suggestion },
              });
            }
          });
        }
      },
    };
  },
};

// Adicionar regra ao exports
module.exports.rules['no-ambiguous-naming'] = NAMING_PATTERN_RULE;

/**
 * ========================================================================
 * REGRA: Storage SSOT
 * ========================================================================
 * Proibe acesso direto a supabase.storage fora da camada canonica.
 */
module.exports.rules['no-direct-storage-access'] = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Proibe acesso direto a supabase.storage fora do MediaService',
      category: 'SSOT Violations',
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename().replace(/\\/g, '/');
    const isAllowed = STORAGE_CANONICAL_ALLOWLIST.some((allowed) => filename.includes(allowed));
    if (isAllowed) return {};

    return {
      MemberExpression(node) {
        if (
          node.object &&
          node.object.type === 'Identifier' &&
          node.object.name === 'supabase' &&
          node.property &&
          node.property.type === 'Identifier' &&
          node.property.name === 'storage'
        ) {
          context.report({
            node,
            message: '❌ SSOT Violation: acesso direto a supabase.storage nao permitido. Use MediaService.',
          });
        }
      },
    };
  },
};
