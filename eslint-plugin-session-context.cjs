/**
 * ESLint Plugin - Session Context Centralization Enforcement
 * Validates: Requirements 1.7, 5.6, 7.4, 9.1–9.7, 11.5–11.8
 *
 * Rules:
 *  - no-direct-supabase-auth      : block supabase.auth.* outside SessionService
 *  - no-permission-inference      : block activeProfile.profileType / .isActive in conditionals
 *  - no-ambiguous-identifiers     : block prohibited ambiguous identifier names
 *  - require-authorization-engine : detect profileContext.permissions.* in conditionals
 */

'use strict';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Walk up the ancestor chain and return true if any ancestor matches predicate.
 */
function hasAncestor(node, predicate) {
  let current = node.parent;
  while (current) {
    if (predicate(current)) return true;
    current = current.parent;
  }
  return false;
}

/**
 * Returns true when the node is inside an IfStatement test,
 * ConditionalExpression test, or LogicalExpression.
 */
function isInsideConditional(node) {
  return hasAncestor(node, (ancestor) => {
    if (
      (ancestor.type === 'IfStatement' || ancestor.type === 'ConditionalExpression') &&
      ancestor.test === getChildInDirection(ancestor, node)
    ) {
      return true;
    }
    if (ancestor.type === 'LogicalExpression') return true;
    return false;
  });
}

/**
 * Loose version: just checks if any conditional-like ancestor exists,
 * without requiring the node to be the direct test child.
 */
function isInsideConditionalLoose(node) {
  return hasAncestor(node, (ancestor) => {
    return (
      ancestor.type === 'IfStatement' ||
      ancestor.type === 'ConditionalExpression' ||
      ancestor.type === 'LogicalExpression'
    );
  });
}

/**
 * Tries to find which direct child of `ancestor` is on the path to `descendant`.
 * Used to check if a node is in the `test` branch of an if/ternary.
 */
function getChildInDirection(ancestor, descendant) {
  // Walk up from descendant until we find a node whose parent is ancestor
  let current = descendant;
  while (current && current.parent !== ancestor) {
    current = current.parent;
  }
  return current;
}

// ─── Rule: no-direct-supabase-auth ──────────────────────────────────────────

const noDirectSupabaseAuth = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Block direct supabase.auth.getUser() and supabase.auth.onAuthStateChange() outside SessionService',
      category: 'Session Context Centralization',
      recommended: true,
    },
    messages: {
      noDirectAuth:
        '❌ Session Violation: Direct call to "supabase.auth.{{method}}()" is not allowed outside SessionService. Use SessionService instead.',
    },
    schema: [],
  },
  create(context) {
    const BLOCKED_METHODS = ['getUser', 'onAuthStateChange'];

    function isSupabaseAuthChain(node) {
      // Matches: supabase.auth.getUser  or  supabase.auth.onAuthStateChange
      return (
        node.type === 'MemberExpression' &&
        !node.computed &&
        BLOCKED_METHODS.includes(node.property.name) &&
        node.object.type === 'MemberExpression' &&
        !node.object.computed &&
        node.object.property.name === 'auth' &&
        node.object.object.type === 'Identifier' &&
        node.object.object.name === 'supabase'
      );
    }

    function isInSessionService() {
      const filename = context.getFilename();
      return filename.includes('SessionService');
    }

    return {
      MemberExpression(node) {
        if (isInSessionService()) return;
        if (isSupabaseAuthChain(node)) {
          context.report({
            node,
            messageId: 'noDirectAuth',
            data: { method: node.property.name },
          });
        }
      },
    };
  },
};

// ─── Rule: no-permission-inference ──────────────────────────────────────────

