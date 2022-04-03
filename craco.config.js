const { addBeforeLoader, loaderByName, addPlugins } = require('@craco/craco');

const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  webpack: {
    configure: (webpackConfig, { paths }) => {
      webpackConfig.experiments = {
          asyncWebAssembly: false,
          lazyCompilation: false,
          syncWebAssembly: true,
          topLevelAwait: true,
      };

      // https://github.com/rust-random/getrandom/issues/224
      addPlugins(webpackConfig, [
        new webpack.ContextReplacementPlugin(
          /^\.$/,
          (context) => {
            if (/datafusion-wasm\/pkg.*/.test(context.context)) {
              context.regExp = /(?!x)x/
              for (const d of context.dependencies) {
                if (d.critical) d.critical = false;
              }
            }
          }
        )
      ]);

      addPlugins(webpackConfig, [
        new CopyPlugin({
          patterns: [
            { from: "node_modules/arrow-wasm/arrow_wasm.wasm", to: "static/js/" }
          ]
        })
      ]);

      const wasmExtensionRegExp = /\.wasm$/;
      webpackConfig.resolve.extensions.push('.wasm');

      webpackConfig.resolve.fallback = {
          buffer: require.resolve('buffer/')
      }

      webpackConfig.module.rules.forEach((rule) => {
        (rule.oneOf || []).forEach((oneOf) => {
          if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
            oneOf.exclude.push(wasmExtensionRegExp);
          }
          if (oneOf.type === "asset/resource") {
              oneOf.exclude.push(wasmExtensionRegExp);
          }
        });
      });

      webpackConfig.plugins.push(new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
      }));

      return webpackConfig;
    },
  }
}
