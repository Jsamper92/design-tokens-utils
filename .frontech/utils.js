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

/**
 * @description This function is used to create core utils sass
 * @param {String} path 
 */
const buildCore = (path) => {

  const root = __dirname.replace('.frontech', '');
  const paths = [
    {
      root,
      path: route.resolve(root, `library/scss/utilities/`),
      name: `_grid.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/utilities/`),
      name: `utilities.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/tools/`),
      name: `_animations.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/tools/`),
      name: `_functions.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/base/`),
      name: `_fonts.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/base/`),
      name: `_reset.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/base/`),
      name: `base.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/settings/`),
      name: `_color.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/settings/`),
      name: `_typography.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/settings/`),
      name: `_general.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/settings/`),
      name: `_general.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/settings/`),
      name: `settings.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/tools/`),
      name: `tools.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/tools/`),
      name: `_rem.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/utilities/`),
      name: `utilities.scss`
    },
    {
      root,
      path: route.resolve(root, `library/scss/`),
      name: `abstracts.scss`
    }
  ];
  const files = paths.map((file) => {
    const { name } = file;
    const origin = route.resolve(route.resolve(process.cwd(), path), file.path.replace(file.root, ''))
    const data = `${setCreationTimeFile()}${fs
      .readFileSync(route.resolve(file.path, file.name))
      .toString()}`;
    return {
      origin,
      name,
      data
    }
  });

  Promise.all(files.map(({ origin, name, data }) => createFile(origin, name, data)));
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


/**
 * This function is used to create an icon font using figma icons defined in the configuration file.
 * @param {String} path 
 * @returns {Promise<{input: String;output: String; file: String; copy: Boolean; data: String}[]>}
 */
const generateIconFont = async (path, disableIconFont, disableIconSprites) => {

  return new Promise(resolve => {
    const fontName = 'icomoon';
    const icons = route.resolve(process.cwd(), path, 'images/icons');
    const fonts = route.resolve(process.cwd(), path, 'fonts', fontName);
    const config = route.resolve(__dirname, '..', 'build', 'fonts', 'webfonts.json');
    const buildFont = route.resolve(__dirname, '..', 'build', 'fonts');

    const dataConfig = {
      fontName,
      "template": "css",
      "dest": fonts,
      "destTemplate": buildFont,
      "templateClassName": "icon",
      "templateFontPath": `#{$font-path}/${fontName}/`,
      "fontHeight": 800,
      "normalize": true,
      "centerHorizontally": false,
      "fixedWidth": false
    }
    const file = createFile(route.resolve(__dirname, '..', 'build', 'fonts'), 'webfonts.json', JSON.stringify(dataConfig, null, 2), true);
    fs.mkdirSync(route.resolve(process.cwd(), path, 'fonts', fontName), { recursive: true });
    if (!disableIconFont) {
      messages.print('process transformation icons to icon font started');
      if (file) {
        exec(`node_modules/webfont/dist/cli.js ${icons}/*.svg --config ${config}`, { async: true, silent: false }, (code) => {
          const success = code === 0;
          if (success) {
            const _file = fs.readFileSync(route.resolve(buildFont, 'icomoon.css')).toString();
            const _data = `${setCreationTimeFile()}@use '../settings/general';\n\n${_file}`;
            const creation = createFile(route.resolve(process.cwd(), path, 'library/scss/utilities'), '_icons.scss', _data, true);
            const files = fs.readdirSync(fonts);
            
            files.forEach(file => messages.success(`✔︎ ${fonts}/${file}`));
            messages.print('process transformation icons to icon font finished');

            if (creation) resolve(success);
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
 * @param {{theme: string; path: string; file: string; key: string; disableIconFont: Boolean; disableIconsFigma: Boolean}} args 
 * @returns {{theme: string; path: string; file: string; key: string; disableIconFont: Boolean, disableIconSprites: Boolean; disableIconsFigma: Boolean}}
 */
const config = (args) => args ? { ...args } : argv

/**
 * This function is used to return string timestamp
 * @returns {String} 
 */
const setCreationTimeFile = () => `/**\n* Do not edit directly\n* Generated on ${new Date().toUTCString()}\n*/\n`;

module.exports = {
  config,
  getIcons,
  messages,
  buildCore,
  createFile,
  buildTokens,
  getKeyIcons,
  generateIconFont,
  generateSvgSprites,
  setCreationTimeFile
}