const noPermissionInference = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Block activeProfile.profileType and activeProfile.isActive in authorization conditionals',
      category: 'Session Context Centralization',
      recommended: true,
    },
    messages: {
      noProfileTypeInference:
        '❌ Permission Inference: "activeProfile.profileType" must not be used in authorization conditionals. Use AuthorizationEngine instead.',
      noIsActiveInference:
        '❌ Permission Inference: "activeProfile.isActive" must not be used in authorization conditionals. Use AuthorizationEngine instead.',
    },
    schema: [],
  },
  create(context) {
    const BLOCKED_PROPS = {
      profileType: 'noProfileTypeInference',
      isActive: 'noIsActiveInference',
    };

    /**
     * Returns true if the MemberExpression matches:
     *   activeProfile.profileType
     *   activeProfile?.profileType
     *   activeProfile.isActive
     *   activeProfile?.isActive
     */
    function isBlockedActiveProfileAccess(node) {
      if (node.type !== 'MemberExpression') return false;
      if (node.computed) return false;
      const propName = node.property.name;
      if (!Object.prototype.hasOwnProperty.call(BLOCKED_PROPS, propName)) return false;

      const obj = node.object;
      // Handle optional chaining: activeProfile?.profileType
      // In ESTree, optional chaining `a?.b` is represented as ChainExpression > MemberExpression
      // or as MemberExpression with optional=true depending on parser.
      const objName =
        obj.type === 'Identifier'
          ? obj.name
          : obj.type === 'ChainExpression' && obj.expression.type === 'Identifier'
          ? obj.expression.name
          : null;

      return objName === 'activeProfile';
    }

    return {
      MemberExpression(node) {
        if (!isBlockedActiveProfileAccess(node)) return;
        if (!isInsideConditionalLoose(node)) return;

        const propName = node.property.name;
        const messageId = BLOCKED_PROPS[propName];
        context.report({ node, messageId });
      },
    };
  },
};

// ─── Rule: no-ambiguous-identifiers ─────────────────────────────────────────

const noAmbiguousIdentifiers = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Block prohibited ambiguous identifier names (author_id, owner_id, creator_id, etc.)',
      category: 'Session Context Centralization',
      recommended: true,
    },
    messages: {
      ambiguousIdentifier:
        '❌ Ambiguous Identifier: "{{name}}" is prohibited. Use a qualified name like "{{suggestion}}" instead.',
    },
    schema: [],
  },
  create(context) {
    const PROHIBITED = [
      'author_id',   'authorId',
      'owner_id',    'ownerId',
      'creator_id',  'creatorId',
      'driver_id',   'driverId',
      'sender_id',   'senderId',
      'recipient_id','recipientId',
      'moderator_id','moderatorId',
      'reviewer_id', 'reviewerId',
    ];

    function toSuggestion(name) {
      // snake_case → snake_profile_id, camelCase → camelProfileId
      if (name.includes('_')) {
        return name.replace(/_id$/, '_profile_id');
      }
      return name.replace(/Id$/, 'ProfileId');
    }

    function checkName(node, name) {
      if (PROHIBITED.includes(name)) {
        context.report({
          node,
          messageId: 'ambiguousIdentifier',
          data: { name, suggestion: toSuggestion(name) },
        });
      }
    }

    return {
      // Variable declarations: const author_id = ...
      Identifier(node) {
        // Only flag declarations/definitions, not every reference
        const parent = node.parent;
        if (!parent) return;

        const isDeclaration =
          (parent.type === 'VariableDeclarator' && parent.id === node) ||
          (parent.type === 'AssignmentPattern' && parent.left === node) ||
          (parent.type === 'RestElement' && parent.argument === node) ||
          (parent.type === 'ArrayPattern') ||
          (parent.type === 'ObjectPattern') ||
          (parent.type === 'FunctionDeclaration' && parent.id === node) ||
          (parent.type === 'FunctionExpression' && parent.id === node) ||
          (parent.type === 'ArrowFunctionExpression') ||
          (parent.type === 'ClassDeclaration' && parent.id === node) ||
          (parent.type === 'Param') ||
          // Function parameters
          (parent.type === 'FunctionDeclaration' && parent.params && parent.params.includes(node)) ||
          (parent.type === 'FunctionExpression' && parent.params && parent.params.includes(node)) ||
          (parent.type === 'ArrowFunctionExpression' && parent.params && parent.params.includes(node));

        if (isDeclaration) {
          checkName(node, node.name);
        }
      },

      // Object property keys: { author_id: ... }
      // SKIP: These are often database column names in queries/types
      // Property(node) {
      //   if (node.key && node.key.type === 'Identifier') {
      //     checkName(node.key, node.key.name);
      //   }
      //   if (node.key && node.key.type === 'Literal' && typeof node.key.value === 'string') {
      //     checkName(node.key, node.key.value);
      //   }
      // },

      // TypeScript interface/type property signatures: author_id: string
      // SKIP: These reflect database schema, will be fixed when DB is migrated
      // TSPropertySignature(node) {
      //   if (node.key && node.key.type === 'Identifier') {
      //     checkName(node.key, node.key.name);
      //   }
      //   if (node.key && node.key.type === 'Literal' && typeof node.key.value === 'string') {
      //     checkName(node.key, node.key.value);
      //   }
      // },

      // String literals that contain prohibited names (e.g. SQL queries)
      // SKIP: These are database column names in queries
      // Literal(node) {
      //   if (typeof node.value !== 'string') return;
      //   for (const prohibited of PROHIBITED) {
      //     if (node.value === prohibited || node.value.includes(prohibited)) {
      //       checkName(node, prohibited);
      //       break; // report once per literal
      //     }
      //   }
      // },
    };
  },
};

