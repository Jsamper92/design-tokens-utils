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
  generateUtils,
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
 * @param {String} tokenSetOrder
 * @param {disableIconFont} boolean
 * @param {disableUtils} boolean
 */
const createTokens = async (
  data,
  path,
  tokenSetOrder,
  disableIconFont,
  disableIconSprites,
  disableIconsFigma,
  disableUtils
) => {
  try {
    messages.print(`Create tokens started`);
    const { tokensBrand, iconsBrand, brands, modes } = getTokensBrand(data);
    const _tokens = await _buildTokens(tokensBrand);
    const _icons = _getIcons(_tokens, iconsBrand);

    modes.forEach((bm) => {
      messages.success(`${utils.config().theme || bm.brand} - ${bm.mode}`);
    });

    let _iconsFonts;

    if (_icons.length > 0 && !disableIconsFigma) {
      const icons = await Promise.all(
        _icons.map(async (_icon) => {
          const [brand, value] = Object.entries(_icon)[0];
          return await getIcons(value.icons, tokenSetOrder, path, brand);
        })
      );
      _iconsFonts = await Promise.all(
        brands.map(async (brand, index) => {
          if (icons[index]) {
            return await buildIconFont(
              path,
              disableIconFont,
              disableIconSprites,
              disableUtils,
              brand
            );
          }
        })
      );
    } else {
      _iconsFonts = await Promise.all(
        brands.map(async (brand) => {
          return await buildIconFont(
            path,
            disableIconFont,
            disableIconSprites,
            disableUtils,
            brand
          );
        })
      );
    }

    if (_tokens.length > 0 && _iconsFonts.length > 0) {
      buildStyleDictionary(path, brands, modes);
      messages.print(`Create tokens finished`);
      messages.success("Successfully");
    } else {
      messages.error("No tokens or fonts found");
    }
  } catch (error) {
    console.error(error);
  }
};

/**
 * @description This function returns the tokens by brand and mode, icons by brand, brands and modes
 * @param {Object} data
 */
const getTokensBrand = (data) => {
  const tokensBrand = {};
  const icons = {};
  const iconsBrand = {};
  const brands = [];

  for (const [key, value] of Object.entries(data)) {
    let { brand, mode, tokens } = value;
    // Vamos a buscar los iconos en el objeto ds
    // TODO hacer el tokens.ds generico
    if (tokens.ds) {
      if (!icons[brand]) {
        icons[brand] = [tokens.ds];
      } else {
        icons[brand].push(tokens.ds);
      }
    }
    if (!tokensBrand[brand]) {
      tokensBrand[brand] = {};
      brands.push(brand);
    }
    if (!tokensBrand[brand][mode]) {
      tokensBrand[brand][mode] = {};
    }
    tokensBrand[brand][mode][key] = tokens;
  }

  for (const [key, value] of Object.entries(icons)) {
    if (value.length === 2) {
      iconsBrand[key] = { icon: { ...value[0].icon, ...value[1].icon } };
    } else {
      iconsBrand[key] = { icon: { ...value[0].icon } };
    }
  }

  return {
    tokensBrand,
    iconsBrand,
    brands,
    modes: getBrandsWithMode(tokensBrand),
  };
};

/**
 * @description This function returns all modes and their brand
 * @param {Array} brands
 * @param {Array} modes
 */
const getBrandsWithMode = (tokensBrand) =>
  Object.keys(tokensBrand).flatMap((brand) =>
    Object.keys(tokensBrand[brand]).map((mode) => ({ brand, mode }))
  );

/**
 * @description This function transform tokens and create *-tokens-parsed.json
 * @param {Object} tokensBrand
 */
const _buildTokens = async (tokensBrand) => {
  const tokens = [];
  for (const [brand, value] of Object.entries(tokensBrand)) {
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
 */
const _getIcons = (tokens, iconsBrand) =>
  tokens
    .filter((token) => iconsBrand[token.brand] && token.mode === "base")
    .map((token) => ({
      [token.brand]: getKeyIcons(iconsBrand[token.brand].icon, token.tokens),
    }));

/**
 * @description This function is used to build icon font
 * @param {String} path
 */
const buildIconFont = async (
  path,
  disableIconFont,
  disableIconSprites,
  disableUtils,
  brand
) => {
  return new Promise(async (resolve) => {
    const pathIcons = route.resolve(
      path,
      "images",
      "icons",
      utils.config().theme ? utils.config().theme : brand
    );
    const isIcons = fs.existsSync(pathIcons);
    const icons =
      isIcons &&
      fs.readdirSync(pathIcons).map((icon) => ({
        name: icon.replace(".svg", ""),
        data: fs.readFileSync(route.resolve(pathIcons, icon), "utf8"),
      }));

    if (isIcons) {
      if (!disableUtils) await generateUtils({ icons, path, brand });
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
