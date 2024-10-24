const [
  fs,
  route,
  colors,
  translateTokens,
  svgSpreact,
  figma,
  shelljs,
  SVGFixer,
] = [
    require("fs"),
    require("path"),
    require("colors"),
    require("./tokens"),
    require("svg-spreact"),
    require("figma-icons-tokens"),
    require("shelljs"),
    require("oslllo-svg-fixer"),
  ];

const { tokensResolved } = translateTokens;
const { figmaIconsTokens } = figma;
const { exec } = shelljs;

/**
 * @description Get argv config npm script
 * @returns {{theme: string; path: string; file: string; tokens: string; key: string; disableIconFont: Boolean, disableIconSprites: Boolean}}
 */
const argv = process.argv.slice(2).reduce((acc, current) => {
  const _key = new RegExp(/(--)(.*)(\=)/).exec(current);
  const _value = new RegExp(/(\=)(.*)/).exec(current);

  const key = _key
    ? new RegExp(/(--)(.*)(\=)/).exec(current)[2]
    : current.replace("--", "");
  const value = _value ? new RegExp(/(\=)(.*)/).exec(current)[2] : true;

  return { ...acc, [key]: value };
}, {});

/**
 * @descriptions This util is used to print types of messages
 */
const messages = {
  error: (string) => console.log(colors.red(string)),
  warning: (string) => console.log(colors.yellow(string)),
  success: (string) => console.log(colors.green(string)),
  print: (message) => {
    console.log("");
    console.log("-".repeat(message.length));
    console.log(message.toUpperCase());
    console.log("-".repeat(message.length));
    console.log("");
  },
};

/**
 * @description This function is used to check if exists any change in file and create him
 * @param {String} folder
 * @param {String} file
 * @param {*} data
 * @param {Boolean} force
 * @returns {Promise}
 */
const handleCreateFile = (folder, file, data, force) => {
  return new Promise((resolve, reject) => {
    const _file = route.resolve(folder, file);
    if (fs.existsSync(_file)) {
      const _previewFile = fs
        .readFileSync(_file, (err) => {
          if (err) {
            console.error(err);
            reject(err);
          }
        })
        .toString();
      const isDiff = JSON.stringify(data) === JSON.stringify(_previewFile);
      if (isDiff || force) {
        fs.writeFile(route.resolve(folder, file), data, (err) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            resolve(`File ${_file} created successfully`);
          }
        });
      }
    } else {
      fs.writeFile(route.resolve(folder, file), data, (err) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(`File ${_file} created successfully`);
        }
      });
    }
  });
};

/**
 * @description This function is used to check if exists folder and create file
 * @param {String} folder
 * @param {String} file
 * @param {*} data
 * @param {Boolean} force
 * @returns {Promise}
 */
const createFile = (folder, file, data, force = false) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!fs.existsSync(folder)) {
        fs.mkdir(folder, { recursive: true }, async (err) => {
          if (err) {
            console.error(err);
          } else {
            const response = await handleCreateFile(folder, file, data, force);
            resolve(response);
          }
        });
      } else {
        const response = await handleCreateFile(folder, file, data, force);
        resolve(response);
      }
    } catch (error) {
      messages.error(error);
      reject(error);
    }
  });
};

const generateSvgSprites = (icons, path, brand) => {
  const { theme } = config();
  return new Promise((resolve) => {
    try {
      const _icons = icons.map(({ data }) =>
        data.replaceAll(/fill="([^"]*)"/g, 'fill="currentColor"')
      );
      const names = icons.map(({ name }) => name);
      const processId = (n) => `${names[n]}`;

      svgSpreact(_icons, { tidy: true, optimize: true, processId })
        .then(async ({ defs }) => {
          const files = await createFile(
            route.resolve(path, `images/sprites/${theme ? theme : brand}`),
            "sprites.svg",
            defs,
            true
          );
          if (files) {
            messages.print("icon sprit svg process started");
            messages.success(
              `✔︎ file ${path}/images/sprites/${theme ? theme : brand
              }/sprites.svg successfully created`
            );
            messages.print("icon sprit svg process finished");
            resolve(true);
          }
        })
        .catch((error) => console.error(error));
    } catch (error) {
      console.error(error);
    }
  });
};

