const { transformTokens } = require("token-transformer");

const transformerOptions = {
  expandTypography: false,
  expandShadow: false,
  expandComposition: false,
  preserveRawValue: false,
  resolveReferences: false,
  throwErrorWhenNotResolved: false
};

const tokensResolved = async (tokens) => {
  try {
    return new Promise(async (resolve) => {
      const resolved = transformTokens(
        tokens,
        Object.keys(tokens),
        [],
        transformerOptions
      );

      if (resolved) resolve(resolved);
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = { tokensResolved };
