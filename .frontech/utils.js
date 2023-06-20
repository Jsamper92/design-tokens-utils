const [fs, route, colors, translateTokens, svgSpreact, figma, shelljs] = [
  require("fs"),
  require('path'),
  require("colors"),
  require("./tokens"),
  require('svg-spreact'),
  require('figma-icons-tokens'),
  require('shelljs')
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

  const key = _key ? new RegExp(/(--)(.*)(\=)/).exec(current)[2] : current.replace('--', '');
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
  }
}

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
      const _previewFile = fs.readFileSync(_file, (err) => {
        if (err) {
          console.error(err)
          reject(err);
        }
      }).toString();
      const isDiff = JSON.stringify(data) === JSON.stringify(_previewFile);
      if (isDiff || force) {
        fs.writeFile(route.resolve(folder, file), data, (err) => {
          if (err) {
            console.error(err)
            reject(err);
          } else {
            resolve(`File ${_file} created successfully`)
          }
        });
      }
    } else {
      fs.writeFile(route.resolve(folder, file), data, (err) => {
        if (err) {
          console.error(err)
          reject(err);
        } else {
          resolve(`File ${_file} created successfully`)
        }
      });
    }
  })

}
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
  })
};

const generateSvgSprites = (icons, path) => {
  return new Promise((resolve) => {
    try {
      const _icons = icons.map(({ data }) => data);
      const names = icons.map(({ name }) => name);
      const processId = n => `${names[n]}`;

      svgSpreact(_icons, { tidy: true, optimize: true, processId })
        .then(async ({ defs }) => {
          const files = await createFile(route.resolve(path, 'images/sprites'), 'sprites.svg', defs, true);

          if (files) {
            messages.print('icon sprit svg process started');
            messages.success(`✔︎ file ${path}/images/sprites/sprites.svg successfully created`);
            messages.print('icon sprit svg process finished');
            resolve(true);
          }
        })
        .catch(error => console.error(error))
    } catch (error) {
      console.error(error);
    }
  })
}

const generateJSUtils = ({ icons, path }) => {
  return new Promise(async (resolve) => {
    const output = route.resolve(process.cwd(), path, 'library/js');
    const content = `export const icons = ${JSON.stringify(icons, null, 2)};`;
    const files = await createFile(output, 'utils.ts', content, true);

    if (files) {
      messages.success(`✔︎ ${route.resolve(output, 'utils.ts')}`);
      resolve(true);
    }
  })
};


/**
 * This function is used to create an icon font using figma icons defined in the configuration file.
 * @param {String} path 
 * @returns {Promise<{input: String;output: String; file: String; copy: Boolean; data: String}[]>}
 */
const generateIconFont = async (path, disableIconFont, disableIconSprites) => {

  return new Promise(resolve => {
    const fontName = config().fontNameIcons ?? 'icomoon';
    const fonts = route.resolve(process.cwd(), path, 'fonts', fontName);
    const webfonts = route.resolve(__dirname, '..', 'build', 'fonts', 'webfonts.json');
    const buildFont = route.resolve(__dirname, '..', 'build', 'fonts');
    const files = `./${path}/images/icons/*.svg`;
    const dataConfig = {
      fontName,
      template: "css",
      dest: fonts,
      template: route.resolve(__dirname, '..', 'templates', '_icons.css.njk'),
      destTemplate: buildFont,
      templateClassName: "icon",
      templateFontPath: `#{general.$font-path}/${fontName}/`,
      fontHeight: 800,
      normalize: true,
      centerHorizontally: false,
      fixedWidth: false
    }
    const file = createFile(route.resolve(__dirname, '..', 'build', 'fonts'), 'webfonts.json', JSON.stringify(dataConfig, null, 2), true);
    fs.mkdirSync(route.resolve(process.cwd(), path, 'fonts', fontName), { recursive: true });
    if (!disableIconFont) {
      messages.print('process transformation icons to icon font started');
      if (file) {
        exec(`node node_modules/webfont/dist/cli.js ${files} --config ${webfonts}`, { async: true, silent: false }, async (code) => {
          const success = code === 0;
          if (success) {
            const _file = fs.readFileSync(route.resolve(buildFont, '_icons.css')).toString();
            const _data = `${setCreationTimeFile()}@use '../settings/general';\n\n${_file}`;
            const creation = createFile(route.resolve(process.cwd(), path, 'library/scss/utilities'), '_icons.scss', _data, true);
            const files = fs.readdirSync(fonts);
            const icons = fs.readdirSync(route.resolve(process.cwd(), path, 'images/icons')).map(file => file.replace('.svg', ''));
            const utils = await generateJSUtils({ path, icons });
            files.forEach(file => messages.success(`✔︎ ${fonts}/${file}`));

            if (utils && creation) {
              messages.print('process transformation icons to icon font finished');
              resolve(success);
            }
          }
        });
      }
    } else {
      resolve(true);
    }
  });

};

