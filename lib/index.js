const { createTokens } = require("../.frontech/builder");
const { config } = require("../.frontech/utils");
const [fs, route, utils, R] = [
  require("fs"),
  require("path"),
  require("../.frontech/utils"),
  require("ramda"),
];
const { messages } = utils;

/**
 * @description This function is used to create architectura tokens
 * @param {{file: String; theme: String; path: String; tokens: String, disableIconsFigma: Boolean; disableIconFont: Boolean; disableIconSprites: Boolean; fontNameIcons: String;}} args
 */
const designSystemsUtils = (args) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {
        theme,
        path,
        tokens,
        disableIconFont,
        disableIconSprites,
        disableIconsFigma,
        disableUtils,
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
          const themesData = getTokensStudioByTheme(data, theme, tokenSetOrder);
          await createTokens(
            themesData,
            path,
            tokenSetOrder,
            disableIconFont,
            disableIconSprites,
            disableIconsFigma,
            disableUtils
          );
          resolve(true);
        } else {
          reject("No metadata tokens file specified");
        }
      } else {
        messages.error(`No configuration tokens file specified`);
        reject(`No configuration tokens file specified`);
      }
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
};

const getTokensStudioByTheme = (data, theme, tokenSetOrder) => {
  const dataThemes = data["$themes"];
  const baseThemes = R.pipe(
    R.map((baseTheme) => [baseTheme.name, baseTheme.selectedTokenSets]),
    R.fromPairs
  )(dataThemes);

  const dataSets = dataThemes.map((item) => {
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

    let setsToRemove = [];
    if (brand !== "core" && mode === "dark") {
      setsToRemove = R.union(
        Object.keys(baseThemes[`${brand}-light`]),
        Object.keys(baseThemes[`core-dark`])
      );
    } else if (brand !== "core" || (brand === "core" && mode !== "base")) {
      setsToRemove = Object.keys(baseThemes["core"]);
    }
    const setsToInclude = R.pipe(
      R.prop(item.name),
      R.omit(setsToRemove),
      R.toPairs,
      R.map(([key, value]) => {
        if (value === "enabled") {
          return key;
        }
      }),
      R.intersection(R.__, tokenSetOrder)
    )(baseThemes);

    if (shouldProcessTokenSet(theme, brand)) {
      return {
        brand: theme ? "core" : brand,
        mode,
        tokenSets: setsToInclude,
      };
    }
  });

  return dataSets.filter(Boolean).reduce((acc, cur) => {
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

const shouldProcessTokenSet = (theme, brand) => !theme || theme === brand;

module.exports = {
  designSystemsUtils,
};
