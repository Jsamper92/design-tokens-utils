const [fs, utils, styleDictionary, route] = [
    require('fs-extra'),
    require('./utils'),
    require("../.frontech/styledictionary"),
    require('path')
];

const { messages, handleCreateAsset, generateIconFont, getIcons, buildTokens, getKeyIcons } = utils;
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

        if (icons) {
            const _icons = await getIcons(icons.icons, theme, path);
            if (_icons) {
                const _iconFont = await buildIconFont(path, disableIconFont, disableIconSprites);
                if (tokens && _iconFont) buildStyleDictionary(dictionary, path);
            }
        } else {
            const _iconFont = await buildIconFont(path, disableIconFont, disableIconSprites);
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
        if (!disableIconFont) messages.print('process transformation icons to icon font started');

        if (!(disableIconFont && disableIconSprites)) {
            await generateIconFont(path, disableIconFont, disableIconSprites)
                .then(async (response) => {
                    if (disableIconFont) console.log('\n');
                    const iconFont = response.filter(({ file }) => !new RegExp(/symbol.svg/).test(file));
                    const _iconFont = await Promise.all(iconFont.map(handleCreateAsset))

                    if (_iconFont && !disableIconFont) {
                        messages.print('process transformation icons to icon font finished');
                    }

                    if (!disableIconSprites) messages.print('process transformation icons to icon sprite started');

                    const iconSprite = response.filter(({ file }) => new RegExp(/symbol.svg/).test(file));
                    const _iconSprite = await Promise.all(iconSprite.map(handleCreateAsset));

                    if (_iconSprite && !disableIconSprites) {
                        messages.print('process transformation icons to icon sprite finished');
                    }

                    resolve(true);
                })
                .catch((error) => {
                    console.error(error);
                    resolve(true);
                })
        } else {
            resolve(true);
        }

    })
}

module.exports = {
    createTokens
}