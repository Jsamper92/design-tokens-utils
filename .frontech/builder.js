const [utils, styleDictionary] = [
    require('./utils'),
    require("../.frontech/styledictionary"),

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
            await getIcons(icons.icons, theme, path)
                .then(async (response) => {
                    if (response !== 'no_icons') {
                        messages.print('process transformation icons to icon font started');
                        await generateIconFont(path, icons?.size)
                            .then((response) => {
                                if (response) {
                                    console.log(
                                        `\nIconic font creation based on the svg files in the path ${path}`
                                    );
                                    response.forEach(async ({ folder, file, data }) => {
                                        messages.success(`✔︎ ${folder}/${file}`);
                                        createFile(folder, file, data, true);
                                    });

                                    messages.print('process transformation icons to icon font finished');
                                    buildStyleDictionary(dictionary, path);
                                }
                            })
                            .catch((error) => {
                                console.error(error);
                            })
                    } else {
                        buildStyleDictionary(dictionary, path);
                    }
                })
        } else {
            console.log(dictionary, path);
            if (tokens) buildStyleDictionary(dictionary, path);
        }
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    createTokens
}