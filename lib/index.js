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
 * @param {{file: String; theme: String; path: String; tokens: String, disableIconsFigma: Boolean; disableIconFont: Boolean; disableIconSprites: Boolean; fontNameIcons: String}} args
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
        const themesData = getTokensStudioByTheme(data, theme);
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

const getTokensStudioByTheme = (data, theme) => {
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

    if (!theme || (theme && theme === brand)) {
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

  return data2.filter(Boolean).reduce((acc, cur) => {
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

module.exports = {
  designSystemsUtils,
};
