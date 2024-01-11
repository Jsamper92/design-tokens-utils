const [fs, route, utils] = [
  require("fs"),
  require("path"),
  require("../utils"),
];
const { config } = utils;
const { path, platforms } = config();
const buildPath = route.resolve(process.cwd(), path);
const dictionary =
  platforms &&
  fs.readFileSync(route.resolve(process.cwd(), platforms)).toString();
const configSTD = {
  options: {
    outputReferences: true,
  },
};

const coreScss = {
  scss: {
    transformGroup: "scss",
    buildPath: `${buildPath}/library/scss/core/`,
    files: [
      {
        destination: "settings/_color.scss",
        format: "custom/variables-colors",
        filter: {
          type: "color",
        },
        ...configSTD,
      },
      {
        destination: "settings/_typography.scss",
        format: "custom/variables",
        filter: ({ attributes, type }) =>
          ["fontFamilies", "fontWeights"].includes(type) ||
          attributes.category === "font",
        ...configSTD,
      },
      {
        destination: "base/_font-face.scss",
        format: "custom/font-face",
        filter: ({ type }) =>
          ["lineHeights", "fontWeights", "fontSizes", "fontFamilies"].includes(
            type
          ),
        ...configSTD,
      },
      {
        destination: "utilities/_grid.scss",
        format: "custom/grid",
        filter: {
          type: "sizing",
        },
        ...configSTD,
      },
      {
        destination: "tools/_functions.scss",
        format: "custom/mediaqueries",
        filter: {
          type: "sizing",
        },
        ...configSTD,
      },
      {
        destination: "settings/_opacity.scss",
        format: "css/variables",
        filter: {
          type: "opacity",
        },
        ...configSTD,
      },
      {
        destination: "settings/_spacing.scss",
        format: "custom/spacing",
        filter: {
          type: "spacing",
        },
        ...configSTD,
      },
      {
        destination: "settings/_border.scss",
        format: "custom/variables",
        filter: ({ attributes }) => attributes.category.includes("border"),
        ...configSTD,
      },
    ],
  },
};

const customScss = (brand) => ({
  scss: {
    transformGroup: "scss",
    buildPath: `${buildPath}/library/scss/${brand}/`,
    files: [
      {
        destination: "settings/_color.scss",
        format: "custom/variables-colors",
        filter: {
          type: "color",
        },
        ...configSTD,
      },
      {
        destination: "settings/_typography.scss",
        format: "custom/variables",
        filter: ({ attributes, type }) =>
          ["fontFamilies", "fontWeights"].includes(type) ||
          attributes.category === "font",
        ...configSTD,
      },
      {
        destination: "settings/_opacity.scss",
        format: "css/variables",
        filter: {
          type: "opacity",
        },
        ...configSTD,
      },
      {
        destination: "settings/_spacing.scss",
        format: "custom/spacing",
        filter: {
          type: "spacing",
        },
        ...configSTD,
      },
      {
        destination: "settings/_border.scss",
        format: "custom/variables",
        filter: ({ attributes }) => attributes.category.includes("border"),
        ...configSTD,
      },
    ],
  },
});

const customModeScss = (brand, mode) => ({
  scss: {
    transformGroup: "scss",
    buildPath: `${buildPath}/library/scss/${brand}/`,
    files: [
      {
        destination: `settings/_mode-${mode}.scss`,
        format: `custom/mode-${mode}`,
        filter: ({ filePath }) =>
          filePath.endsWith(`/${brand}-${mode}-tokens-parsed.json`),
        ...configSTD,
      },
    ],
  },
});

const coreTokensConfig = dictionary
  ? { coreScss, ...JSON.parse(dictionary) }
  : coreScss;
const customTokensConfig = dictionary
  ? { customScss, ...JSON.parse(dictionary) }
  : customScss;
const modeTokensConfig = dictionary
  ? { customModeScss, ...JSON.parse(dictionary) }
  : customModeScss;

module.exports = {
  coreTokensConfig,
  customTokensConfig,
  modeTokensConfig,
};
