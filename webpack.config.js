const path = require("path");
const webpack = require("webpack");
const dotenv = require("dotenv");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
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
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.html$/,
          use: ["html-loader"],
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            {
              loader: "css-loader",
              options: {
                url: false,
                sourceMap: !isProduction,
              },
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: !isProduction,
              },
            },
          ],
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
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/index.html",
      }),
      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: "css/main.min.css",
            }),
          ]
        : []),
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
                    cacheName: "pwa-cache-1",
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
      hot: true,
    },
    performance: {
      maxAssetSize: 5000000,
    },
  };
};
