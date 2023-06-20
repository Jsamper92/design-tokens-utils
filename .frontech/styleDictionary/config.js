const [fs, route, utils] = [
    require("fs"),
    require("path"),
    require("../utils")
];
const { config } = utils;
const { path, platforms } = config();
const buildPath = route.resolve(process.cwd(), path);
const dictionary = platforms && fs.readFileSync(route.resolve(process.cwd(), platforms)).toString();
const configSTD = {
    options: {
        outputReferences: true,
    },
};

const scss = {
    scss: {
        transformGroup: "scss",
        buildPath: `${buildPath}/library/scss/`,
        files: [
            {
                destination: "settings/_color.scss",
                format: "custom/variables-colors",
                filter: {
                    type: "color"
                },
                ...configSTD
            },
            {
                destination: "settings/_typography.scss",
                format: "custom/variables",
                filter: ({ attributes, type }) => (['fontFamilies', 'fontWeights'].includes(type) || attributes.category === 'font'),
                ...configSTD
            },
            {
                destination: "base/_font-face.scss",
                format: "custom/font-face",
                filter: ({ type }) => ['lineHeights', 'fontWeights', 'fontSizes', 'fontFamilies'].includes(type),
                ...configSTD
            },
            {
                destination: "settings/_grid.scss",
                format: "custom/grid",
                filter: {
                    type: "sizing"
                },
                ...configSTD
            },
            {
                destination: "tools/_media-queries.scss",
                format: "custom/mediaqueries",
                filter: {
                    type: "sizing"
                },
                ...configSTD
            },
            {
                destination: "settings/_opacity.scss",
                format: "css/variables",
                filter: {
                    type: "opacity"
                },
                ...configSTD
            },
            {
                destination: "settings/_spacing.scss",
                format: "custom/spacing",
                filter: {
                    type: "spacing"
                },
                ...configSTD
            },
            {
                destination: "settings/_border.scss",
                format: "custom/variables",
                filter: ({ attributes }) => attributes.category.includes('border'),
                ...configSTD
            },
        ]
    }
};

const tokensConfig = dictionary ? { scss, ...(JSON.parse(dictionary)) } : scss;


module.exports = {
    tokensConfig
};