const buildTokens = (tokens) => {
  return new Promise(async (resolve) => {
    const _tokens = await tokensResolved(tokens);

    if (_tokens) {
      const _path = route.resolve(__dirname, '..', 'build', 'tokens');
      const _file = await createFile(_path, 'tokens-parsed.json', JSON.stringify(_tokens), true);
      if (_file) resolve(_tokens)
    }
  })

}


const getKeyIcons = (data, tokens, themes) => {
  const _keyIcons = typeof themes !== 'string' && themes.filter(icon => icon.includes('icon'));
  const _icons = _keyIcons && Object.entries(data)
    .reduce((acc, cur) => {
      const [key, value] = cur;
      if (_keyIcons.includes(key)) acc['icons'] = value;

      return acc;
    }, {});

  if (Object.keys(_icons).length > 0) {
    const icons = Object.entries(_icons.icons)
      .reduce((acc, cur) => {
        const [key, value] = cur;

        if (key === 'size') acc['size'] = tokens['size'];
        if (key !== 'size') {
          acc['icons'] = {
            ...acc['icons'],
            [key]: value
          };
        }
        return acc
      }, {})

    return icons;
  }

  return null;
}

const getIcons = async (data, theme, path) => {
  return new Promise(async (resolve) => {
    messages.print('process import icons tokens started');

    const response = await figmaIconsTokens({ theme, path: route.resolve(path, 'images/icons'), file: null, key: 'icons', data })

    if (response) {
      messages.print('process import icons tokens finished');
      resolve(true);
    }

  })
}

/**
 * @description This function is used to return config to init script design systems utils
 * @param {{theme: string; path: string; file: string; key: string; disableIconFont: Boolean; disableIconsFigma: Boolean; fontNameIcons: String}} args 
 * @returns {{theme: string; path: string; file: string; key: string; disableIconFont: Boolean, disableIconSprites: Boolean; disableIconsFigma: Boolean; fontNameIcons: String}}
 */
const config = (args) => args ? { ...args } : argv

/**
 * This function is used to return string timestamp
 * @returns {String} 
 */
const setCreationTimeFile = () => `/**\n* Do not edit directly\n* Generated on ${new Date().toUTCString()}\n*/\n`;

/**
 * This function is used to agroup data files scss
 * @param {{file: string; path: string}} param - Data file and path
 * @returns {string}
 */
const dataFilesScss = ({ file, path }) => {
  return {
    'timestamp': setCreationTimeFile(),
    'defaultVariables': `/// Variable path by default of the sources defined in the ${file} file.\n/// To modify the path, simply set the variable in the import as follows: @use '/library/web/abstracts' with ($font-path:'public/assets/fonts/');\n/// @group fonts\n$font-path: "/${path}/fonts" !default;\n/// Variable that defines the reference unit in order to transform px into rem. By default 16px. To modify the size, simply set the variable in the import as follows: @use '/library/web/abstracts' with ($rem-baseline: 10px);\n/// @group rem\n$rem-baseline: 16px !default;\n\n`,
    "settingsGeneral": `@use "settings/general" with (\n\t$font-path: $font-path,\n\t$rem-baseline: $rem-baseline\n);\n@use "base/base.scss";\n@use "tools/tools.scss";\n@use "settings/settings.scss";\n@use "utilities/utilities.scss";`,
  }
}

