
/**
 * This function is used to overwrite transform size/px styledictionary to omit error console 
 * when the value is a reference token studio so it is not a number.
 * @param {string} token 
 * @returns {string}
 */
const sizePx = (token) => {
    const val = parseFloat(token.value);

    return val + 'px';
}


module.exports = {
    sizePx
}