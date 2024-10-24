const [fs, route, utils] = [
  require("fs"),
  require("path"),
  require("../utils"),
];
const {
  setCreationTimeFile,
  dataFilesScss,
  managementDataFileScss,
  config,
  createFile,
} = utils;
const { theme } = config();

/**
 * This function is used to create dynamic import of partials of file settings.scss
 * @param {string} path
 * @returns {{origin: string, name: string, data: string, force: boolean}[]}
 */
const createSettingsPartials = (path, brand) => {
  const _root = route.resolve(
    process.cwd(),
    path,
    `library/scss/${brand}`,
    "settings"
  );
  const _nameSettingsPartials = fs
    .readdirSync(_root)
    .filter((file) => file.includes("_"))
    .sort(compareMode);
  const _settingsPartials = [..._nameSettingsPartials].map((file) => {
    const origin = route.resolve(_root);
    const data = `${setCreationTimeFile()}${fs
      .readFileSync(route.resolve(origin, file))
      .toString()}`;
    return {
      origin,
      name: file,
      data,
    };
  });
  const _settingsPartialsRequired = [
    {
      origin: route.resolve(_root),
      name: brand === "core" ? "settings.scss" : `settings-${brand}.scss`,
      data: `${setCreationTimeFile()}${[..._nameSettingsPartials]
        .map((file) => file.replace("_", "").replace(".scss", ""))
        .reduce((acc, current) => (acc += `@forward '${current}';\n`), "")}`,
      force: true,
    },
  ];

  return [..._settingsPartials, ..._settingsPartialsRequired];
};

const compareMode = (a, b) => {
  const containsMode = (elemento) => elemento.includes("_mode-");

  if (containsMode(a) && !containsMode(b)) return 1;
  if (!containsMode(a) && containsMode(b)) return -1;
  if (containsMode(a) && containsMode(b)) {
    return a === "_mode-dark.scss" ? 1 : b === "_mode-dark.scss" ? -1 : 0;
  }

  return 0;
};

/**
 * This function is used to create dynamic import of partials of file base.scss
 * @param {string} path
 * @returns {{origin: string, name: string, data: string, force: boolean}[]}
 */
const createBasePartials = (path) => {
  const _root = route.resolve(process.cwd(), path, "library/scss/core", "base");
  const _nameBasePartials = fs
    .readdirSync(_root)
    .filter((file) => file.includes("_"));
  const _basePartials = [..._nameBasePartials].map((file) => {
    const origin = route.resolve(_root);
    const data = `${setCreationTimeFile()}${fs
      .readFileSync(route.resolve(origin, file))
      .toString()}`;
    return {
      origin,
      name: file,
      data,
    };
  });

  const _basePartialsRequired = [
    {
      origin: route.resolve(_root),
      name: "base.scss",
      data: `@forward 'reset';\n@forward 'font-face';\n${[..._nameBasePartials]
        .filter((file) => !file.includes("_reset.scss") || !file.includes("_font-face.scss"))
        .map((file) => file.replace("_", "").replace(".scss", ""))
        .reduce((acc, current) => (acc += `@forward '${current}';\n`), "")}`,
      force: false,
    },
  ];

  return [..._basePartials, ..._basePartialsRequired];
};

/**
 * This function agroup all partials of settings and base
 * @param {string} path
 * @returns {{origin: string, name: string, data: string, force: boolean}[]}
 */
const createImportDynamicPartials = (path, brand) => {
  const settings = createSettingsPartials(path, brand);
  const base = !theme ? createBasePartials(path) : [];

  return [...settings, ...base];
};

/**
 * This function is used to create architecture scss
 * @param {string} path
 * @param {string[]} brands
 */
const buildCore = (path, brands) => {
  const root = route.dirname(__dirname).replace(".frontech", "");
  if (!theme) {
    createCoreFiles(root, path);
    createCustomFiles(root, path, brands);
  } else {
    createThemeFiles(root, path, theme);
  }
};