const buildThemeUtils = ({ modes }) => {
  const themes = modes
    .reduce((acc, { brand, mode }) => {
      if (!acc[brand]) {
        acc[brand] = [];
      }
      if (!['base'].includes(mode)) acc[brand].push(mode);

      return acc;
    }, {});
  return Object
    .entries(themes)
    .filter(([_, modes]) => modes.length > 0)
    .reduce((acc, [brand, modes]) => ({ ...acc, [brand]: {themes: modes} }), {})
};

const generateThemeUtils = async ({ path, modes }) => {
  return new Promise(async (resolve) => {
    const output = route.resolve(
      process.cwd(),
      path,
      `library/json`
    );

    if (modes) {
      messages.print("process transformation themes utils started");
      const files = await createFile(`${path}/library/json/themes/`, 'themes.json', JSON.stringify(modes), true);
      if (files) {
        messages.success(`✔︎ ${route.resolve(output, "themes.json")}`);
        messages.print("process transformation themes utils finished");
        resolve(true);
      }
    } else {
      resolve(true);
    }

  });
};

const generateJSONUtils = ({ icons, path, brand }) => {
  const { theme } = config();
  return new Promise(async (resolve) => {
    const output = route.resolve(
      process.cwd(),
      path,
      `library/json/${theme ? theme : brand}`
    );
    const _iconsJSON = icons.reduce((acc, cur) => {
      const { name, data } = cur;
      return { ...acc, [`${name}`]: `${data}.svg` };
    }, {});
    const content = `${JSON.stringify(_iconsJSON, null, 2)}`;
    const files = await createFile(output, "icons.json", content, true);

    if (files) {
      messages.success(`✔︎ ${route.resolve(output, "icons.json")}`);
      resolve(true);
    }
  });
};

const generateUtils = async ({ icons, path, brand }) => {
  return new Promise(async (resolve) => {
    const promises = [
      generateJSONUtils({ path, icons, brand }),
    ];
    const utils = await (
      await Promise.allSettled(promises)
    ).filter(({ status }) => status === "fulfilled");
    if (utils) {
      resolve(true);
    }
  });
};

// const fixerSvgs = async (path) => {
//   return new Promise(async (resolve) => {
//     const source = route.resolve(path, "images/icons");
//     const destination = route.resolve(process.cwd(), path, "images/test");
//     const options = {
//       showProgressBar: false,
//       throwIfDestinationDoesNotExist: true,
//       traceResolution: 600,
//     };
//     const icons = await SVGFixer(source, destination, options).fix();

//     if (icons) resolve(true);
//   });
// };

/**
 * This function is used to create an icon font using figma icons defined in the configuration file.
 * @param {String} path
 * @returns {Promise<{input: String;output: String; file: String; copy: Boolean; data: String}[]>}
 */
