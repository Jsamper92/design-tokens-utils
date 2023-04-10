
const [fs, utils, route] = [
  require('fs'),
  require("./utils"),
  require("path")
];
const { createFile } = utils;
const setCreationTimeFile = () => `// Do not edit directly\n// Generated on ${new Date().toLocaleString()}\n\n`;

const buildCore = (path) => {

  const root = __dirname.replace('.frontech', '');

  const paths = [
    {
      root,
      force: true,
      name: `_grid.scss`,
      path: route.resolve(root, `library/scss/utilities/`),
    },
    {
      root,
      force: false,
      name: `utilities.scss`,
      path: route.resolve(root, `library/scss/utilities/`),
    },
    {
      root,
      force: false,
      name: `_functions.scss`,
      path: route.resolve(root, `library/scss/tools/`),
    },
    {
      root,
      force: false,
      name: `_reset.scss`,
      path: route.resolve(root, `library/scss/base/`),
    },
    {
      root,
      force: false,
      name: `tools.scss`,
      path: route.resolve(root, `library/scss/tools/`),
    },
    {
      root,
      force: false,
      name: `_rem.scss`,
      path: route.resolve(root, `library/scss/tools/`),
    },
    {
      root,
      force: false,
      name: `abstracts.scss`,
      path: route.resolve(root, `library/scss/`),
    }
  ];

  const files = paths.map((file) => {
    const { name, force } = file;
    const origin = route.resolve(route.resolve(process.cwd(), path), file.path.replace(file.root, ''))
    const data = `${setCreationTimeFile()}${fs
      .readFileSync(route.resolve(file.path, file.name))
      .toString()}`;
    return {
      name,
      data,
      force,
      origin,
    }
  });
  const partials = createImportDynamicPartials(path);

  Promise.all([...files, ...partials]
    .map(({ origin, name, data, force }) => createFile(origin, name, data, force)));

};

const createSettingsPartials = (path) => {
  const _root = route.resolve(process.cwd(), path, 'library/scss', 'settings');
  const _nameSettingsPartials = fs.readdirSync(_root)
    .filter(file => file.includes('_'));
  const _settingsPartials = [..._nameSettingsPartials]
    .map(file => {
      const origin = route.resolve(_root)
      const data = `${setCreationTimeFile()}${fs
        .readFileSync(route.resolve(origin, file))
        .toString()}`;
      return {
        origin,
        name: file,
        data
      }
    });
  const _settingsPartialsRequired = [
    {
      origin: route.resolve(_root),
      name: 'settings.scss',
      data: `${setCreationTimeFile()}${[..._nameSettingsPartials, '_general.scss']
        .map(file => file.replace('_', '').replace('.scss', ''))
        .reduce((acc, current) => (acc += `@forward '${current}';\n`), '')}`,
      force: true
    },
    {
      origin: route.resolve(_root),
      name: '_general.scss',
      data: `${setCreationTimeFile()}/// Variable path by default of the sources defined in the .frontech.json file.\n/// To modify the path, simply set the variable in the import as follows: @use '~@front-tech/design-systems-utils/library/web/abstracts' with ($font-path:'public/assets/fonts/');\n/// @group fonts\n$font-path: "/${path}/fonts/" !default;\n/// Variable that defines the reference unit in order to transform px into rem. By default 16px. To modify the size, simply set the variable in the import as follows: @use '~@front-tech/design-systems-utils/library/web/abstracts' with ($rem-baseline: 10px);\n/// @group rem\n$rem-baseline: 16px !default;\n/// Variable that transforms pixels into rem for browsers that support rem as well as if they do not. By default false.\n/// @group rem\n$rem-fallback: false !default;\n/// Variable that provides compatibility with Internet Explorer 9 and does not convert pixels into rem, as it is not compatible. By default, it is false.\n/// @group rem\n$rem-px-only: false !default;`,
      force: false
    }
  ]

  return [..._settingsPartials, ..._settingsPartialsRequired];
}

