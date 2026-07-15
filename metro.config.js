const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js usa import() dinâmico no build ESM, que o Hermes
// não suporta em release; força o Metro a resolver o build CommonJS.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@supabase/supabase-js') {
    return {
      filePath: require.resolve('@supabase/supabase-js/dist/index.cjs'),
      type: 'sourceFile',
    };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
