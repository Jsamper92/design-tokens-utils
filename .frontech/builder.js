const [fs, utils, styleDictionary, route] = [
    require('fs-extra'),
    require('./utils'),
    require("../.frontech/styledictionary"),
    require('path')
];

const { messages } = utils;
const { generateIconFont, generateSvgSprites, getIcons, buildTokens, getKeyIcons } = utils;
const { buildStyleDictionary } = styleDictionary;

/**
 * @description This function is used to create tokens by refs to configuration file
 * @param {Object} data 
 * @param {String} dictionary 
 * @param {String} path 
 * @param {String} theme 
 * @param {disableIconFont} boolean
 */
const createTokens = async (data, path, theme, disableIconFont, disableIconSprites, disableIconsFigma) => {
    try {
        const tokens = await buildTokens(data);
        const icons = getKeyIcons(data, tokens, theme);

        if (icons && !disableIconsFigma) {
            const _icons = await getIcons(icons.icons, theme, path);
            if (_icons) {
                const _iconFont = await buildIconFont(path, disableIconFont, disableIconSprites);
                if (tokens && _iconFont) buildStyleDictionary(path);
            }
        } else {
            const _iconFont = await buildIconFont(path, disableIconFont, disableIconSprites);
            if (tokens && _iconFont) buildStyleDictionary(path);
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
        const pathIcons = route.resolve(path, 'images', 'icons');
        const isIcons = fs.existsSync(pathIcons);
        const icons = isIcons && fs.readdirSync(pathIcons)
            .map(icon => ({ name: icon.replace('.svg', ''), data: fs.readFileSync(route.resolve(pathIcons, icon), 'utf8') }));

        if (isIcons) {
            if (!disableIconFont) {
                const iconFont = await generateIconFont(path, disableIconFont, disableIconSprites);
                if (iconFont) {
                    if (!disableIconSprites) {
                        const iconSprites = await generateSvgSprites(icons, path);
                        if (iconSprites) resolve(true);
                    } else {
                        resolve(true);
                    }
                }
            } else {
                if (!disableIconSprites) {
                    const iconSprites = await generateSvgSprites(icons, path);
                    if (iconSprites) resolve(true);
                } else {
                    resolve(true);
                }
            }
        } else {
            messages.print('process transformation icons to icon font started');
            messages.warning(`There are no icons on the route ${pathIcons}`);
            messages.print('process transformation icons to icon font finished');
            resolve(true);
        }
    })
}

module.exports = {
    createTokens
}