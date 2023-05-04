const { createTokens } = require("../.frontech/builder");
const { config } = require("../.frontech/utils");

const [fs, route, utils] = [
    require("fs"),
    require("path"),
    require("../.frontech/utils"),
    require("../.frontech/styledictionary"),
];

const { messages } = utils;

/**
 * @description This function is used to create architectura tokens
 * @param {{file: String; theme: String; path: String; tokens: String, disableIconsFigma: Boolean; disableIconFont: Boolean; disableIconSprites: Boolean}} args 
 */
const designSystemsUtils = (args) => {
    try {
        const { platforms, theme, path, tokens, disableIconFont, disableIconSprites, disableIconsFigma } = config(args);
        const existData = tokens && fs.existsSync(route.resolve(process.cwd(), tokens));

        if (existData) {
            let data = JSON.parse(
                fs.readFileSync(route.resolve(process.cwd(), tokens)).toString()
            );


            if (theme) {
                data = data[theme] || {};
                createTokens(data, platforms, path, theme, disableIconFont, disableIconSprites, disableIconsFigma);
            } else {
                const isThemeTokensStudio = '$metadata' in data;
                if (isThemeTokensStudio) {
                    const themesTokensStudio = data['$metadata']['tokenSetOrder'];

                    const dataTokensStudio = themesTokensStudio
                        .map((alias) => ({ tokens: data[alias], alias }))
                        .reduce((acc, cur) => {
                            const { alias, tokens } = cur;

                            if (!acc[alias]) acc[alias] = {};
                            acc[alias] = tokens;

                            return acc
                        }, {});

                    createTokens(dataTokensStudio, platforms, path, themesTokensStudio, disableIconFont, disableIconSprites, disableIconsFigma);
                }
            }
        } else {
            messages.error(`No configuration tokens file specified`);
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    designSystemsUtils
}



