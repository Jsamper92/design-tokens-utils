
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
  customGrid,
  customMode,
  customFontFace,
  customBoxShadow,
  customMediaQueries,
  customVariablesColors,
  customVariablesCommon,
} = format;
const { config } = utils;
const { tokens } = config();

/**
 * This function is used to build tokens platforms by styledictionary
 */
const styleDictionary = (modes, brands) => {
  StyleDictionary.registerTransform({
    name: "size/px",
    type: "value",
    matcher: StyleDictionary.transform["size/px"].matcher,
    transformer: sizePx,
  });

  StyleDictionary.registerFormat({
    name: "custom/variables",
    formatter: (dictionary) => {
      return customVariablesCommon(dictionary, brands)
    }
  });

  StyleDictionary.registerFormat({
    name: "custom/variables-colors",
    formatter: customVariablesColors,
  });

  StyleDictionary.registerFormat({
    name: "custom/spacing",
    formatter: customVariablesCommon,
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
    name: "custom/boxShadow",
    formatter: dictionary => customBoxShadow(dictionary),
  });

  const uniqueMode = [...new Set(modes.map((item) => item.mode))];
  uniqueMode
    .filter((f) => f !== "base")
    .forEach((mode) => {
      StyleDictionary.registerFormat({
        name: `custom/mode-${mode}`,
        formatter: dictionary => customMode(dictionary, mode),
      });
    });

  modes.forEach(brandMode => {

    utils.messages.print(`Creating settings for ${brandMode.brand} ${brandMode.mode} mode`);
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
      /* preprocessors: ["tokens-studio"], */
      include: getIncludes(),
      platforms: setTokensConfig(brandMode),
    }).buildAllPlatforms();
    utils.messages.print(`Settings for ${brandMode.brand} ${brandMode.mode} mode created`);
  });

  utils.messages.print("Settings creation process finished");
};

/**
 * This functions include to styleDictionary the *-base-tokens-parsed.json for dark/light mode
 * @param {Object} brandMode
 */
const getIncludes = () => {
  const { tokens } = config();
  const isMultiFile = fs.statSync(route.resolve(process.cwd(), tokens)).isDirectory();

  return isMultiFile
    ? fs.readdirSync(route.resolve(process.cwd(), tokens))
      .filter(file => file.includes(".json") && !file.includes("$"))
      .map(file => route.resolve(process.cwd(), tokens, file))
    : fs.readdirSync(route.resolve(
      __dirname,
      "..",
      "build",
      "tokens"
    ))
      .filter(file => file.includes(".json") && !file.includes("$"))
      .map(file => route.resolve(
        __dirname,
        "..",
        "build",
        "tokens",
        file));
}

/**
 * This function is used to return style dictionary configuration by brand
 * @param {Object} brandMode
 */
const setTokensConfig = (brandMode) => {
  const { theme } = config();

  if (!theme) {
    return brandMode.mode === "base"
      ? brandMode.brand === "core"
        ? coreTokensConfig(brandMode.brand, brandMode.mode, brandMode.device)
        : customTokensConfig(brandMode.brand, brandMode.mode, brandMode.device)
      : modeTokensConfig(brandMode.brand, brandMode.mode, theme);
  }

  return brandMode.mode === "base"
    ? customTokensConfig(brandMode.brand, brandMode.mode, brandMode.device)
    : modeTokensConfig(brandMode.brand, brandMode.mode, true);
};

/**
 * This function is used to build tokens platforms by styledictionary
 * @param {string} path
 * @param {string[]} brands
 * @param {Array} modes
 */
const buildStyleDictionary = (path, brands, modes) => {
  const brandsPath = brands.map((brand) =>
    route.resolve(process.cwd(), path, `library/scss/${brand}`, "settings")
  );
  const haveSettings = brandsPath.map((path) => fs.existsSync(path));

  utils.messages.print("Settings creation process started");
  utils.messages.warning(
    `\nBased on the information provided in the configuration file ${tokens} the following files are generated: \n`
  );

  brandsPath.forEach((path, i) => {
    if (haveSettings[i]) fs.rmSync(path, { recursive: true });
  });

  styleDictionary(modes, brands);
  buildCore(path, brands);
};

module.exports = {
  styleDictionary,
  buildStyleDictionary,
};