const createCoreFiles = (root, path) => {
  const paths = [
    iconsTemplate(root),
    settingsGeneralTemplate(root, "core"),
    {
      root,
      force: false,
      name: `_grid.scss`,
      path: route.resolve(root, `library/scss/core/utilities/`),
    },
    {
      root,
      force: false,
      name: `_global.scss`,
      path: route.resolve(root, `library/scss/core/utilities/`),
    },
    {
      root,
      force: false,
      name: `_layout.scss`,
      path: route.resolve(root, `library/scss/core/utilities/`),
    },
    {
      root,
      force: false,
      name: `utilities.scss`,
      path: route.resolve(root, `library/scss/core/utilities/`),
    },
    {
      root,
      force: false,
      name: `_reset.scss`,
      path: route.resolve(root, `library/scss/core/base/`),
    },
    {
      root,
      force: false,
      name: `_font-face.scss`,
      path: route.resolve(root, `library/scss/core/base/`),
    },
    {
      root,
      force: false,
      name: `_functions.scss`,
      path: route.resolve(root, `library/scss/core/tools/`),
    },
    {
      root,
      force: false,
      name: `tools.scss`,
      path: route.resolve(root, `library/scss/core/tools/`),
    },
    {
      root,
      force: false,
      name: `_rem.scss`,
      path: route.resolve(root, `library/scss/core/tools/`),
    },
    {
      root,
      force: false,
      name: `_elements.scss`,
      path: route.resolve(root, `library/scss/core/elements/`),
    },
    {
      data: `${dataFilesScss(config()).defaultVariables}${dataFilesScss(config()).settingsGeneral
        }\n`,
      root,
      force: false,
      name: `abstracts.scss`,
      path: route.resolve(root, `library/scss/core/`),
    },
  ];

  const files = getFiles(paths, "core", path);
  createFiles(files, []);
  const partials = createImportDynamicPartials(path, "core");
  createFiles([], partials);
};

const createCustomFiles = (root, path, brands) => {
  brands
    .filter((f) => f !== "core")
    .forEach((brand) => {
      const paths = [
        iconsTemplate(root, "custom"),
        settingsGeneralTemplate(root, brand, "custom"),
        {
          data: `${dataFilesScss(config()).defaultVariables}${dataFilesScss(config(), brand).settingsGeneralByBrand
            }\n`,
          root,
          force: false,
          name: `abstracts.scss`,
          path: route.resolve(root, `library/scss/custom/`),
        },
      ];
      const files = getFiles(paths, brand, path);
      const partials = createImportDynamicPartials(path, brand);
      createFiles(files, partials);
    });
};

const createThemeFiles = (root, path, theme) => {
  const paths = [
    iconsTemplate(root, "custom"),
    settingsGeneralTemplate(root, theme, "custom"),
    {
      data: `${dataFilesScss(config()).defaultVariables}${dataFilesScss(config(), theme).settingsGeneralByTheme
        }\n`,
      root,
      force: false,
      name: `abstracts.scss`,
      path: route.resolve(root, `library/scss/custom/`),
    },
  ];
  const files = getFiles(paths, theme, path);
  const partials = createImportDynamicPartials(path, theme);
  createFiles(files, partials);
};

const iconsTemplate = (root, folder = "core") => ({
  root,
  force: false,
  name: `_icons.scss`,
  path: route.resolve(root, `library/scss/${folder}/icons/`),
});

const settingsGeneralTemplate = (root, brand, folder = "core") => ({
  data: theme
    ? dataFilesScss(config()).themeVariables
    : brand === "core"
      ? dataFilesScss(config()).defaultVariables
      : dataFilesScss(config()).customVariables,
  root,
  force: false,
  name: `_variables.scss`,
  path: route.resolve(root, `library/scss/${folder}/`),
});

const getFiles = (paths, brand, path) => {
  return paths.map((file) => {
    const { name, force } = file;
    const origin = route.resolve(
      route.resolve(process.cwd(), path),
      file.path.replace(file.root, "").replace("custom", brand)
    );
    const data = managementDataFileScss(file);
    return {
      name,
      data,
      force,
      origin,
    };
  });
};

const createFiles = (files, partials) => {
  Promise.all(
    [...files, ...partials].map(({ origin, name, data, force }) =>
      createFile(origin, name, data, force)
    )
  );
};

module.exports = {
  buildCore,
  createImportDynamicPartials,
};
