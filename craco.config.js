const { addBeforeLoader, loaderByName, addPlugins, getPlugin, pluginByName } = require('@craco/craco');

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity');
const { getDebugIdSnippet, sentryUnpluginFactory, stringToUUID } = require('@sentry/bundler-plugin-core');


// Patch the sentry webpack plugin
//
// The debugId creation that is nowadays needed by sentry to link sourcemaps, is not deterministic and will cause
// chunk hashes (and ultimately SRI hashes) to divert when compiling.
//
// Version 2.8.0 of the plugin no longer uses a raw UUID but feeds the `chunk.hash`, which appears to resolve the issue
// but in practice this does not work when building on seperate machines. Doing a manual sentry-cli inject works, but that
// would invalidate all the SRI hashes which is tedious to correct. The simplest fix is to simply feed the UUID creation
// with the chunk IDs, as it does not matter too much what the UUID is as long as they are different per release but can
// be reliably reproduced to enable deterministic builds.
//
// Source: https://github.com/getsentry/sentry-javascript-bundler-plugins/blob/main/packages/webpack-plugin/src/index.ts
const patchedSentryWebpackPlugin = (() => {
  function webpackDebugIdInjectionPlugin() {
    return {
      name: "sentry-webpack-debug-id-injection-plugin",
      webpack(compiler) {
        compiler.options.plugins = compiler.options.plugins || [];
        compiler.options.plugins.push(
          new webpack.BannerPlugin({
            raw: true,
            include: /\.(js|ts|jsx|tsx|mjs|cjs)$/,
            banner: (arg) => {
              // This is the patched line, ensuring that the debuId is always the same within releases.
              const debugId = stringToUUID(process.env.npm_package_version + arg.chunk.id);
              return getDebugIdSnippet(debugId);
            },
          })
        );
      },
    };
  }

  function webpackDebugIdUploadPlugin(upload) {
    const pluginName = "sentry-webpack-debug-id-upload-plugin";
    return {
      name: pluginName,
      webpack(compiler) {
        compiler.hooks.afterEmit.tapAsync(pluginName, (compilation, callback) => {
          const outputPath = compilation.outputOptions.path || path.resolve();
          const buildArtifacts = Object.keys(compilation.assets).map(
            (asset) => path.join(outputPath, asset)
          );
          void upload(buildArtifacts).then(() => {
            callback();
          });
        });
      },
    };
  }

  var sentryUnplugin = sentryUnpluginFactory({
    releaseInjectionPlugin: () => { return { name: "sentry-webpack-release-injection-plugin-noop" }},
    moduleMetadataInjectionPlugin: () => { return { name: "sentry-webpack-module-metadata-injection-plugin-noop" }},
    debugIdInjectionPlugin: webpackDebugIdInjectionPlugin,
    debugIdUploadPlugin: webpackDebugIdUploadPlugin
  });

  return sentryUnplugin.webpack;
})();

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
      if (!!htmlWebpackPlugin.userOptions.minify) {
        htmlWebpackPlugin.userOptions.minify.keepClosingSlash = false;
      }

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
          patchedSentryWebpackPlugin({
            org: "pixelcities",
            project: "datagarden",
            url: process.env.REACT_APP_SENTRY_URL,
            authToken: process.env.REACT_APP_SENTRY_AUTH_TOKEN,
            silent: true,
            telemetry: false,
            sourcemaps: {
              assets: []
            },
            release: {
              name: `datagarden-${process.env.REACT_APP_VERSION}`,
              create: true,
              finalize: false,
              inject: false,
              uploadLegacySourcemaps: {
                sourceMapReference: false,
                rewrite: false,
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
