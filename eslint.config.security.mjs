/**
 * ESLint Security Configuration
 *
 * Focused security gate:
 * - block exploitable patterns (XSS, eval, unsafe regex)
 * - keep non-security style/type noise out of this pipeline
 */

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import security from "eslint-plugin-security";
import noUnsanitized from "eslint-plugin-no-unsanitized";

export default [
  {
    ignores: [
      "dist/**",
      ".archive/**",
      "testsprite_tests/**",
      "coverage/**",
      "templates/**",
      "scripts/**",
      "tests/**",
      "e2e/**",
      "eslint-rules/**",
      "public/**",
      "*.cjs",
      "*.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      security,
      "no-unsanitized": noUnsanitized,
    },
    rules: {
      // Security-only profile: silence non-security static analysis noise.
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "no-undef": "off",
      "prefer-const": "off",
      "no-async-promise-executor": "off",
      "no-useless-escape": "off",

      // Critical blockers.
      "no-unsanitized/property": [
        "error",
        {
          escape: {
            methods: ["DOMPurify.sanitize"],
          },
        },
      ],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "security/detect-unsafe-regex": "error",

      // Informational.
      "security/detect-non-literal-regexp": "warn",
      "security/detect-object-injection": "warn",
      "security/detect-possible-timing-attacks": "warn",
    },
  },
  {
    files: ["**/SafeHtml.tsx", "**/safeSvg.ts"],
    rules: {
      "no-unsanitized/property": "off",
    },
  },
];
