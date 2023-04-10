
const [fs, route, colors, translateTokens, svgSpreact, webfont, figma, argv] = [
  require("fs"),
  require('path'),
  require("colors"),
  require("./tokens"),
  require('svg-spreact'),
  require("fantasticon"),
  require('figma-icons-tokens'),
  require('minimist')(process.argv.slice(2)),
];

const { generateFonts, FontAssetType, OtherAssetType } = webfont;
const { tokensResolved } = translateTokens;
const { figmaIconsTokens } = figma;

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
 * @returns {Promise<{folder: String; file: String; data: String}[]>}
 */
const generateIconFont = async (path, mediaqueries) => {
  return new Promise(async (resolve, reject) => {
    const outputDir = route.resolve(process.cwd(), path, 'fonts', 'icomoon');
    const inputDir = route.resolve(process.cwd(), path, 'images', 'icons');
    const utilities = route.resolve(process.cwd(), path, 'library/scss/utilities');
    const dest = route.resolve(process.cwd(), path, 'library/scss/settings/_icons.scss');

    await generateFonts({
      inputDir,
      name: 'icomoon',
      fontTypes: [
        FontAssetType.EOT,
        FontAssetType.TTF,
        FontAssetType.SVG,
        FontAssetType.WOFF,
        FontAssetType.WOFF2,
      ],
      assetTypes: [OtherAssetType.SCSS],
      formatOptions: { json: { indent: 2 } },
      templates: {
        'scss': route.resolve(__dirname, '..', 'templates', 'icomoon.hbs')
      },
      fontHeight: '800',
      tag: 'i',
      prefix: 'icon',
      fontsUrl: '#{$font-path}',
    })
      .then((response) => {
        const { assetsOut } = response;
        const { scss, svg, eot, ttf, woff2, woff } = assetsOut;
        const _files = [
          {
            folder: utilities,
            file: `_icons.scss`,
            data: scss
          },
          {
            folder: outputDir,
            file: `iconmoon.svg`,
            data: svg
          },
          {
            folder: outputDir,
            file: `iconmoon.ttf`,
            data: ttf.toString()
          },
          {
            folder: outputDir,
            file: `iconmoon.eot`,
            data: eot.toString()
          },
          {
            folder: outputDir,
            file: `iconmoon.woff`,
            data: woff.toString()
          },
          {
            folder: outputDir,
            file: `iconmoon.woff2`,
            data: woff2.toString()
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
        reject('error');
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

const handlelocalSvgSprites = async (_iconsPath, response, path) => {

  return new Promise(async (resolve, reject) => {
    const icons = fs.readdirSync(_iconsPath)
      .map(file => {
        const _file = route.resolve(_iconsPath, file);
        const data = fs.readFileSync(_file).toString();
        const name = file;
        return { data, name };
      })
      .map(({ name, data }) => {
        if (response.length) {
          if (response.find(file => file.name === name)) {
            const _data = response.filter(file => file.name === name)[0].data;
            return {
              name,
              data: _data
            }
          }
        }

        return {
          name,
          data
        }
      });

    if (icons.length) {
      const sprite = await generateSvgSprites(icons, path);
      if (sprite) resolve(true);
    } else {
      messages.error('✖ There are no new icons to import');
      messages.print('process import icons tokens finished');
      messages.print('icon sprit svg process started');
      messages.error(`✖ There are no icons to create file ${path}/images/sprites/sprites.svg`);
      messages.print('icon sprit svg process finished');
      resolve(true);
    }
  })
}

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
            messages.print('process import icons tokens finished');
            messages.print('icon sprit svg process started');
            messages.success(`✔︎ file ${path}/images/sprites/sprites.svg successfully created`);
            messages.print('icon sprit svg process finished');
            resolve(true);
          }
        })
        .catch(error => console.error(error))
    } catch (error) {
      console.error('error');
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

    await figmaIconsTokens({ theme, path: route.resolve(path, 'images/icons'), file: null, key: 'icons', data })
      .then(async (response) => {
        const _iconsPath = route.resolve(process.cwd(), path, 'images', 'icons');
        const existIcons = fs.existsSync(_iconsPath);

        if (typeof response === 'object' && response.length) {
          if (!existIcons) {
            generateSvgSprites(response, path);
          } else {
            const icons = await handlelocalSvgSprites(_iconsPath, response, path);
            if (icons) resolve(true);
          }
        } else {
          if (existIcons) {
            const icons = await handlelocalSvgSprites(_iconsPath, [], path);
            if (icons) resolve('no_icons');
          } else {
            messages.print('process import icons tokens finished');
            messages.print('icon sprit svg process started');
            messages.error(`✖ There are no icons to create file ${path}/images/sprites/sprites.svg`);
            messages.print('icon sprit svg process finished');
            resolve('no_icons');
          }
        }

      })
      .catch(error => {
        console.error(error)
      })

  })
}

/**
 * @description This function is used to return config to init script design systems utils
 * @param {{theme: string; path: string; file: string; key: string;}} args 
 * @returns {{theme: string; path: string; file: string; key: string;}}
 */
const config = (args) => args ? { ...args } : argv

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