const generateIconFont = async (
  path,
  disableIconFont,
  disableIconSprites,
  brand
) => {
  return new Promise(async (resolve) => {
    let fontName = brand;
    // TODO fontNameIcons = [] o fontNameIconsKEY o archivo de configuración
    // por el momento se pone el brand como nombre de la fuente
    // if (brand === "core") {
    //   fontName = config().fontNameIcons ?? "icomoon";
    // }
    // if (brand === "brand-1") {
    //   fontName = config().fontBrandNameIcons ?? "brand-1";
    // }
    const fonts = route.resolve(process.cwd(), path, "fonts", fontName);
    const webfonts = route.resolve(
      __dirname,
      "..",
      "build",
      "fonts",
      fontName,
      "webfonts.json"
    );
    const buildFont = route.resolve(
      __dirname,
      "..",
      "build",
      "fonts",
      fontName
    );
    const files = `./${path}/images/icons/${brand}/*.svg`;
    const dataConfig = {
      fontName,
      template: "css",
      dest: fonts,
      template: route.resolve(__dirname, "..", "templates", "_icons.css.njk"),
      destTemplate: buildFont,
      templateClassName: "icon",
      templateFontPath: `#{variables.$font-path}/${brand}/`,
      fontHeight: 800,
      normalize: true,
      centerHorizontally: false,
      fixedWidth: false,
    };
    const file = createFile(
      route.resolve(__dirname, "..", "build", "fonts", fontName),
      "webfonts.json",
      JSON.stringify(dataConfig, null, 2),
      true
    );

    fs.mkdirSync(route.resolve(process.cwd(), path, "fonts", fontName), {
      recursive: true,
    });
    if (!disableIconFont) {
      messages.print(
        `process transformation ${brand} icons to icon font started`
      );

      if (file) {
        const _cli = route.resolve(
          route.dirname(__dirname),
          "node_modules/webfont/dist/cli.js"
        );

        exec(
          `node ${_cli} ${files} --config ${webfonts}`,
          { async: true, silent: false },
          async (code) => {
            const success = code === 0;
            if (success) {
              const _file = fs
                .readFileSync(route.resolve(buildFont, "_icons.css"))
                .toString();
              const _data = `${setCreationTimeFile()}@use '../variables';\n\n${_file}`;
              const creation = createFile(
                route.resolve(
                  process.cwd(),
                  path,
                  `library/scss/${brand}/icons`
                ),
                "_icons.scss",
                _data,
                true
              );
              const files = fs.readdirSync(fonts);
              const icons = fs
                .readdirSync(
                  route.resolve(process.cwd(), path, `images/icons/${brand}`)
                )
                .map((file) => file.replace(".svg", ""));

              files.forEach((file) => messages.success(`✔︎ ${fonts}/${file}`));

              if (creation) {
                messages.print(
                  `process transformation ${brand} icons to icon font finished`
                );
                resolve(success);
              }
            }
          }
        );
      }
    } else {
      resolve(true);
    }
  });
};

const buildTokens = (tokens, brand, mode) => {
  return new Promise(async (resolve) => {
    const _tokens = await tokensResolved(tokens);

    if (_tokens) {
      const _path = route.resolve(__dirname, "..", "build", "tokens");
      const _file = await createFile(
        _path,
        `${brand}-${mode}-tokens-parsed.json`,
        JSON.stringify(_tokens),
        true
      );
      if (_file) resolve({ brand, mode, tokens: _tokens });
    }
  });
};

const getKeyIcons = (data, tokens) => {
  if (Object.keys(data).length > 0) {
    const icons = Object.entries(data).reduce((acc, cur) => {
      const [key, value] = cur;
      if (key === "size") acc["size"] = tokens["size"];
      if (key !== "size") {
        acc["icons"] = {
          ...acc["icons"],
          [key]: value,
        };
      }
      return acc;
    }, {});
    return icons;
  }
  return null;
};

const getIcons = async (data, tokenSetOrder, path, brand) => {
  const { theme } = config();
  const brandName = theme ? theme : brand;
  return new Promise(async (resolve) => {
    messages.print("process import icons tokens started");


    const response = await figmaIconsTokens({
      tokenSetOrder,
      path: route.resolve(path, `images/icons/${brandName}`),
      file: null,
      key: "icons",
      data,
    });

    if (response) {
      messages.print("process import icons tokens finished");
      resolve(brandName);
    }
  });
};

/**
 * @description This function is used to return config to init script design systems utils
 * @param {{theme: string; platforms: string; path: string; file: string; key: string; disableIconFont: Boolean; disableIconsFigma: Boolean; fontNameIcons: String}} args
 * @returns {{theme: string; platforms: string; path: string; file: string; key: string; disableIconFont: Boolean, disableIconSprites: Boolean; disableIconsFigma: Boolean; disableUtils: Boolean; fontNameIcons: String;}}
 */
const config = (args) => (args ? { ...args } : argv);

/**
 * This function is used to return string timestamp
 * @returns {String}
 */
const setCreationTimeFile = () =>
  `/**\n* Do not edit directly\n* Generated on ${new Date().toUTCString()}\n*/\n`;

/**
 * This function is used to agroup data files scss
 * @param {{file: string; path: string}} param - Data file and path
 * @returns {string}
 */
