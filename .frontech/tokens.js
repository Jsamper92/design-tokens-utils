const { transformTokens } = require('token-transformer');
const fs = require('fs');
const excludes = [];

const transformerOptions = {
    expandTypography: false,
    expandShadow: false,
    expandComposition: false,
    preserveRawValue: false,
    resolveReferences: false
};

/**
 * @description This function to replace reference tokens studio to css custom property
 * @param {string} value
 */
const setReferenceCustomProperty = (value) => {
    const _value = value
        .replace('$', '--')
        .split('.')
        .reduce((acc, current, index) => (acc += index === 0 ? current : `-${current}`), '');

    return `var(${_value})`;
}

const searchReferencesTokensStudio = (tokens) => {
    const tokensKeys = Object.keys(tokens);

    return tokensKeys.reduce((acc, current) => {
        const key = Object.keys(tokens[current]);

        return acc;
    }, {});
};


const tokensResolved = async (tokens) => {
    try {
        return new Promise(async (resolve) => {
            // const sets = searchReferencesTokensStudio(tokens);
            const resolved = transformTokens(tokens, Object.keys(tokens), excludes, transformerOptions);

            if (resolved) resolve(resolved);
        })
    } catch (error) {
        console.error(error)
    }
};

module.exports = { tokensResolved };