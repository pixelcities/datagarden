const { addBeforeLoader, loaderByName, addPlugins, getPlugin, pluginByName } = require('@craco/craco');

const fs = require('fs');
const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity');
const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");

module.exports = {
  webpack: {
    configure: (webpackConfig, { paths }) => {
      webpackConfig.experiments = {
          asyncWebAssembly: false,
          lazyCompilation: false,
          syncWebAssembly: true,
          topLevelAwait: true,
      };

      webpackConfig.output.crossOriginLoading = "anonymous";

      addPlugins(webpackConfig, [
        new SubresourceIntegrityPlugin()
      ]);

      // Alter public/index.html template to align with scripts/sign.ts.
      //
      // We utilise the templating options of htmlWebpackPlugin to keep the source index.html constant
      // and only inject the signature as a template parameter. This works because the content hash is
      // computed beforehand, which means that the index.html file is not any different when computing
      // the content hashes for any of the chunks (and in turn integrity hashes) when adding a signature.
      const { match: htmlWebpackPlugin } = getPlugin(webpackConfig, pluginByName("HtmlWebpackPlugin"));

      // We drop the closing slash to align with "minimize" in scripts/sign.ts
      htmlWebpackPlugin.userOptions.minify.keepClosingSlash = false;
      htmlWebpackPlugin.userOptions.templateParameters = {
        signature: process.env.INJECT_PGP_SIGNATURE ? fs.readFileSync(`datagarden-v${process.env.npm_package_version}.asc`, "utf8") : ""
      };

      // https://github.com/rust-random/getrandom/issues/224
      addPlugins(webpackConfig, [
        new webpack.ContextReplacementPlugin(
          /^\.$/,
          (context) => {
            if (/.*datafusion-wasm.*/.test(context.context)) {
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
            { from: "node_modules/@pixelcities/arrow-wasm/arrow_wasm.wasm", to: "static/js/" }
          ]
        })
      ]);

      if (process.env.REACT_APP_SENTRY_URL && process.env.REACT_APP_SENTRY_AUTH_TOKEN) {
        webpackConfig.devtool = "source-map";

        addPlugins(webpackConfig, [
          sentryWebpackPlugin({
            org: "pixelcities",
            project: "datagarden",
            url: process.env.REACT_APP_SENTRY_URL,
            authToken: process.env.REACT_APP_SENTRY_AUTH_TOKEN,
            silent: true,
            telemetry: false,
            release: {
              name: `datagarden-${process.env.REACT_APP_VERSION}`,
              create: true,
              finalize: false,
              uploadLegacySourcemaps: {
                paths: ["build"],
                ignore: [
                  "craco.config.js",
                  "book",
                  "node_modules",
                ],
              }
            }
          })
        ]);
      }

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
