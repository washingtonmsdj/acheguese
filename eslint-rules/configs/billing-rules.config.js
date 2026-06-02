import { createRequire } from "node:module";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

const require = createRequire(import.meta.url);
const ssot = require("../plugins/eslint-plugin-ssot.cjs");
const maps = require("../plugins/eslint-plugin-maps.cjs");
const sessionContext = require("../plugins/eslint-plugin-session-context.cjs");

export default [
  {
    ignores: [
      "src/core/billing/services/**/*.ts",
      "src/core/billing/hooks/**/*.ts",
      "src/core/billing/types/**/*.ts",
      "supabase/functions/**/*.ts",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tseslint.parser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      ssot,
      maps,
      "session-context": sessionContext,
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/gastronomy_subscriptions*"],
              message:
                "SSOT Violation: use EntitlementResolver instead of accessing gastronomy_subscriptions directly.",
            },
            {
              group: ["**/business_subscriptions*"],
              message:
                "SSOT Violation: use EntitlementResolver instead of accessing business_subscriptions directly. Use user_subscriptions as the canonical source.",
            },
            {
              group: ["**/subscription_plans*"],
              message:
                "SSOT Violation: use CatalogService instead of accessing deprecated subscription_plans directly.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='supabase'][callee.property.name='from'][arguments.0.value='gastronomy_subscriptions']",
          message:
            "SSOT Violation: direct access to gastronomy_subscriptions is forbidden. Use EntitlementResolver.resolve().",
        },
        {
          selector:
            "CallExpression[callee.object.name='supabase'][callee.property.name='from'][arguments.0.value='business_subscriptions']",
          message:
            "SSOT Violation: direct access to business_subscriptions is forbidden. Use EntitlementResolver.resolve().",
        },
        {
          selector: "VariableDeclarator[id.name='PLANS'][init.type='ObjectExpression']",
          message:
            "SSOT Violation: hardcoded PLANS are forbidden. Use CatalogService.getEligibleCatalog().",
        },
        {
          selector: "TSTypeAliasDeclaration[id.name='PlanTier'] > TSUnionType",
          message:
            "PlanTier must be imported from @/core/billing/types instead of being redefined locally.",
        },
      ],
    },
  },
];