const createBasePartials = (path) => {
  const _root = route.resolve(process.cwd(), path, 'library/scss', 'base');
  const _nameBasePartials = fs.readdirSync(_root)
    .filter(file => file.includes('_'));
  const _basePartials = [..._nameBasePartials]
    .map(file => {
      const origin = route.resolve(_root)
      const data = `${setCreationTimeFile()}${fs
        .readFileSync(route.resolve(origin, file))
        .toString()}`;
      return {
        origin,
        name: file,
        data
      }
    });

  const _basePartialsRequired = [
    {
      origin: route.resolve(_root),
      name: 'base.scss',
      data: `${setCreationTimeFile()}@forward 'reset';\n${[..._nameBasePartials]
        .filter(file => !file.includes('_reset.scss'))
        .map(file => file.replace('_', '').replace('.scss', ''))
        .reduce((acc, current) => (acc += `@forward '${current}';\n`), '')}`,
      force: false
    }
  ]

  return [..._basePartials, ..._basePartialsRequired];
}

const createImportDynamicPartials = (path) => {
  const settings = createSettingsPartials(path);
  const base = createBasePartials(path);

  return [...settings, ...base];
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
    const isString = typeof value === 'string';

    let customVar = '';
    let customVarAdvanced = '';


    if (!isString) {
      if (_tokenCompositionLenght) {
        customVarAdvanced += `--${name}: ${Object.values(value).map((item) => item).join('')};\n`
      } else {
        customVarAdvanced += Object.entries(value)
          .reduce((acc, [key, _value]) => (acc += `--${name}-${key}: ${_value};\n`), '')
      }
    }
    customVar += `--${name}:${value};\n`;
    return tokens += isString ? customVar : customVarAdvanced;
  }, '');

}


/**
 * This function is used to build tokens platforms by styledictionary
 * @param {string} file - name file tokens
 * @param {string} path - path export tokens
 */
