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

      // TODO
      // if (theme) {
      //   data = data[theme] || {};
      //   createTokens(
      //     data,
      //     path,
      //     theme,
      //     disableIconFont,
      //     disableIconSprites,
      //     disableIconsFigma
      //   );
      // } else {
      const isThemeTokensStudio = "$metadata" in data;
      if (isThemeTokensStudio) {
        const themesTokensStudio = data["$metadata"]["tokenSetOrder"];
        const themesData = getTokensStudioByTheme(data);

        createTokens(
          themesData,
          path,
          themesTokensStudio,
          disableIconFont,
          disableIconSprites,
          disableIconsFigma
        );
      }
      // }
    } else {
      messages.error(`No configuration tokens file specified`);
    }
  } catch (error) {
    console.error(error);
  }
};

const getTokensStudioByTheme = (data) => {
  let dataThemes = data["$themes"];

  const data2 = dataThemes.map((item) => {
    const partsName = item.name.split("-");
    const last = partsName.pop();
    const themeName = ["light", "dark"].includes(last)
      ? partsName.join("-")
      : item.name;
    const modeName = ["light", "dark"].includes(last) ? last : null;
    let theme;
    let mode;

    if (item.group === "theme") {
      theme = item.name;
    } else if (item.group === "mode") {
      theme = themeName;
      mode = modeName;
    }

    return {
      theme,
      mode,
      tokenSets:
        Object.values(item.selectedTokenSets) !== "disabled"
          ? Object.keys(item.selectedTokenSets) || []
          : [],
    };
  });

  return data2.reduce((acc, cur) => {
    const { theme, mode, tokenSets } = cur;
    if (theme) {
      for (const alias of tokenSets) {
        let key = `${theme}_${alias}`;
        if (mode) {
          key = `${key}_${mode}`;
        }
        acc[key] = { theme, mode, tokens: data[alias] };
      }
    }
    return acc;
  }, {});
};

module.exports = {
  designSystemsUtils,
};
