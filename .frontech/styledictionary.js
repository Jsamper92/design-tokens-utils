
const [fs, utils, route, StyleDictionary, partials, format, transform, stdConfig] = [
  require('fs'),
  require("./utils"),
  require("path"),
  require("style-dictionary"),
  require('./scss/partials'),
  require('./styleDictionary/format'),
  require('./styleDictionary/transform'),
  require('./styleDictionary/config')
];
const { tokensConfig } = stdConfig;
const { buildCore } = partials;
const { sizePx } = transform;
const { customVariablesCommon,
  customVariablesColors,
  customVariablesSpacing,
  customFontFace,
  customGrid,
  customMediaQueries
} = format;
const { config } = utils;
const { tokens, file } = config();

/**
 * This function is used to build tokens platforms by styledictionary
 * @param {string} file - name file tokens
 * @param {string} path - path export tokens
 */
const styleDictionary = () => {
  const _path = route.resolve(__dirname, '..', 'build', 'tokens', 'tokens-parsed.json');

  StyleDictionary.registerTransform({
    name: 'size/px',
    type: 'value',
    matcher: StyleDictionary.transform['size/px'].matcher,
    transformer: sizePx
  });

  StyleDictionary.registerTransform({
    name: 'size/rem',
    type: 'value',
    matcher: StyleDictionary.transform['size/px'].matcher,
    transformer: sizePx
  });

  StyleDictionary.registerFormat({
    name: 'custom/variables',
    formatter: customVariablesCommon
  });

  StyleDictionary.registerFormat({
    name: 'custom/variables-colors',
    formatter: customVariablesColors
  });

  StyleDictionary.registerFormat({
    name: 'custom/spacing',
    formatter: customVariablesSpacing
  });

  StyleDictionary.registerFormat({
    name: 'custom/font-face',
    formatter: customFontFace
  });

  StyleDictionary.registerFormat({
    name: "custom/grid",
    formatter: customGrid
  });
  StyleDictionary.registerFormat({
    name: "custom/mediaqueries",
    formatter: customMediaQueries
  });

  const styleDictionaryExtended = StyleDictionary.extend(
    {
      source: [_path],
      platforms: tokensConfig
    }
  );

  styleDictionaryExtended.buildAllPlatforms();
  utils.messages.print("Settings creation process finished");
};

const buildStyleDictionary = (dictionary, path) => {
  const _tokens = route.resolve(process.cwd(), path, 'library/scss', 'settings');
  const isSettings = fs.existsSync(_tokens);
  utils.messages.print("Settings creation process started");

  utils.messages.warning(
    `\nBased on the information provided in the configuration file ${tokens} the following files are generated: \n`
  );

  if (isSettings) fs.rmSync(_tokens, { recursive: true });

  styleDictionary(dictionary, path);
  buildCore(path, file);
}

module.exports = {
  styleDictionary,
  buildStyleDictionary
}