const styleDictionary = (file, path) => {

  const _path = route.resolve(__dirname, '..', 'build', 'tokens', 'tokens-parsed.json');
  const buildPath = route.resolve(process.cwd(), path);
  const dictionary = file && fs.readFileSync(route.resolve(process.cwd(), file)).toString();
  const scss = {
    scss: {
      transformGroup: "scss",
      buildPath: `${buildPath}/library/scss/`,
      files: [
        {
          destination: "settings/_color.scss",
          format: "css/variables",
          filter: {
            type: "color"
          }
        },
        {
          destination: "settings/_typography.scss",
          format: "custom/variables-fonts",
          filter: {
            attributes: {
              category: 'font',
            }
          },
        },
        {
          destination: "base/_fonts.scss",
          format: "custom/fonts",
          filter: ({ type }) => ['typography', 'fontWeights'].includes(type),
        },
        {
          destination: "base/_font-face.scss",
          format: "custom/font-face",
          filter: ({ type }) => ['fontFamilies', 'fontWeights'].includes(type),
        },
        {
          destination: "settings/_grid.scss",
          format: "custom/grid",
          filter: {
            type: "sizing"
          }
        },
        {
          destination: "tools/_media-queries.scss",
          format: "custom/mediaqueries",
          filter: {
            type: "sizing"
          }
        },
        {
          destination: "settings/_opacity.scss",
          format: "css/variables",
          filter: {
            type: "opacity"
          }
        },
        {
          destination: "settings/_border.scss",
          format: "custom/variables",
          filter: ({ attributes }) => attributes.category.includes('border')
        },
      ]
    }
  };
  const platforms = dictionary ? { scss, ...(JSON.parse(dictionary)) } : scss;
  const StyleDictionary = require("style-dictionary").extend(
    {
      source: [_path],
      platforms
    }
  );

  StyleDictionary.registerFormat({
    name: 'custom/variables-fonts',
    formatter: ({ dictionary: { allTokens } }) => {

      const filterTokens = allTokens.filter(({ type }) => !['fontFamilies', 'typography'].includes(type));
      const _tokens = createCustomProperties(filterTokens);

      return `${setCreationTimeFile()}:root{\n${_tokens}}`
    }
  });


  StyleDictionary.registerFormat({
    name: 'custom/variables',
    formatter: ({ dictionary: { allTokens } }) => {

      const _tokens = createCustomProperties(allTokens);

      return `${setCreationTimeFile()}:root{\n${_tokens}}`
    }
  });

  StyleDictionary.registerFormat({
    name: 'custom/fonts',
    formatter: ({ dictionary: { allTokens } }) => {
      const _weights = allTokens
        .filter(({ type }) => type === 'fontWeights')
        .reduce((acc, { path, value }) => ({ ...acc, [value]: [path[path.length - 1]] }), {});

      const _tokens = allTokens
        .filter(({ type }) => type === 'typography')
        .reduce((classes, prop) => {
          const { value, name } = prop;
          const { fontFamily, fontWeight, fontSize, letterSpacing, lineHeight } = value;

          const pathFolder = route.resolve(process.cwd(), path, 'fonts', fontFamily.split(',')[0]);
          const isFolder = fs.existsSync(pathFolder);
          const [_font, ...callbacks] = fontFamily.split(',');
          const _fontName = `'${_font}-${_weights[fontWeight]}'`.toLocaleLowerCase();
          const _fontFamily = `${_fontName},${callbacks.join(',')}`
          const isIcon = prop.path.includes('icon');
          const _classesIcon = `\nfont-size: ${fontSize};\nline-height: ${lineHeight};\n`;
          const _classesFont = `\nfont-family:${_fontFamily};\nfont-weight:${fontWeight};\nfont-size:${fontSize};\nletter-spacing: ${letterSpacing};\nline-height: ${lineHeight};\n`;
          const _properties = isIcon ? _classesIcon : _classesFont;

          const classCSS = `\n.${name} {${_properties}}\n`;
          classes += !isFolder && !isIcon ? `\n// The font-face of this font has not been created as it is not found in the project.\n// Include the font file in /${path}/fonts. ${classCSS}` : classCSS;

          return classes;
        }, '');

      return `${setCreationTimeFile()}${_tokens}`
    }
  });

  StyleDictionary.registerFormat({
    name: 'custom/font-face',
    formatter: ({ dictionary: { allTokens } }) => {

      const _formats = {
        '.woff': 'woff',
        '.woff2': 'woff2',
        '.ttf': 'truetype',
        '.otf': 'opentype',
        '.svg': 'svg',
      }

      const _families = allTokens
        .filter(({ type }) => type === 'fontFamilies')
        .map(({ value }) => value.split(',')[0]);

      const _weights = allTokens
        .filter(({ type }) => type === 'fontWeights')
        .reduce((acc, { path, value }) => ({ ...acc, [path[path.length - 1]]: value }), {});

      const _fonts = _families
        .map((family) => {
          return Object.entries(_weights).reduce((acc, [key, value]) => {
            const name = `${family}-${key}`;
            const pathFolder = route.resolve(process.cwd(), path, 'fonts', family);
            const isFolder = fs.existsSync(pathFolder);
            const files = isFolder && fs.readdirSync(pathFolder)
            const isFile = files.length && files.some((file) => file.toLocaleLowerCase().includes(name.toLocaleLowerCase()));
            const file = files.length && files
              .map((file) => file.replace(/\.[^/.]+$/, "").toLocaleLowerCase() === name.toLocaleLowerCase() ? file : null)
              .filter(Boolean);

            if (Boolean(isFile)) {
              return ({ ...acc, [file]: value })
            }
          }, {})
        })
        .filter(Boolean)


      const _tokens = _fonts.reduce((fontFace, prop, index) => {
        fontFace += Object.entries(prop)
          .filter(Boolean)
          .reduce((acc, [key, value]) => {
            const name = key.split(',');
            const _name = name[0].replace(/\.[^/.]+$/, "").toLocaleLowerCase();
            const extensions = name
              .reduce((acc, value) => {
                const _extension = new RegExp(/\.[^/.]+$/).exec(value)[0];
                return acc += `url('#{$font-path}/${_families[index]}/${value}') format('${_formats[_extension]}'),\n`;
              }, '');

            return acc += `\n\n@font-face {\nfont-family: '${_name}';\nfont-weight: ${value};\nsrc: ${extensions}}\n`;
          }, '');

        return fontFace
      }, '');

      const content = _tokens.length ? `@use '../settings/general' as *;${_tokens}` : `\n// Please include the source file in the ${path}/fonts to create the font-faces.`;
      return `${setCreationTimeFile()}${content}`
    }
  });

  StyleDictionary.registerFormat({
    name: "custom/grid",
    formatter: (dictionary) => {

      try {
        let result = [];
        for (const key in dictionary.properties.size) {

          if (key !== 'scale') {
            let value = dictionary.properties.size[key];
            /*           grid.push(dictionary.properties.size);
                      layout = value.gutter.attributes.type;
                      const [gutter, offset, columns, width] = [
                        value.gutter,
                        value.offset,
                        value.columns,
                        value.width
                      ];
                      result += `${layout}:(
                          ${gutter.path[2]}:${gutter.value},
                          ${offset.path[2]}:${offset.value},
                          ${columns.path[2]}:${columns.value},
                          ${width.path[2]}:${width.value}
                        ),`; */
          }

        }

        return `/// Dynamically created map based on the configuration file. Define the breakpoints of the different breakpoints\n/// @type map\n/// @group grid \n$breakpoints: (
                  ${result}
              );`;
      } catch {
        utils.messages.error(
          `✖ No grid utility configuration specified. The file will be created without content. Please check the configuration file ${file}.`
        );
        return `// To generate the grid configuration, check the configuration file ${file}\n$breakpoints:()!default;`;
      }
    }
  });
  StyleDictionary.registerFormat({
    name: "custom/mediaqueries",
    formatter: (dictionary) => {
      try {
        let result = [];
        for (const key in property.grid) {
          let value = property.grid[key];
          layout = value.gutter.attributes.type;

          const [width] = [value.width.value];
          result += `/// Mixin whose objective is to create the media-query based on the cut points established in the configuration file\n///\n///\n/// @example scss\n///\n///      .test{\n///         width: 100%;\n///         @include screen-${key}(){\n///           width: auto;\n///         }\n///      }\n///\n/// @example css\n///\n///      .test {\n///         width: 100%;\n///       }\n///\n///      @media only screen and (min-width: ${width}) {\n///         .test {\n///           width: auto;\n///         }\n///      }\n///\n/// @group media-queries \n@mixin screen-${key}{\n   @media only screen and (min-width: ${width}) {\n     @content\n   }\n};\n`;
        }


        return (result += `/// Mixin whose objective is to create the media-query based on the cut points established in the configuration file\n///\n///\n/// @example scss\n///\n///      .test{\n///         width: 100%;\n///         @include screen-custom($screen){\n///           width: auto;\n///         }\n///      }\n///\n/// @example css\n///\n///      .test {\n///         width: 100%;\n///       }\n///\n///      @media only screen and (min-width: $screen) {\n///         .test {\n///           width: auto;\n///         }\n///      }\n///\n/// @group media-queries \n@mixin screen-custom($screen){\n   @media only screen and (min-width: $screen) {\n     @content\n   }\n};\n`);

      } catch (err) {
        utils.messages.error(
          `✖ No grid utility configuration specified. The file will be created without content. Please check the configuration file ${file}.`
        );
        return `// To generate the mixin of mediaqueries, check the configuration file ${file}`;
      }
    }
  });

  StyleDictionary.buildAllPlatforms();
  utils.messages.print("Settings creation process finished");

};

const buildStyleDictionary = (file, path) => {
  const _tokens = route.resolve(process.cwd(), path, 'library/scss', 'settings');
  const isSettings = fs.existsSync(_tokens);
  utils.messages.print("Settings creation process started");


  utils.messages.warning(
    `\nBased on the information provided in the configuration file ${file} the following files are generated: \n`
  );

  if (isSettings) fs.rmSync(_tokens, { recursive: true });
  styleDictionary(file, path);
  buildCore(path);
}



module.exports = {
  styleDictionary,
  buildStyleDictionary
}

