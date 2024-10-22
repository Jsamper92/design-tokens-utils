const { createTokens } = require("../.frontech/builder");
const { config } = require("../.frontech/utils");
const [fs, route, utils, R] = [
  require("fs"),
  require("path"),
  require("../.frontech/utils"),
  require("ramda"),
];
const { messages } = utils;



const isTokensMultifile = (args) => {
  const {
    tokens,
  } = config(args);
  const path = route.resolve(process.cwd(), tokens);
  const isMultifile = fs.statSync(path).isDirectory();

  if (isMultifile) {
    return {
      $metadata: JSON.parse(
        fs.readFileSync(route.resolve(process.cwd(), tokens, '$metadata.json')).toString()
      ),
      $themes: JSON.parse(
        fs.readFileSync(route.resolve(process.cwd(), tokens, '$themes.json')).toString()
      )
    }
  }

  if (!isMultifile && fs.existsSync(route.resolve(process.cwd(), tokens))) {
    const file = JSON.parse(
      fs.readFileSync(route.resolve(process.cwd(), tokens)).toString()
    );
    return {
      $metadata: file["$metadata"],
      $themes: file
    }
  }

  return {
    $metadata: null,
    $themes: null
  }
};

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
      const existData = tokens;
      if (existData) {
        const $metadata = isTokensMultifile(args).$metadata;
        const $themes = isTokensMultifile(args).$themes;
        const isMultiFile = fs.statSync(route.resolve(process.cwd(), tokens)).isDirectory();
        if ($metadata) {
          const tokenSetOrder = $metadata["tokenSetOrder"];
          const themesData = getTokensStudioByTheme($themes, theme, tokenSetOrder, isMultiFile);

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

const getTokensStudioByTheme = (data, theme, tokenSetOrder, isMultiFile) => {
  const dataThemes = isMultiFile ? data : data["$themes"];
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
    let device;
    if (item.group === "theme") {
      brand = item.name;
    } else if (item.group === "mode") {
      brand = themeName;
    } else if (item.group === "device") {
      brand = themeName;
      device = item.name;
    }

    if(modeName){
      mode = item.name;
    }

    const setsToInclude = R.pipe(
      R.prop(item.name),
      // R.omit(setsToRemove),
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
        device,
        tokenSets: setsToInclude,
      };
    }
  });

  return dataSets.filter(Boolean).reduce((acc, cur) => {
    const { brand, mode, tokenSets, device } = cur;

    if (brand) {
      for (const alias of tokenSets) {
        let key = `${brand}_${alias}`;
        if (mode) {
          key = `${key}_${mode}`;
        }
        const tokens = isMultiFile
          ? JSON.parse(fs.readFileSync(route.resolve(process.cwd(), 'tokens', `${alias}.json`)).toString())
          : data[alias];
        acc[key] = { brand, mode, tokens, device };
      }
    }
    return acc;
  }, {});
};

const shouldProcessTokenSet = (theme, brand) => !theme || theme === brand;

module.exports = {
  designSystemsUtils,
};
