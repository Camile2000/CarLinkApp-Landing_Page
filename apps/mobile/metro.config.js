const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Monorepo : résoudre les modules depuis la racine aussi
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Workaround: setUpFuseboxReactDevToolsDispatcher tente de définir
// __FUSEBOX_REACT_DEVTOOLS_DISPATCHER__ sur global, mais Expo Go l'a déjà
// verrouillé (non-configurable). L'erreur "property is not writable" fait
// crasher ReactFabric avant même que le composant racine soit monté.
// On remplace ce fichier par un module vide pour éviter le conflit.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes('setUpFuseboxReactDevToolsDispatcher')) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'src/fusebox-polyfill.js'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
