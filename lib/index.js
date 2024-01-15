const { createTokens } = require("../.frontech/builder");
const { config } = require("../.frontech/utils");
const [fs, route, utils] = [
  require("fs"),
  require("path"),
  require("../.frontech/utils"),
  require("../.frontech/styledictionary"),
];
const { messages } = utils;

/**
 * @description This function is used to create architectura tokens
 * @param {{file: String; theme: String; path: String; tokens: String, disableIconsFigma: Boolean; disableIconFont: Boolean; disableIconSprites: Boolean; fontNameIcons: String; excludeLight: Boolean}} args
 */
const designSystemsUtils = (args) => {
  try {
    const {
      theme,
      path,
      tokens,
      disableIconFont,
      disableIconSprites,
      disableIconsFigma,
      excludeLight,
    } = config(args);
    const existData =
      tokens && fs.existsSync(route.resolve(process.cwd(), tokens));

    if (existData) {
      let data = JSON.parse(
        fs.readFileSync(route.resolve(process.cwd(), tokens)).toString()
      );
      const isThemeTokensStudio = "$metadata" in data;
      if (isThemeTokensStudio) {
        const tokenSetOrder = data["$metadata"]["tokenSetOrder"];
        const themesData = getTokensStudioByTheme(data, theme, excludeLight);
        createTokens(
          themesData,
          path,
          tokenSetOrder,
          disableIconFont,
          disableIconSprites,
          disableIconsFigma
        );
      }
    } else {
      messages.error(`No configuration tokens file specified`);
    }
  } catch (error) {
    console.error(error);
  }
};

const getTokensStudioByTheme = (data, theme, excludeLight) => {
  let dataThemes = data["$themes"];

  const data2 = dataThemes.map((item) => {
    const partsName = item.name.split("-");
    const last = partsName.pop();
    const themeName = ["light", "dark"].includes(last)
      ? partsName.join("-")
      : item.name;
    const modeName = ["light", "dark"].includes(last) ? last : null;
    let brand;
    let mode;

    if (item.group === "theme") {
      brand = item.name;
    } else if (item.group === "mode") {
      brand = themeName;
      mode = modeName;
    }

    if (shouldProcessTokenSet(theme, brand, excludeLight, mode)) {
      return {
        brand: theme ? "core" : brand,
        mode,
        tokenSets:
          Object.values(item.selectedTokenSets) !== "disabled"
            ? Object.keys(item.selectedTokenSets) || []
            : [],
      };
    }
  });

  return customModePriority(data2).reduce((acc, cur) => {
    const { brand, mode, tokenSets } = cur;
    if (brand) {
      for (const alias of tokenSets) {
        let key = `${brand}_${alias}`;
        if (mode) {
          key = `${key}_${mode}`;
        }
        acc[key] = { brand, mode, tokens: data[alias] };
      }
    }
    return acc;
  }, {});
};

const shouldProcessTokenSet = (theme, brand, excludeLight, mode) =>
  (!theme || theme === brand) &&
  (!excludeLight || mode !== "light" || (mode === "light" && brand !== "core"));

/**
 * @description This function is used to sort any set of custom mode (less light).
 * Sets mode from custom in the last to overwritte core sets
 * @param {*} data
 */
const customModePriority = (data) => {
  return data.filter(Boolean).map((item) => {
    if (item.brand !== "core") {
      item.tokenSets = item.tokenSets.sort((a, b) => {
        if (a.startsWith(item.brand) && b.startsWith(item.brand)) {
          return 0;
        } else if (a.startsWith(item.brand)) {
          return 1;
        } else if (b.startsWith(item.brand)) {
          return -1;
        } else {
          return 0;
        }
      });
    }
    return item;
  });
};

module.exports = {
  designSystemsUtils,
};
