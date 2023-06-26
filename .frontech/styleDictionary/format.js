const { dataFilesScss } = require("../utils");

const [fs, route, utils] = [
    require("fs"),
    require("path"),
    require("../utils")
];
const { createCustomProperties, setCreationTimeFile, RGBAToHex, translateReferenceToCustomProperty, config } = utils;

/**
 * This function is used to translate tokens in create custom properties css
 * @param {{dictionary: {allTokens: {[key:string]: string}}}} param0 
 * @returns {string}
 */
const customVariablesCommon = ({ dictionary: { allTokens } }) => {

    const _tokens = createCustomProperties(allTokens);

    return `${setCreationTimeFile()}:root{\n${_tokens}}`
}

/**
 * This function is used to translate tokens in create custom properties css. If exist alpha color, this function translate to rgba
 * @param {{dictionary: {allTokens: {[key:string]: string}}}} param0 
 * @returns {string}
 */
const customVariablesColors = ({ dictionary: { allTokens, usesReference } }) => {

    const _tokens = allTokens.reduce((tokens, prop) => {
        const { name, original } = prop;
        const isColorAlpha = original.value.split(' ');

        const getValueToken = () => {
            if (isColorAlpha.length === 2) {
                const [main, alpha] = isColorAlpha;
                const _main = translateReferenceToCustomProperty(main);
                const _alpha = translateReferenceToCustomProperty(alpha);
                if (/^[$]/.test(main)) {
                    return `rgba(${_main},${_alpha})`
                } else {
                    return `rgba(${RGBAToHex(_main)},${_alpha})`
                }

            }

            return usesReference(original, /^[$]/)
                ? translateReferenceToCustomProperty(original.value)
                : original.value;
        }

        return tokens += `--${name}: ${getValueToken()};\n`;
    }, '');

    return `${setCreationTimeFile()}:root{\n${_tokens}}`
}
/**
 * This function is used to translate tokens in create custom properties css. If exist inset, this function translate to calc
 * @param {{dictionary: {allTokens: {[key:string]: string}}}} param0 
 * @returns {string}
 */
const customVariablesSpacing = ({ dictionary: { allTokens } }) => {

    const _tokens = createCustomProperties(allTokens);
    const _spacing = _tokens.split(';')
        .map(token => {
            if (token.includes('inset')) {
                const value = token.split(':')[1];
                const _calc = value.split(' ').map((item) => !item.includes('auto') ? `calc(${item} - 1px)` : item).join(' ');
                return `${token.split(':')[0]}:${_calc}`
            }

            return token
        }).join(';');

    return `${setCreationTimeFile()}:root{\n${_spacing}}`
}
/**
 * This function is used to translate tokens typography in font-face.
 * @returns {string}
 */
const customFontFace = ({ dictionary: { allTokens } }) => {
    const { path } = config();
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


    const isExistFontLocal = _families
        .map((family) => {
            return Object.entries(_weights).reduce((acc, [key, value]) => {
                const name = `${family}-${key}`;
                const pathFolder = route.resolve(process.cwd(), path, 'fonts', family);
                const isFolder = fs.existsSync(pathFolder);
                const files = isFolder && fs.readdirSync(pathFolder)
                const isFile = files.length && files.some((file) => file.replace(/\.[^/.]+$/, "").toLocaleLowerCase() === name.toLocaleLowerCase());
                const file = files.length && files
                    .map((file) => file.replace(/\.[^/.]+$/, "").toLocaleLowerCase() === name.toLocaleLowerCase() ? file : null)
                    .filter(Boolean);

                return Boolean(isFile) ? ({ ...acc, [file]: value }) : acc

            }, {})
        })
        .filter(Boolean)

    const isNotExistFontlocal = _families.filter((family) => {
        const pathFont = route.resolve(process.cwd(), path, 'fonts', family);
        const folderExist = fs.existsSync(pathFont);
        const folderEmpty = folderExist && fs.readdirSync(pathFont).length;

        return !folderExist || !folderEmpty;
    });

    const _tokens = isExistFontLocal.reduce((fontFace, prop, index) => {
        fontFace += Object.entries(prop)
            .reduce((acc, [key, value]) => {
                const name = key.split(',');
                const _name = name[0].replace(/\.[^/.]+$/, "").toLocaleLowerCase();
                const extensions = name
                    .reduce((acc, value) => {
                        const _extension = new RegExp(/\.[^/.]+$/).exec(value)[0];
                        return acc += `url('#{general.$font-path}/${_families[index]}/${value}') format('${_formats[_extension]}'),\n`;
                    }, '');

                return acc += `\n\n@font-face {\nfont-family: '${_name}';\nfont-weight: ${value};\nsrc: ${extensions}}\n`;
            }, '');

        return fontFace
    }, '');
    const _paths = isNotExistFontlocal.reduce((acc, value, index) => (acc += `${path}/fonts/${value}${isNotExistFontlocal.length > 1 && index !== isNotExistFontlocal.length - 1 ? ', ' : ''}`), '');
    const content = `@use '../settings/general';\n${dataFilesScss({ file: _paths }).fonts}\n${_tokens}`
    return `${setCreationTimeFile()}${content}`
}
/**
 * This function is used to translate tokens grid in grid classes.
 * @returns {string}
 */
const customGrid = (dictionary) => {

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
/**
 * This function is used to translate tokens grid in mixins sass mediaqueries.
 * @returns {string}
 */
const customMediaQueries = (dictionary) => {
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

module.exports = {
    customGrid,
    customFontFace,
    customMediaQueries,
    customVariablesCommon,
    customVariablesColors,
    customVariablesSpacing,
}