const dataFilesScss = ({ file, path }, brand) => ({
  fonts: `\n// Please include the source file in the ${file} to create the font-faces.`,
  timestamp: setCreationTimeFile(),
  themeVariables: `/// Variable path by default of the sources defined in the ${file} file.\n/// To modify the path, simply set the variable in the import as follows: @use '/library/web/abstracts' with ($font-path:'public/assets/fonts/');\n/// @group fonts\n$font-path: "./${path}/fonts" !default;\n/// Variable that defines the reference unit in order to transform px into rem. By default 16px. To modify the size, simply set the variable in the import as follows: @use '/library/web/abstracts' with ($rem-baseline: 10px);\n/// @group rem\n$rem-baseline: 16px !default;\n\n@use "[put_your_path_here]/dist/assets/library/scss/core/variables" with (\n$font-path: $font-path,\n$rem-baseline: $rem-baseline\n);`,
  customVariables: `/// Variable path by default of the sources defined in the ${file} file.\n/// To modify the path, simply set the variable in the import as follows: @use '/library/web/abstracts' with ($font-path:'public/assets/fonts/');\n/// @group fonts\n$font-path: "./${path}/fonts" !default;\n/// Variable that defines the reference unit in order to transform px into rem. By default 16px. To modify the size, simply set the variable in the import as follows: @use '/library/web/abstracts' with ($rem-baseline: 10px);\n/// @group rem\n$rem-baseline: 16px !default;\n\n@use "../core/variables" with (\n$font-path: $font-path,\n$rem-baseline: $rem-baseline\n);`,
  defaultVariables: `/// Variable path by default of the sources defined in the ${file} file.\n/// To modify the path, simply set the variable in the import as follows: @use '/library/web/abstracts' with ($font-path:'public/assets/fonts/');\n/// @group fonts\n$font-path: "./${path}/fonts" !default;\n/// Variable that defines the reference unit in order to transform px into rem. By default 16px. To modify the size, simply set the variable in the import as follows: @use '/library/web/abstracts' with ($rem-baseline: 10px);\n/// @group rem\n$rem-baseline: 16px !default;\n\n`,
  settingsGeneral: `@use "./variables" with (\n\t$font-path: $font-path,\n\t$rem-baseline: $rem-baseline\n);\n@use "base/base.scss";\n@use "tools/tools.scss";\n@use "settings/settings.scss";\n@use "utilities/utilities.scss";\n@use "icons/icons.scss";\n@use "elements/elements.scss";`,
  settingsGeneralByTheme: `@use "./variables" with (\n\t$font-path: $font-path,\n\t$rem-baseline: $rem-baseline\n);\n@use "[put_your_path_here]/dist/assets/library/scss/core/base/base.scss";\n@use "[put_your_path_here]/dist/assets/library/scss/core/tools/tools.scss";\n@use "[put_your_path_here]/dist/assets/library/scss/core/settings/settings.scss";\n@use "settings/settings-${brand}.scss";\n@use "[put_your_path_here]/dist/assets/library/scss/core/utilities/utilities.scss";\n@use "icons/icons.scss";\n@use "[put_your_path_here]/dist/assets/library/scss/core/elements/elements.scss";`,
  settingsGeneralByBrand: `@use "./variables" with (\n\t$font-path: $font-path,\n\t$rem-baseline: $rem-baseline\n);\n@use "../core/base/base.scss";\n@use "../core/tools/tools.scss";\n@use "../core/settings/settings.scss";\n@use "settings/settings-${brand}.scss";\n@use "../core/utilities/utilities.scss";\n@use "icons/icons.scss";\n@use "../core/elements/elements.scss";`,
});

/**
 * This function is used to create data files scss
 * @param {{file: string; path: string}} param - Data file and path
 * @returns {string}
 */
const managementDataFileScss = (item) =>
  item.data || fs.readFileSync(route.resolve(item.path, item.name)).toString();

/**
 * This function is used to check if token is reference token studio
 * @param {string} token
 * @returns {boolean}
 */
const isReferenceTokenStudio = (token) =>
  /^[$]/.test(token) || /^\{.*\}$/.test(token);

/**
 * This function is used to translate token to custom property
 * @param {string} token - token name
 * @returns {string}
 */
