
const [fs, route, utils] = [
    require("fs"),
    require("path"),
    require("../utils")
];
const { setCreationTimeFile, dataFilesScss, managementDataFileScss, config, createFile } = utils;

/**
 * This function is used to create dynamic import of partials of file settings.scss
 * @param {string} path 
 * @returns {{origin: string, name: string, data: string, force: boolean}[]}
 */
const createSettingsPartials = (path) => {
    const _root = route.resolve(process.cwd(), path, 'library/scss', 'settings');
    const _nameSettingsPartials = fs.readdirSync(_root)
        .filter(file => file.includes('_'));
    const _settingsPartials = [..._nameSettingsPartials]
        .map(file => {
            const origin = route.resolve(_root)
            const data = `${setCreationTimeFile()}${fs
                .readFileSync(route.resolve(origin, file))
                .toString()}`;
            return {
                origin,
                name: file,
                data
            }
        });
    const _settingsPartialsRequired = [
        {
            origin: route.resolve(_root),
            name: 'settings.scss',
            data: `${setCreationTimeFile()}${[..._nameSettingsPartials]
                .map(file => file.replace('_', '').replace('.scss', ''))
                .reduce((acc, current) => (acc += `@forward '${current}';\n`), '')}`,
            force: true
        },
    ]

    return [..._settingsPartials, ..._settingsPartialsRequired];
}
/**
 * This function is used to create dynamic import of partials of file base.scss
 * @param {string} path 
 * @returns {{origin: string, name: string, data: string, force: boolean}[]}
 */
const createBasePartials = (path) => {
    const _root = route.resolve(process.cwd(), path, 'library/scss', 'base');
    const _nameBasePartials = fs.readdirSync(_root)
        .filter(file => file.includes('_'));
    const _basePartials = [..._nameBasePartials]
        .map(file => {
            const origin = route.resolve(_root)
            const data = `${setCreationTimeFile()}${fs
                .readFileSync(route.resolve(origin, file))
                .toString()}`;
            return {
                origin,
                name: file,
                data
            }
        });

    const _basePartialsRequired = [
        {
            origin: route.resolve(_root),
            name: 'base.scss',
            data: `@forward 'reset';\n${[..._nameBasePartials]
                .filter(file => !file.includes('_reset.scss'))
                .map(file => file.replace('_', '').replace('.scss', ''))
                .reduce((acc, current) => (acc += `@forward '${current}';\n`), '')}`,
            force: false
        }
    ]

    return [..._basePartials, ..._basePartialsRequired];
}
/**
 * This function agroup all partials of settings and base
 * @param {string} path 
 * @param {string} file 
 * @returns {{origin: string, name: string, data: string, force: boolean}[]}
 */
const createImportDynamicPartials = (path, file) => {
    const settings = createSettingsPartials(path, file);
    const base = createBasePartials(path);

    return [...settings, ...base];
};
/**
 * This function is used to create architecture scss
 * @param {string} path 
 */
const buildCore = (path) => {

    const root = __dirname.replace('.frontech/scss', '');

    const paths = [
        {
            root,
            force: false,
            name: `_icons.scss`,
            path: route.resolve(root, `library/scss/utilities/`),
        },
        {
            root,
            force: false,
            name: `_grid.scss`,
            path: route.resolve(root, `library/scss/utilities/`),
        },
        {
            root,
            force: false,
            name: `utilities.scss`,
            path: route.resolve(root, `library/scss/utilities/`),
        },
        {
            root,
            force: false,
            name: `_functions.scss`,
            path: route.resolve(root, `library/scss/tools/`),
        },
        {
            root,
            force: false,
            name: `_reset.scss`,
            path: route.resolve(root, `library/scss/base/`),
        },
        {
            root,
            force: false,
            name: `tools.scss`,
            path: route.resolve(root, `library/scss/tools/`),
        },
        {
            root,
            force: false,
            name: `_rem.scss`,
            path: route.resolve(root, `library/scss/tools/`),
        },
        {
            data: dataFilesScss(config()).defaultVariables,
            root,
            force: false,
            name: `_general.scss`,
            path: route.resolve(root, `library/scss/settings/`),
        },
        {
            data: dataFilesScss(config()).settingsGeneral,
            root,
            force: true,
            name: `abstracts.scss`,
            path: route.resolve(root, `library/scss/`),
        }
    ];

    const files = paths.map((file) => {
        const { name, force } = file;
        const origin = route.resolve(route.resolve(process.cwd(), path), file.path.replace(file.root, ''))
        const data = managementDataFileScss(file);
        return {
            name,
            data,
            force,
            origin,
        }
    });
    const partials = createImportDynamicPartials(path);

    Promise.all([...files, ...partials]
        .map(({ origin, name, data, force }) => createFile(origin, name, data, force)));

};

module.exports = {
    buildCore,
    createImportDynamicPartials
}