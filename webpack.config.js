const path = require("path");
const webpack = require("webpack");
const dotenv = require("dotenv");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { GenerateSW } = require("workbox-webpack-plugin");

const env = dotenv.config().parsed || {};

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  console.log("isProduction:", isProduction);
  return {
    mode: isProduction ? "production" : "development",
    entry: "./src/js/entry.js",
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "dist"),
    },
    module: {
      rules: [
        {
          test: /\.html$/,
          use: ["html-loader"],
        },
        {
          test: /\.(png|svg|mp4|webm|ico|jpe?g|gif)$/,
          type: "asset/resource",
          generator: {
            filename: (pathData) => {
              const relativePath = path.relative(
                "./src/img",
                pathData.filename
              );
              return `img/${relativePath}`;
            },
          },
        },
        {
          test: /\.css$/,
          type: "asset/resource",
          generator: {
            filename: "css/[name][ext]",
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: "./src/fonts", to: "fonts" },
          { from: "./src/img", to: "img" },
          { from: "./src/manifest.json", to: "manifest.json" },
        ],
      }),
      new webpack.DefinePlugin({
        "process.env.TELEGRAM_TOKEN": JSON.stringify(
          env.TELEGRAM_TOKEN || process.env.TELEGRAM_TOKEN
        ),
      }),
      ...(isProduction
        ? [
            new GenerateSW({
              swDest: "sw.js",
              maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // Увеличить лимит до 20 МБ
              runtimeCaching: [
                {
                  urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif|css)$/,
                  handler: "CacheFirst",
                  options: {
                    cacheName: "pwa-cache-0",
                    expiration: {
                      maxEntries: 500, // Максимум файлов
                      maxAgeSeconds: 5 * 24 * 60 * 60, // 10 дней
                    },
                  },
                },
              ],
            }),
          ]
        : []),
    ],
    devServer: {
      port: 9000,
      open: true,
    },
    performance: {
      maxAssetSize: 5000000,
    },
  };
};
