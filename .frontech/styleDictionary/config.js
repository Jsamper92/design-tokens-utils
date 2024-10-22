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

const matchSourceToken = (brand, mode, filePath) => filePath.includes(brand) && filePath.includes(mode);

const settings = (brand, mode) => ([
  {
    destination: "settings/_color.scss",
    format: "custom/variables-colors",
    filter: ({ type, filePath }) => {
      return matchSourceToken(brand, mode, filePath) && type === "color";
    },
    ...configSTD,
  },
  {
    destination: "settings/_typography.scss",
    format: "custom/variables",
    filter: ({ attributes, type, filePath }) =>
      matchSourceToken(brand, mode, filePath) &&
      ["fontFamilies", "fontWeights"].includes(type) ||
      attributes.category === "font",
    ...configSTD,
  },
  {
    destination: "settings/_opacity.scss",
    format: "css/variables",
    filter: ({ type, filePath }) => {
      return matchSourceToken(brand, mode, filePath) && type === "opacity";
    },
    ...configSTD,
  },
  {
    destination: "settings/_spacing.scss",
    format: "custom/spacing",
    filter: ({ type, filePath }) => {
      return matchSourceToken(brand, mode, filePath) && type === "spacing";
    },
    ...configSTD,
  },
  {
    destination: "settings/_border.scss",
    format: "custom/variables",
    filter: ({ attributes, filePath }) => {
      return matchSourceToken(brand, mode, filePath) && attributes.category.includes("border");
    },
    ...configSTD,
  },
  {
    destination: "settings/_shadow.scss",
    format: "custom/boxShadow",
    filter: ({ type, filePath }) => {
      return matchSourceToken(brand, mode, filePath) && type === "boxShadow";
    },
    ...configSTD,
  }
]);

const coreScss = (brand, mode) => ({
  scss: {
    transformGroup: "scss",
    buildPath: `${buildPath}/library/scss/core/`,
    files: [
      ...settings(brand, mode),
      {
        destination: "utilities/_grid.scss",
        format: "custom/grid",
        filter: ({ type, filePath }) => {
          return matchSourceToken(brand, mode, filePath) && type === "grid";
        },
        ...configSTD,
      },
      /*       {
              destination: "tools/_functions.scss",
              format: "custom/mediaqueries",
              filter: {
                type: "sizing",
              },
              ...configSTD,
            }, */
    ],
  },
});

const customScss = (brand, mode) => ({
  scss: {
    transformGroup: "scss",
    buildPath: `${buildPath}/library/scss/${brand}/`,
    files: settings(brand, mode),
  },
});

const customModeScss = (brand, mode, isTheme = false) => ({
  scss: {
    transformGroup: "scss",
    buildPath: `${buildPath}/library/scss/${brand}/`,
    files: [
      {
        destination: `settings/_mode-${mode}.scss`,
        format: `custom/mode-${mode}`,
        filter: ({ filePath }) => {
          return matchSourceToken(brand, mode, filePath) && filePath.endsWith(
            `/${isTheme ? "core" : brand}-${mode}-tokens-parsed.json`
          )
        },
        ...configSTD,
      }
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
