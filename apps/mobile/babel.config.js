module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // expo-router is installed in apps/mobile/node_modules (not hoisted to monorepo root),
    // so babel-preset-expo's hasModule('expo-router') check returns false and the
    // expoRouterBabelPlugin is never added. We add it explicitly here so that
    // process.env.EXPO_ROUTER_APP_ROOT is inlined as a static string before Metro's
    // require.context validation runs.
    plugins: [
      require('babel-preset-expo/build/expo-router-plugin').expoRouterBabelPlugin,
    ],
  };
};
