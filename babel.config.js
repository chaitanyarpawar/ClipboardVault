module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Removed nativewind plugin temporarily for web compatibility
    plugins: [],
  };
};