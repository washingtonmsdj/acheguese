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

module.exports = {
  plugins: [
    stripDuplicateGoogleFontImport,
    tailwindcss(),
    autoprefixer(),
  ],
};
