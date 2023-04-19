const [utils, styleDictionary, route] = [
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
 */
const createTokens = async (data, dictionary, path, theme) => {
    try {
        const tokens = await buildTokens(data);
        const icons = getKeyIcons(data, tokens, theme);
        if (icons) {
            const _icons = await getIcons(icons.icons, theme, path);
            if (_icons) {
                const _iconFont = await buildIconFont(path);
                if (_iconFont) buildStyleDictionary(dictionary, path);
            }
        } else {
            const _iconFont = await buildIconFont(path);
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
const buildIconFont = async (path) => {
    return new Promise(async (resolve) => {
        messages.print('process transformation icons to icon font started');
        await generateIconFont(path)
            .then((response) => {
                if (response) {
                    console.log(
                        `\nIconic font creation based on the svg files in the path ${route.resolve(path, 'fonts', 'icomoon')}`
                    );
                    response.forEach(async ({ folder, file, data }) => {
                        messages.success(`✔︎ ${folder}/${file}`);
                        createFile(folder, file, data, true);
                    });

                    messages.print('process transformation icons to icon font finished');
                    resolve(true);
                }
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