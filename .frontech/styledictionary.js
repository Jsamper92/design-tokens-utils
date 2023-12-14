const [
  fs,
  utils,
  route,
  StyleDictionary,
  partials,
  format,
  transform,
  stdConfig,
] = [
  require("fs"),
  require("./utils"),
  require("path"),
  require("style-dictionary"),
  require("./scss/partials"),
  require("./styleDictionary/format"),
  require("./styleDictionary/transform"),
  require("./styleDictionary/config"),
];
const { coreTokensConfig, customTokensConfig, modeTokensConfig } = stdConfig;
const { buildCore } = partials;
const { sizePx } = transform;
const {
  customVariablesCommon,
  customVariablesColors,
  customVariablesSpacing,
  customFontFace,
  customGrid,
  customMediaQueries,
  customMode,
} = format;
const { config } = utils;
const { tokens } = config();

/**
 * This function is used to build tokens platforms by styledictionary
 */
const styleDictionary = (brandsMode, brands) => {
  StyleDictionary.registerTransform({
    name: "size/px",
    type: "value",
    matcher: StyleDictionary.transform["size/px"].matcher,
    transformer: sizePx,
  });

  StyleDictionary.registerTransform({
    name: "size/rem",
    type: "value",
    matcher: StyleDictionary.transform["size/px"].matcher,
    transformer: sizePx,
  });

  StyleDictionary.registerFormat({
    name: "custom/variables",
    formatter: customVariablesCommon,
  });

  StyleDictionary.registerFormat({
    name: "custom/variables-colors",
    formatter: customVariablesColors,
  });

  StyleDictionary.registerFormat({
    name: "custom/spacing",
    formatter: customVariablesSpacing,
  });

  StyleDictionary.registerFormat({
    name: "custom/font-face",
    formatter: (dictionary) => customFontFace(dictionary, brands),
  });

  StyleDictionary.registerFormat({
    name: "custom/grid",
    formatter: customGrid,
  });

  StyleDictionary.registerFormat({
    name: "custom/mediaqueries",
    formatter: customMediaQueries,
  });

  StyleDictionary.registerFormat({
    name: "custom/mode",
    formatter: customMode,
  });

  brandsMode.forEach((brandMode) => {
    StyleDictionary.extend({
      source: [
        route.resolve(
          __dirname,
          "..",
          "build",
          "tokens",
          `${brandMode.brand}-${brandMode.mode}-tokens-parsed.json`
        ),
      ],
      include: getIncludes(brandMode),
      platforms: setTokensConfig(brandMode),
    }).buildAllPlatforms();
  });

  utils.messages.print("Settings creation process finished");
};

/**
 * This functions include to styleDictionary the *-base-tokens-parsed.json for dark/light mode
 * @param {Object} brandMode
 */
const getIncludes = (brandMode) => {
  if (brandMode.mode !== "base") {
    return [
      route.resolve(
        __dirname,
        "..",
        "build",
        "tokens",
        `${brandMode.brand}-base-tokens-parsed.json`
      ),
    ];
  }
  return [];
};

/**
 * This function is used to return style dictionary configuration by brand
 * @param {Object} brandMode
 */
const setTokensConfig = (brandMode) => {
  if (brandMode.mode === "base") {
    return brandMode.brand === "core"
      ? coreTokensConfig
      : customTokensConfig(brandMode.brand);
  }

  return modeTokensConfig(brandMode.brand, brandMode.mode);
};

/**
 * This function is used to build tokens platforms by styledictionary
 * @param {string} path
 * @param {string[]} brands
 * @param {Array} brandsMode
 */
const buildStyleDictionary = (path, brands, brandsMode) => {
  const brandsPath = [];
  brands.forEach((brand) => {
    brandsPath.push(
      route.resolve(process.cwd(), path, `library/scss/${brand}`, "settings")
    );
  });

  const haveSettings = [];
  brandsPath.forEach((path) => {
    haveSettings.push(fs.existsSync(path));
  });

  utils.messages.print("Settings creation process started");
  utils.messages.warning(
    `\nBased on the information provided in the configuration file ${tokens} the following files are generated: \n`
  );

  brandsPath.forEach((path, i) => {
    if (haveSettings[i]) fs.rmSync(path, { recursive: true });
  });

  styleDictionary(brandsMode, brands);
  buildCore(path, brands);
};

module.exports = {
  styleDictionary,
  buildStyleDictionary,
};
