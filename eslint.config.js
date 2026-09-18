import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const ssot = require("./eslint-rules/plugins/eslint-plugin-ssot.cjs");
const sessionContext = require("./eslint-rules/plugins/eslint-plugin-session-context.cjs");
const maps = require("./eslint-rules/plugins/eslint-plugin-maps.cjs");

export default tseslint.config(
  {
    ignores: [
      "dist",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "templates/**",
      ".archive/**", // ✅ Arquivos legados arquivados
      "src/shared/types/*.generated.ts",
      "src/integrations/supabase/types.generated.ts", // ✅ Arquivo gerado automaticamente
      // Scripts de migração e setup (acesso direto ao Supabase necessário)
      "scripts/**/*.ts",
      "scripts/**/*.js",
      "scripts/**/*.mjs",
      "src/scripts/**/*.ts",
      "supabase/scripts/**/*.ts", // Scripts de migração do Supabase
      // Testes (podem ter acesso direto para setup)
      "tests/**/*.ts",
      "tests/**/*.tsx",
      "tests/**/*.test.ts",
      // Edge functions do Supabase (acesso direto necessário)
      "supabase/functions/**/*.ts",
      // Testes de validação de arquitetura de maps (violações intencionais)
      "src/__tests__/maps-architecture-validation/**/*.ts",
    ]
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "ssot": ssot,
      "session-context": sessionContext,
      "maps": maps,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // 🛡️ SSOT RULES
      "ssot/no-direct-business-access": "error",
      "ssot/no-direct-profile-access": "error",
      "ssot/no-direct-classified-access": "error",
      "ssot/no-direct-messaging-access": "error",
      "ssot/no-direct-community-qa-access": "error",
      "ssot/no-direct-posts-polls-access": "error",
      "ssot/no-direct-favorites-access": "error",
      "ssot/no-direct-reviews-access": "error",
      "ssot/no-direct-comments-access": "error",
      "ssot/no-direct-social-interactions-access": "error",
      "ssot/no-direct-community-access": "error",
      "ssot/no-direct-mobility-access": "error",
      "ssot/no-direct-gamification-access": "error",
      "ssot/no-direct-moderation-access": "error",
      "ssot/no-direct-lostfound-access": "error",
      "ssot/no-direct-location-access": "error",
      "ssot/no-direct-admin-access": "error",
      "ssot/no-direct-storage-access": "error",
      // 🔐 SESSION CONTEXT RULES
      "session-context/no-direct-supabase-auth": "error",
      "session-context/no-permission-inference": "error",
      "session-context/no-ambiguous-identifiers": "error",
      "session-context/require-capability-preview": "error",
      // 🏗️ ARCHITECTURE RULES
      "no-restricted-imports": ["error", {
        "patterns": [
          {
            "group": ["@supabase/supabase-js"],
            "message": "❌ Acesso direto ao Supabase é proibido. Use '@/integrations/supabase' ou serviços em '@/core/*'."
          },
          {
            "group": ["**/modules/*/*"],
            "message": "❌ Cross-module imports são proibidos. Mova para '@/core/*' ou '@/shared/*'."
          },
          {
            "group": ["**/integrations/*"],
            "importNamePattern": "^(?!.*index$).*",
            "message": "❌ Imports diretos de integrations são proibidos fora de '@/core/*'."
          }
        ]
      }]
    },
  },


  // API server-side infrastructure: Vercel functions run outside the browser bundle.
  // Supabase service-role creation is centralized here, not in UI/core modules.
  {
    files: ["api/_shared/supabaseAdmin.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // ─── BLINDAGEM MAPS ───────────────────────────────────────────────────────

  // 🗺️ MAPS: Blindagem arquitetural via plugin customizado
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "maps/no-direct-provider-import": "error",
      "maps/no-cross-layer-import": "error",
      "maps/no-manual-entity-projection": "warn", // warn porque pode ter falsos positivos
    },
  },

  // ─── CAMADAS ARQUITETURAIS ────────────────────────────────────────────────

  // core/* pode importar de integrations e shared, mas não de modules
  {
    files: ["src/core/**/*.ts", "src/core/**/*.tsx"],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [
          {
            "group": ["@supabase/supabase-js"],
            "message": "❌ Use '@/integrations/supabase'."
          },
          {
            "group": ["**/modules/*/*"],
            "message": "❌ Core não pode importar de modules."
          }
        ]
      }]
    },
  },

  // integrations/* não depende de lógica de negócio
  {
    files: ["src/integrations/**/*.ts", "src/integrations/**/*.tsx"],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [
          {
            "group": ["**/modules/*", "**/core/*", "**/app/*"],
            "message": "❌ Integrations não pode depender de lógica de negócio."
          }
        ]
      }]
    },
  },

  // shared/* sem dependências
  {
    files: ["src/shared/**/*.ts", "src/shared/**/*.tsx"],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [
          {
            "group": ["**/modules/*", "**/core/*", "**/app/*", "**/integrations/*"],
            "message": "❌ Shared não pode importar de modules, core, app ou integrations."
          }
        ]
      }]
    },
  },

  // modules/* isolados, sem acesso direto a integrations
  {
    files: ["src/modules/**/*.ts", "src/modules/**/*.tsx"],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [
          {
            "group": ["@supabase/supabase-js"],
            "message": "❌ Use '@/integrations/supabase' via '@/core/*'."
          },
          {
            "group": ["../../../modules/*", "../../modules/*", "@/modules/*"],
            "message": "❌ Cross-module imports são proibidos."
          },
          {
            "group": ["**/integrations/*"],
            "message": "❌ Modules não pode acessar integrations diretamente. Use '@/core/*'."
          }
        ]
      }]
    },
  },

  // ─── BLINDAGEM v3.0 — OWNERSHIP DE PERSISTÊNCIA ──────────────────────────

  // Proíbe imports de supabase em hooks, pages, components e shared
  {
    files: [
      "src/app/**/*.{ts,tsx}",
      "src/modules/**/pages/**/*.{ts,tsx}",
      "src/modules/**/components/**/*.{ts,tsx}",
      "src/core/**/hooks/**/*.{ts,tsx}",
      "src/modules/**/hooks/**/*.{ts,tsx}",
      "src/shared/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [
          {
            "group": ["**/integrations/supabase*", "**/core/supabase*"],
            "message": "❌ BLINDAGEM v3.0: Use services em '@/core/*/services/*'."
          }
        ]
      }]
    },
  },

  // Exceções formais v3.0: módulos ainda autorizados a acesso direto.
  {
    files: [
      "src/modules/community-alerts/**/*.{ts,tsx}",
      "src/modules/community-issues/**/*.{ts,tsx}",
      "src/modules/promotions/**/*.{ts,tsx}",
    ],
    rules: { "no-restricted-imports": "off" },
  },

  // ─── BLINDAGEM DE LEGADO ──────────────────────────────────────────────────

  // Bloqueia caminhos legados removidos
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [
          {
            "group": ["@/core/supabase", "@/core/supabase/*"],
            "message": "❌ REMOVIDO: Use '@/integrations/supabase'."
          },
          {
            "group": ["@/core/company", "@/core/company/*"],
            "message": "❌ REMOVIDO: Use '@/core/business'."
          },
          {
            "group": ["@/services/*"],
            "message": "❌ REMOVIDO: Use '@/core/*' ou '@/modules/*'."
          },
          {
            "group": ["@/pages/*", "../pages/*", "../../pages/*"],
            "message": "❌ REMOVIDO: Use 'src/app/pages/' ou 'src/modules/*/pages/'."
          },
          {
            "group": ["@/core/classified", "@/core/classified/*"],
            "message": "❌ REMOVIDO: Use '@/core/classifieds/' (com 's')."
          }
        ]
      }]
    },
  },

  // ─── EXCEÇÕES SESSION CONTEXT ────────────────────────────────────────────

  // SessionService: único autorizado para supabase.auth.*
  {
    files: ["src/core/session/services/SessionService.ts"],
    rules: {
      "session-context/no-direct-supabase-auth": "off",
      "ssot/no-direct-profile-access": "off",
    },
  },

  // profileMembersService usa auth.getSession() para token no boundary canônico.
  {
    files: [
      "src/core/profiles/services/multi-profile/profileMembersService.ts",
    ],
    rules: {
      "ssot/no-direct-profile-access": "off",
      "ssot/no-direct-admin-access": "off",
      "session-context/no-direct-supabase-auth": "off",
    },
  },

  // Edge function de auth admin (supabase functions)
  {
    files: ["supabase/functions/_shared/adminAuth.ts"],
    rules: {
      "ssot/no-direct-admin-access": "off",
      "session-context/no-direct-supabase-auth": "off",
    },
  },

  // ─── EXCEÇÕES SSOT POR SERVICE CANÔNICO ──────────────────────────────────

  {
    files: ["src/core/profiles/services/multi-profile/profileService.ts"],
    rules: {
      "ssot/no-direct-profile-access": "off",
      "ssot/no-direct-admin-access": "off",
    },
  },
  // ProfileService.ts: getProfileHub usa permissions apenas para exibição em UI
  {
    files: ["src/core/profiles/services/ProfileService.ts"],
    rules: {
      "session-context/require-capability-preview": "off",
    },
  },
  // PostService é o SSOT canônico de posts — acesso direto necessário por design.
  {
    files: [
      "src/core/posts/services/PostService.ts",
      "src/core/posts/services/posts.mutations.ts",
      "src/core/posts/services/posts.queries.ts",
      "src/core/posts/services/posts.alerts.queries.ts",
      "src/core/posts/services/posts.feed.queries.ts",
      "src/core/posts/services/posts.media.queries.ts",
      "src/core/posts/services/posts.user.queries.ts",
    ],
    rules: {
      "ssot/no-direct-posts-polls-access": "off",
    },
  },
  // Providers de maps dependem de contratos canonicos de core, nao de implementacoes de negocio.
  {
    files: [
      "src/integrations/maps/providers/NominatimGeocodingProvider.ts",
      "src/integrations/maps/providers/OSMTileProvider.ts",
      "src/integrations/maps/providers/OSRMProvider.ts",
    ],
    rules: {
      "no-restricted-imports": "off",
      "maps/no-cross-layer-import": "off",
    },
  },
  // Reviews Core owns direct persistence; consumers must use ReviewsService.
  {
    files: [
      "src/core/reviews/services/reviews.queries.ts",
      "src/core/reviews/services/reviews.mutations.ts",
    ],
    rules: {
      "ssot/no-direct-reviews-access": "off",
    },
  },
  // BusinessService é o SSOT canônico de businesses — acesso direto necessário por design.
  {
    files: [
      "src/core/business/services/business.admin.ts",
      "src/core/business/services/business-analytics.service.ts",
      "src/core/business/services/business.mutations.ts",
      "src/core/business/services/business.queries.ts",
      "src/core/business/BusinessHoursService.ts", // Service de horários com acesso direto necessário
    ],
    rules: { "ssot/no-direct-business-access": "off" },
  },
  // ClassifiedService é o SSOT canônico de classifieds — acesso direto necessário por design.
  {
    files: [
      "src/core/classifieds/services/classifieds.mutations.ts",
      "src/core/classifieds/services/classifieds.queries.ts",
      "src/core/admin/services/AdminClassifiedsService.ts", // Admin service com acesso direto necessário
    ],
    rules: { "ssot/no-direct-classified-access": "off" },
  },
  // MobilityService é o SSOT canônico de mobility — acesso direto necessário por design.
  {
    files: [
      "src/core/mobility/services/mobility.mutations.ts",
      "src/core/mobility/services/mobility.queries.ts",
      "src/core/mobility/services/MobilityRuntimeService.ts",
    ],
    rules: { "ssot/no-direct-mobility-access": "off" },
  },
  {
    files: ["src/core/profiles/services/multi-profile/driverService.ts"],
    rules: { "ssot/no-direct-mobility-access": "off" },
  },
  {
    files: ["src/core/auth/services/AuthService.ts"],
    rules: { "ssot/no-direct-admin-access": "off" },
  },
  // AdminRolesService é o SSOT canônico de user_roles — acesso direto necessário por design.
  {
    files: ["src/core/admin/services/AdminRolesService.ts"],
    rules: { "ssot/no-direct-admin-access": "off" },
  },
  // LocationHistoryService é o SSOT canônico de location_history — acesso direto necessário por design.
  {
    files: ["src/core/location/services/LocationHistoryService.ts"],
    rules: { "ssot/no-direct-location-access": "off" },
  },
  // routing/instance.ts é o ponto de configuração do RoutingService — pode importar providers diretamente.
  {
    files: ["src/core/routing/instance.ts"],
    rules: { "maps/no-direct-provider-import": "off" },
  },
  // ClassifiedUrlService é o SSOT de URLs de classificados — acesso read-only necessário para resolver URLs canônicas.
  {
    files: ["src/core/classifieds/services/ClassifiedUrlService.ts"],
    rules: { "ssot/no-direct-classified-access": "off" },
  },
  {
    files: ["src/core/admin/services/AdminCommunityService.ts"],
    rules: { "ssot/no-direct-mobility-access": "off" },
  },
  {
    files: ["src/core/admin/services/AdminMobilityService.ts"],
    rules: { "ssot/no-direct-profile-access": "off" },
  },
  // ProfessionalService é o SSOT de professional_data — acesso direto necessário por design.
  {
    files: ["src/core/professional/services/ProfessionalService.ts"],
    rules: { "ssot/no-direct-profile-access": "off" },
  },
  // CommunityGroupsService é owner de leitura/escrita de groups extraído do CommunityService.
  {
    files: [
      "src/core/community-groups/services/CommunityGroupsService.ts",
    ],
    rules: { "ssot/no-direct-community-access": "off" },
  },
  // Serviços Admin abaixo são owners canônicos das persistências que acessam.
  {
    files: [
      "src/core/admin/services/AdminUserService.ts",
      "src/core/admin/services/AdminEventsService.ts", // Admin service com acesso direto necessário
      "src/core/admin/services/AdminMessagingService.ts", // Admin service com acesso direto necessário
    ],
    rules: {
      "ssot/no-direct-profile-access": "off",
      "ssot/no-direct-admin-access": "off",
    },
  },
  // ProfileIdentityAdapter é o adapter canônico de identidade pública — acesso direto necessário.
  {
    files: ["src/core/public-identity/adapters/ProfileIdentityAdapter.ts"],
    rules: { "ssot/no-direct-profile-access": "off" },
  },

  // ─── EXCEÇÕES SESSION CONTEXT — TESTES ───────────────────────────────────

  {
    files: ["src/core/session/types/canonical-boundary.ts"],
    rules: { "session-context/no-ambiguous-identifiers": "off" },
  },
  {
    files: [
      "src/core/session/__tests__/**/*.ts",
      "src/core/authorization/__tests__/**/*.ts",
    ],
    rules: { "session-context/no-ambiguous-identifiers": "off" },
  },
  {
    files: [
      "src/shared/types/**/*.ts",
      "src/shared/utils/commentTree.ts",
      "src/test/**/*.ts",
      "src/test/**/*.tsx",
    ],
    rules: { "session-context/no-ambiguous-identifiers": "warn" },
  },
  {
    files: ["src/test/property/**/*.ts", "src/test/property/**/*.tsx"],
    rules: {
      "ssot/no-direct-profile-access": "warn",
      "ssot/no-direct-social-interactions-access": "warn",
    },
  },

  // ─── REGRESSION GUARDS ───────────────────────────────────────────────────

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        "paths": [
          {
            "name": "@/core/auth/contexts/AuthContext",
            "message": "❌ REGRESSION: Use useSessionContext de '@/core/session'."
          },
          {
            "name": "@/core/auth/contexts",
            "message": "❌ REGRESSION: Use useSessionContext de '@/core/session'."
          }
        ],
        "patterns": [
          {
            "group": ["**/contexts/AuthContext*"],
            "message": "❌ REGRESSION: Use useSessionContext de '@/core/session'."
          },
          {
            "group": ["**/hooks/useActiveProfile*"],
            "message": "❌ REGRESSION: Use useSessionContext de '@/core/session'.",
            "allowTypeImports": true
          },
          {
            "group": ["**/hooks/useUserProfiles*"],
            "message": "❌ REGRESSION: Use useSessionContext de '@/core/session'."
          },
          {
            "group": ["**/hooks/useUserPermissions*"],
            "message": "❌ REGRESSION: Use CapabilityPreviewService somente para visibilidade; comandos protegidos dependem do backend."
          }
        ]
      }]
    }
  },

  // Exceção: arquivos multi-profile canônicos podem usar useActiveProfile
  {
    files: [
      "src/core/profiles/hooks/useProfileMembers.ts",
      "src/core/profiles/hooks/useProfileLinks.ts",
      "src/core/profiles/components/**/*.tsx",
      "src/app/pages/ProfileSettingsPage.tsx",
    ],
    rules: { "no-restricted-imports": "off" },
  },

  // ─── DÍVIDA TÉCNICA CONTROLADA ───────────────────────────────────────────

  // MobilityAdminQueryService é o SSOT para consultas admin de mobility.
  // Reconhecido pelo plugin via additionalServices — sem exceção formal necessária.

);

