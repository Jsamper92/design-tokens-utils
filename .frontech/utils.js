
const [fs, route, colors, translateTokens, svgtofont, figma] = [
  require("fs"),
  require('path'),
  require("colors"),
  require("./tokens"),
  require('svgtofont'),
  require('figma-icons-tokens')
];

const { tokensResolved } = translateTokens;
const { figmaIconsTokens } = figma;

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

/**
 * This function is used to create an icon font using figma icons defined in the configuration file.
 * @param {String} path 
 * @returns {Promise<{input: String;output: String; file: String; copy: Boolean; data: String}[]>}
 */
const generateIconFont = async (path, disableIconFont, disableIconSprites) => {
  return new Promise(async (resolve, reject) => {
    const fontName = 'icomoon';
    const dist = route.resolve(__dirname, '..', 'build', 'fonts');
    const src = route.resolve(process.cwd(), path, 'images/icons');
    const outputFont = route.resolve(process.cwd(), path, 'fonts', 'icomoon');
    const outputSprites = route.resolve(process.cwd(), path, 'images', 'sprites');
    const outputScss = route.resolve(process.cwd(), path, 'library/scss/utilities');
    const logger = (msg) => {
      if (msg.toLocaleLowerCase().includes('found') && !disableIconFont) console.log(`❗${msg}`);
    };

    svgtofont({
      src,
      dist,
      fontName,
      log: false,
      logger,
      css: {
        cssPath: '#{$font-path}/icomoon/',
      },
      styleTemplates: route.resolve(__dirname, '..', "templates"),
      classNamePrefix: 'icon',
      svgicons2svgfont: {
        fontHeight: 1000,
        normalize: true
      }
    })
      .then(() => {
        const _files = [
          {
            input: dist,
            output: outputScss,
            file: `_icons.scss`,
            copy: disableIconFont,
            data: setCreationTimeFile()
          },
          {
            input: dist,
            output: outputFont,
            file: `${fontName}.svg`,
            copy: disableIconFont,
          },
          {
            input: dist,
            output: outputFont,
            file: `${fontName}.ttf`,
            copy: disableIconFont,
          },
          {
            input: dist,
            output: outputFont,
            file: `${fontName}.eot`,
            copy: disableIconFont,
          },
          {
            input: dist,
            output: outputFont,
            file: `${fontName}.woff`,
            copy: disableIconFont,
          },
          {
            input: dist,
            output: outputFont,
            file: `${fontName}.woff2`,
            copy: disableIconFont,
          },
          {
            input: dist,
            output: outputSprites,
            file: `${fontName}.symbol.svg`,
            copy: disableIconSprites,
          }
        ]

        resolve(_files);
      })
      .catch((e) => {
        console.error(e);

        createFile(
          `${process.cwd()}/library/scss/utilities`,
          `_icons.scss`,
          `// To generate the iconic font, check the configuration file`
        );
        resolve(true);
      });
  })

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
 * @param {{theme: string; path: string; file: string; key: string; disableIconFont: Boolean}} args 
 * @returns {{theme: string; path: string; file: string; key: string; disableIconFont: Boolean, disableIconSprites: Boolean}}
 */
const config = (args) => args ? { ...args } : argv

/**
 * This function is used to return string timestamp
 * @returns {String} 
 */
const setCreationTimeFile = () => `/**\n* Do not edit directly\n* Generated on ${new Date().toUTCString()}\n*/\n`;

/**
 * This function is used to create file fonts
 * @param {{input: String;output: String; file: String; copy: Boolean; data: String}} param 
 */
const handleCreateAsset = async ({ input, output, file, copy, data }) => {
  if (!copy) {
      const _path = route.resolve(input, file);
      const _file = fs.readFileSync(_path, 'utf8').toString();
      const _data = data ? `${data}\n${_file}` : _file;
      const response = await createFile(output, file, _data, true);
      if (response) await messages.success(`✔︎ ${output}/${file}`);
  }
}
module.exports = {
  config,
  getIcons,
  messages,
  buildCore,
  createFile,
  buildTokens,
  getKeyIcons,
  generateIconFont,
  handleCreateAsset,
  setCreationTimeFile
}