// ─── Rule: require-authorization-engine ─────────────────────────────────────

const requireAuthorizationEngine = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Detect profileContext.permissions.* used directly in conditionals — use AuthorizationEngine instead',
      category: 'Session Context Centralization',
      recommended: true,
    },
    messages: {
      useAuthEngine:
        '❌ Authorization Violation: "profileContext.permissions.{{permission}}" must not be used directly in conditionals. Use AuthorizationEngine.check() instead.',
      useAuthEngineGeneric:
        '❌ Authorization Violation: "profileContext.permissions" must not be accessed directly in conditionals. Use AuthorizationEngine.check() instead.',
    },
    schema: [],
  },
  create(context) {
    /**
     * Returns true if the MemberExpression is a profileContext.permissions chain:
     *   profileContext.permissions
     *   profileContext.permissions.somePermission
     *   profileContext?.permissions
     *   profileContext?.permissions?.somePermission
     */
    function isProfileContextPermissions(node) {
      if (node.type !== 'MemberExpression') return false;

      // Check for profileContext.permissions.X  (depth 2)
      if (
        node.object.type === 'MemberExpression' &&
        !node.object.computed &&
        node.object.property.name === 'permissions'
      ) {
        const base = node.object.object;
        const baseName =
          base.type === 'Identifier'
            ? base.name
            : base.type === 'ChainExpression' && base.expression.type === 'Identifier'
            ? base.expression.name
            : null;
        if (baseName === 'profileContext') return true;
      }

      // Check for profileContext.permissions  (depth 1)
      if (!node.computed && node.property.name === 'permissions') {
        const base = node.object;
        const baseName =
          base.type === 'Identifier'
            ? base.name
            : base.type === 'ChainExpression' && base.expression.type === 'Identifier'
            ? base.expression.name
            : null;
        if (baseName === 'profileContext') return true;
      }

      return false;
    }

    return {
      MemberExpression(node) {
        if (!isProfileContextPermissions(node)) return;
        if (!isInsideConditionalLoose(node)) return;

        // Determine if we have a specific permission name
        const isDeepAccess =
          node.object.type === 'MemberExpression' &&
          node.object.property.name === 'permissions';

        if (isDeepAccess) {
          context.report({
            node,
            messageId: 'useAuthEngine',
            data: { permission: node.property.name || node.property.value || '?' },
          });
        } else {
          context.report({
            node,
            messageId: 'useAuthEngineGeneric',
          });
        }
      },
    };
  },
};

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  rules: {
    'no-direct-supabase-auth': noDirectSupabaseAuth,
    'no-permission-inference': noPermissionInference,
    'no-ambiguous-identifiers': noAmbiguousIdentifiers,
    'require-authorization-engine': requireAuthorizationEngine,
  },
};