/**
 * This function is used to create data files scss
 * @param {{file: string; path: string}} param - Data file and path
 * @returns {string}
 */
const managementDataFileScss = (item) => {
  const _file = fs
      .readFileSync(route.resolve(item.path, item.name))
      .toString();

  if (item.name === 'abstracts.scss') {
      return `${dataFilesScss(config()).defaultVariables}${dataFilesScss(config()).settingsGeneral}\n`
  }

  return _file;
};

/**
 * This function is used to convert color hex to rgba
 * @param {string} rgba 
 * @returns {string}
 */
function RGBAToHex(rgba) {
  if (rgba.length != 6) {
    throw "Only six-digit hex colors are allowed.";
  }

  var aRgbHex = rgba.match(/.{1,2}/g);
  var aRgb = [
    parseInt(aRgbHex[0], 16),
    parseInt(aRgbHex[1], 16),
    parseInt(aRgbHex[2], 16)
  ];
  return aRgb;
}

/**
 * This function is used to check if token is reference token studio
 * @param {string} token 
 * @returns {boolean}
 */
const isReferenceTokenStudio = (token) => /^[$]/.test(token);

/**
 * This function is used to translate token to custom property
 * @param {string} token - token name
 * @returns {string}
 */
const translateReferenceToCustomProperty = (token) => {

  let varCSS = null;
  const createVarCSS = (_token) => _token.split('.')
    .reduce((acc, cur) => (acc += isReferenceTokenStudio(cur) ? cur.replace('$', '--') : `-${cur}`), '')


  if (typeof token === 'string') {
    const lenghtItemsToken = token.split(' ');
    if (lenghtItemsToken.length === 1) {
      varCSS = typeof token === 'string' && isReferenceTokenStudio(token) ? `var(${createVarCSS(token)})` : token;
    } else {
      varCSS = token.split(' ').map((item) => isReferenceTokenStudio(item) ? `var(${createVarCSS(item)})` : item).join(' ');
    }
  }

  return varCSS ?? token;
}

/**
 * This function is used to create custom properties by array of tokens.
 * @param {Array<StyleDictionaryToken>} tokens 
 * @returns {string}
 */
const createCustomProperties = (tokens) => {
  return tokens.reduce((tokens, prop) => {
    const { name, value } = prop;
    const _tokenCompositionLenght = Object.values(value).length === 1;
    const isString = typeof value === 'string';

    let customVar = '';
    let customVarAdvanced = '';


    if (!isString) {
      if (_tokenCompositionLenght) {
        customVarAdvanced += `--${name}: ${Object.values(value).map((item) => translateReferenceToCustomProperty(item)).join('')};\n`
      } else {
        if (typeof value === 'object') {
          customVarAdvanced += Object.entries(value)
            .reduce((acc, [key, _value]) => {

              return acc += `--${name}-${key}: ${translateReferenceToCustomProperty(_value)};\n`
            }, '')
        } else {
          customVarAdvanced += `--${name}: ${translateReferenceToCustomProperty(value)};\n`
        }
      }
    } else {
      customVar += `--${name}:${translateReferenceToCustomProperty(value)};\n`;
    }


    return tokens += isString ? customVar : customVarAdvanced;
  }, '');

}

module.exports = {
  config,
  getIcons,
  messages,
  RGBAToHex,
  createFile,
  buildTokens,
  getKeyIcons,
  dataFilesScss,
  generateIconFont,
  generateSvgSprites,
  setCreationTimeFile,
  isReferenceTokenStudio,
  createCustomProperties,
  managementDataFileScss,
  translateReferenceToCustomProperty
}