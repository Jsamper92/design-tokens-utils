const [fs, utils, styleDictionary, route] = [
    require('fs-extra'),
    require('./utils'),
    require("../.frontech/styledictionary"),
    require('path')
];

const { messages, createFile, generateIconFont, getIcons, buildTokens, getKeyIcons } = utils;
const { buildStyleDictionary } = styleDictionary;

/**
 * @description This function is used to create tokens by refs to configuration file
 * @param {Object} data 
 * @param {String} dictionary 
 * @param {String} path 
 * @param {String} theme 
 * @param {disableIconFont} boolean
 */
const createTokens = async (data, dictionary, path, theme, disableIconFont, disableIconSprites) => {
    try {
        const tokens = await buildTokens(data);
        const icons = getKeyIcons(data, tokens, theme);
        const _disableIconFont = disableIconFont === 'true';
        const _disableIconSprites = disableIconSprites === 'true';

        if (icons) {
            const _icons = await getIcons(icons.icons, theme, path);
            if (_icons) {
                const _iconFont = await buildIconFont(path, _disableIconFont, _disableIconSprites);
                if (tokens && _iconFont) buildStyleDictionary(dictionary, path);
            }
        } else {
            const _iconFont = await buildIconFont(path, _disableIconFont, _disableIconSprites);
            if (tokens && _iconFont) buildStyleDictionary(dictionary, path);
        }
    } catch (error) {
        console.error(error)
    }
}

/**
 * @description This function is used to build icon font
 * @param {String} path 
 */
const buildIconFont = async (path, disableIconFont, disableIconSprites) => {
    return new Promise(async (resolve) => {
        messages.print('process transformation icons to icon font started');
        await generateIconFont(path, disableIconFont, disableIconSprites)
            .then((response) => {
                response.forEach(async ({ input, output, file, copy, data }) => {
                    if (!copy) {
                        const oldPath = route.resolve(input, file);
                        const _file = fs.readFileSync(oldPath, 'utf8').toString();
                        const _data = data ? `${data}\n${_file}` : _file;
                        createFile(output, file, _data, true);
                    }
                });
                resolve(true);
            })
            .catch((error) => {
                console.error(error);
                resolve(true);
            })
    })
}

module.exports = {
    createTokens
}