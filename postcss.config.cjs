const tailwindcss = require("tailwindcss");
const autoprefixer = require("autoprefixer");

/**
 * index.css historicamente possui um @import do Google Fonts. A fonte ja e
 * descoberta cedo pelo index.html, portanto manter a importacao no CSS final
 * cria uma segunda dependencia remota no caminho de estilos.
 *
 * Removemos somente esse @import durante o build, sem reescrever o arquivo
 * global gigante e sem tocar em imports CSS locais.
 */
const stripDuplicateGoogleFontImport = {
  postcssPlugin: "strip-duplicate-google-font-import",
  AtRule: {
    import(atRule) {
      if (atRule.params.includes("fonts.googleapis.com")) {
        atRule.remove();
      }
    },
  },
};

/**
 * Seletores da primeira versao da entrada publica que nao possuem mais caller
 * React. Alguns aparecem agrupados com seletores ainda ativos; por isso a poda
 * ocorre por seletor individual, nunca removendo a regra inteira por substring.
 */
const deadEntrySelectorPrefixes = [
  ".entry-search",
  ".entry-location-action",
  ".entry-suggestions",
  ".entry-suggestion-",
  ".entry-community-card",
  ".entry-community-heading",
  ".entry-selection-badge",
  ".entry-community-description",
  ".entry-highlights",
  ".entry-highlight-",
  ".entry-categories",
  ".entry-category-",
  ".entry-resolved",
  ".entry-message",
];

function isDeadEntrySelector(selector) {
  return deadEntrySelectorPrefixes.some((prefix) => selector.includes(prefix));
}

const stripDeadEntryLegacySelectors = {
  postcssPlugin: "strip-dead-entry-legacy-selectors",
  Rule(rule) {
    const selectors = rule.selectors;
    if (!selectors || selectors.length === 0) return;

    const keptSelectors = selectors.filter((selector) => !isDeadEntrySelector(selector));
    if (keptSelectors.length === selectors.length) return;

    if (keptSelectors.length === 0) {
      rule.remove();
      return;
    }

    rule.selectors = keptSelectors;
  },
};

module.exports = {
  plugins: [
    stripDuplicateGoogleFontImport,
    stripDeadEntryLegacySelectors,
    tailwindcss(),
    autoprefixer(),
  ],
};
