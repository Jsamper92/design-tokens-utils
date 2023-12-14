const [fs, utils, styleDictionary, route] = [
  require("fs-extra"),
  require("./utils"),
  require("../.frontech/styledictionary"),
  require("path"),
];

const { messages } = utils;
const {
  generateIconFont,
  generateSvgSprites,
  getIcons,
  buildTokens,
  getKeyIcons,
} = utils;
const { buildStyleDictionary } = styleDictionary;

/**
 * @description This function is used to create tokens by refs to configuration file
 * @param {Object} data
 * @param {String} dictionary
 * @param {String} path
 * @param {String} theme
 * @param {disableIconFont} boolean
 */
const createTokens = async (
  data,
  path,
  theme,
  disableIconFont,
  disableIconSprites,
  disableIconsFigma
) => {
  try {
    const { tokensBrandMode, iconsBrand, brands, brandsMode } =
      _getBrandMode(data);
    const tokens = await _buildTokens(tokensBrandMode);
    const icons = _getIcons(tokens, iconsBrand, theme);

    if (icons.length > 0 && !disableIconsFigma) {
      const _icons = [];
      for (const icon of icons) {
        for (const [brand, value] of Object.entries(icon)) {
          const i = await getIcons(value.icons, theme, path, brand);
          _icons.push(i);
        }
      }
      const iconsFonts = [];
      for (const [index, brand] of brands.entries()) {
        if (_icons[index]) {
          const iconFont = await buildIconFont(
            path,
            disableIconFont,
            disableIconSprites,
            brand
          );
          iconsFonts.push(iconFont);
        }
      }
      if (tokens.length > 0 && iconsFonts.length > 0) {
        buildStyleDictionary(path, brands, brandsMode);
      }
    } else {
      const iconsFonts = [];
      for (const brand of brands) {
        const iconFont = await buildIconFont(
          path,
          disableIconFont,
          disableIconSprites,
          brand
        );
        iconsFonts.push(iconFont);
      }
      if (tokens.length > 0 && iconsFonts.length > 0) {
        buildStyleDictionary(path, brands, brandsMode);
      }
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 * @description This function returns the tokens by brand and mode, icons by brand, brands and modes
 * @param {Object} data
 */
const _getBrandMode = (data) => {
  const tokensBrandMode = {};
  const iconsBrand = {};
  const brands = [];
  const modes = [];

  for (const [key, value] of Object.entries(data)) {
    let { theme, mode, tokens } = value;
    // TODO hacer el tokens.ds generico
    if (tokens.ds && !iconsBrand[theme]) iconsBrand[theme] = tokens.ds;
    if (!mode) mode = "base";
    if (!tokensBrandMode[theme]) {
      tokensBrandMode[theme] = {};
      brands.push(theme);
    }
    if (!tokensBrandMode[theme][mode]) {
      tokensBrandMode[theme][mode] = {};
      if (!modes.find((f) => f === mode)) {
        modes.push(mode);
      }
    }
    tokensBrandMode[theme][mode][key] = tokens;
  }

  return {
    tokensBrandMode,
    iconsBrand,
    brands,
    brandsMode: _getBrandsWithMode(brands, modes),
  };
};

/**
 * @param {Array} brands
 * @param {Array} modes
 */
const _getBrandsWithMode = (brands, modes) => {
  const brandsMode = [];
  brands.forEach((brand) => {
    modes.forEach((mode) => {
      brandsMode.push({ brand, mode });
    });
  });
  return brandsMode;
};

/**
 * @description This function transform tokens and create *-tokens-parsed.json
 * @param {Object} tokensBrandMode
 */
const _buildTokens = async (tokensBrandMode) => {
  const tokens = [];
  for (const [brand, value] of Object.entries(tokensBrandMode)) {
    for (const [mode, val] of Object.entries(value)) {
      const token = await buildTokens(val, brand, mode);
      tokens.push(token);
    }
  }
  return tokens;
};

/**
 * @description This function is used to get the list of icons
 * @param {Object} tokens
 * @param {Object} iconsBrand
 * @param {String} theme
 */
const _getIcons = (tokens, iconsBrand, theme) => {
  const icons = [];
  tokens.forEach((token) => {
    if (iconsBrand[token.brand] && token.mode === "base") {
      const keyIcons = getKeyIcons(
        iconsBrand[token.brand].icon,
        token.tokens,
        theme
      );
      icons.push({ [token.brand]: keyIcons });
    }
  });
  return icons;
};

/**
 * @description This function is used to build icon font
 * @param {String} path
 */
const buildIconFont = async (
  path,
  disableIconFont,
  disableIconSprites,
  brand
) => {
  return new Promise(async (resolve) => {
    const pathIcons = route.resolve(path, "images", "icons", brand);
    const isIcons = fs.existsSync(pathIcons);
    const icons =
      isIcons &&
      fs.readdirSync(pathIcons).map((icon) => ({
        name: icon.replace(".svg", ""),
        data: fs.readFileSync(route.resolve(pathIcons, icon), "utf8"),
      }));

    if (isIcons) {
      if (!disableIconFont) {
        const iconFont = await generateIconFont(
          path,
          disableIconFont,
          disableIconSprites,
          brand
        );
        if (iconFont) {
          if (!disableIconSprites) {
            const iconSprites = await generateSvgSprites(icons, path, brand);
            if (iconSprites) resolve(true);
          } else {
            resolve(true);
          }
        }
      } else {
        if (!disableIconSprites) {
          const iconSprites = await generateSvgSprites(icons, path, brand);
          if (iconSprites) resolve(true);
        } else {
          resolve(true);
        }
      }
    } else {
      messages.print("process transformation icons to icon font started");
      messages.warning(`There are no icons on the route ${pathIcons}`);
      messages.print("process transformation icons to icon font finished");
      resolve(true);
    }
  });
};

module.exports = {
  createTokens,
};
