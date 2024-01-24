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
 * @param {{file: String; theme: String; path: String; tokens: String, disableIconsFigma: Boolean; disableIconFont: Boolean; disableIconSprites: Boolean; fontNameIcons: String; configFile: String}} args
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
      configFile,
      disableUtils,
    } = config(args);
    const existData =
      tokens && fs.existsSync(route.resolve(process.cwd(), tokens));
    const existConfig =
      configFile && fs.existsSync(route.resolve(process.cwd(), configFile));

    if (existData) {
      let data = JSON.parse(
        fs.readFileSync(route.resolve(process.cwd(), tokens)).toString()
      );
      let configData;
      if (existConfig) {
        configData = JSON.parse(
          fs.readFileSync(route.resolve(process.cwd(), configFile)).toString()
        );
      }
      const isThemeTokensStudio = "$metadata" in data;
      if (isThemeTokensStudio) {
        const tokenSetOrder = data["$metadata"]["tokenSetOrder"];
        const themesData = getTokensStudioByTheme(data, theme, configData);
        createTokens(
          themesData,
          path,
          tokenSetOrder,
          disableIconFont,
          disableIconSprites,
          disableIconsFigma,
          disableUtils
        );
      }
    } else {
      messages.error(`No configuration tokens file specified`);
    }
  } catch (error) {
    console.error(error);
  }
};

const getTokensStudioByTheme = (data, theme, configData) => {
  let dataThemes = data["$themes"];

  const data2 = dataThemes.map((item) => {
    const partsName = item.name.split("-");
    const last = partsName.pop();
    const themeName = ["light", "dark"].includes(last)
      ? partsName.join("-")
      : item.name;
    const modeName = ["light", "dark"].includes(last) ? last : null;
    let brand;
    let mode = "base";

    if (item.group === "theme") {
      brand = item.name;
    } else if (item.group === "mode") {
      brand = themeName;
      mode = modeName;
    }

    if (shouldProcessTokenSet(theme, brand, mode, configData)) {
      return {
        brand: theme ? "core" : brand,
        mode,
        tokenSets: getTokensSets(
          item.selectedTokenSets,
          brand,
          mode,
          configData
        ).filter(Boolean),
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

const shouldProcessTokenSet = (theme, brand, mode, configData) =>
  (!theme || theme === brand) &&
  (!configData ||
    (configData.tokenSets[brand] &&
      configData.tokenSets[brand][mode] &&
      configData.tokenSets[brand][mode].length > 0));

const getTokensSets = (selectedTokenSets, brand, mode, configData) => {
  if (Object.values(selectedTokenSets) !== "disabled") {
    return !configData
      ? Object.keys(selectedTokenSets)
      : Object.keys(selectedTokenSets).map((key) => {
          return configData.tokenSets[brand][mode].find((f) => f === key);
        });
  }
  return [];
};

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