const translateReferenceToCustomProperty = (token) => {
  let varCSS = null;
  const createVarCSS = (_token) =>
    _token
      .split(".")
      .reduce(
        (acc, cur) =>
        (acc += /^[$]/.test(cur)
          ? cur.replace("$", "--")
          : /^\{/.test(cur)
            ? cur.replace("{", "--")
            : `-${cur.replace("}", "")}`),
        ""
      );

  if (typeof token === "string") {
    const lenghtItemsToken = token.split(" ");
    const needCalcCSS = token.includes("*");

    if (lenghtItemsToken.length === 1) {
      varCSS =
        typeof token === "string" && isReferenceTokenStudio(token)
          ? `var(${createVarCSS(token)})`
          : token;
    } else {
      const _token = token
        .split(" ")
        .map((item) =>
          isReferenceTokenStudio(item) ? `var(${createVarCSS(item)})` : item
        )
        .join(" ");
      varCSS = needCalcCSS ? `calc(${_token})` : _token;
    }
  }

  return varCSS ?? token;
};


/**
 * Creates a CSS box-shadow attribute string from a shadow object.
 *
 * @param {Object} shadow - The shadow object.
 * @param {number} shadow.x - The horizontal offset of the shadow.
 * @param {number} shadow.y - The vertical offset of the shadow.
 * @param {number} shadow.blur - The blur radius of the shadow.
 * @param {number} shadow.spread - The spread radius of the shadow.
 * @param {string} shadow.color - The color of the shadow.
 * @returns {string} The CSS box-shadow attribute string.
 */
const createBoxShadow = (shadow) => {
  const { x, y, blur, spread, color } = shadow;
  return `${x}px ${y}px ${blur}px ${spread}px ${translateReferenceToCustomProperty(color)}`;
}

const createCustomPropertiesBoxShadow = (tokens) => {
  const _tokens = tokens
    .filter(({ type }) => {
      return type === "boxShadow"
    })
    .map((item) => {
      const { original } = item;
      const { value, type, description } = original;
      return {
        ...item,
        original: { value, type, description },
      };
    })
    .reduce((tokens, prop) => {
      const { name, value } = prop;

      const token = Array.isArray(value)
        ? value.reduce((acc, cur, i) => `${acc} ${value.length - 1 === i
          ? createBoxShadow(cur)
          : `${createBoxShadow(cur)},`}`, "")
        : createBoxShadow(value);
      return (tokens += `--${name}: ${token};\n`);
    }, "");

  return _tokens;
};

/**
 * This function is used to create custom properties by array of tokens.
 * @param {Array<StyleDictionaryToken>} tokens
 * @returns {string}
 */
const createCustomProperties = (tokens) => {
  return tokens.reduce((tokens, prop) => {
    const { name, value } = prop;
    const _tokenCompositionLenght = Object.values(value).length === 1;
    const isString = typeof value === "string";

    let customVar = "";
    let customVarAdvanced = "";

    if (!isString) {
      if (_tokenCompositionLenght) {
        customVarAdvanced += `--${name}: ${Object.values(value)
          .map((item) => translateReferenceToCustomProperty(item))
          .join("")};\n`;
      } else {
        if (typeof value === "object") {
          customVarAdvanced += Object.entries(value).reduce(
            (acc, [key, _value]) => {
              return (acc += `--${name}-${key}: ${translateReferenceToCustomProperty(
                _value
              )};\n`);
            },
            ""
          );
        } else {
          customVarAdvanced += `--${name}: ${translateReferenceToCustomProperty(
            value
          )};\n`;
        }
      }
    } else {
      customVar += `--${name}:${translateReferenceToCustomProperty(value)};\n`;
    }

    return (tokens += isString ? customVar : customVarAdvanced);
  }, "");
};

const keysDevices = ["mobile", "desktop"];

module.exports = {
  config,
  getIcons,
  messages,
  createFile,
  keysDevices,
  buildTokens,
  getKeyIcons,
  dataFilesScss,
  generateUtils,
  createBoxShadow,
  buildThemeUtils,
  generateIconFont,
  generateSvgSprites,
  generateThemeUtils,
  setCreationTimeFile,
  isReferenceTokenStudio,
  createCustomProperties,
  managementDataFileScss,
  createCustomPropertiesBoxShadow,
  translateReferenceToCustomProperty,
};
