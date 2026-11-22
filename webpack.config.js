const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const dotenv = require("dotenv");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { GenerateSW } = require("workbox-webpack-plugin");

const env = dotenv.config().parsed || {};
const INCLUDE_PATTERN = /<!--#include\s+file="(.+?)"\s*-->/g;

const resolveHtmlIncludes = (content, loaderContext, resourceDir) =>
  content.replace(INCLUDE_PATTERN, (match, includePath) => {
    const filePath = path.resolve(resourceDir, includePath);
    loaderContext.addDependency(filePath);
    const fileContent = fs.readFileSync(filePath, "utf8");

    return resolveHtmlIncludes(fileContent, loaderContext, path.dirname(filePath));
  });

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  console.log("isProduction:", isProduction);
  return {
    mode: isProduction ? "production" : "development",
    entry: "./src/js/entry.js",
    output: {
      // хеш в имени — чтобы на Netlify отдавать JS/CSS с кэшем на год (src/_headers)
      filename: isProduction ? "js/main.[contenthash:8].js" : "bundle.js",
      path: path.resolve(__dirname, "dist"),
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.html$/,
          use: [
            {
              loader: "html-loader",
              options: {
                // manifest.json и шрифты (preload) копируются как есть — html-loader не должен
                // подменять ссылки на хешированные копии.
                sources: {
                  urlFilter: (attribute, value) =>
                    !value.endsWith(".json") && !value.startsWith("fonts/"),
                },
                preprocessor: (content, loaderContext) =>
                  resolveHtmlIncludes(
                    content,
                    loaderContext,
                    path.dirname(loaderContext.resourcePath)
                  ),
              },
            },
          ],
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
          test: /\.(png|svg|mp4|webm|ico|jpe?g|gif|webp)$/,
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
              filename: "css/main.[contenthash:8].min.css",
            }),
          ]
        : []),
      new CopyWebpackPlugin({
        patterns: [
          { from: "./src/fonts", to: "fonts" },
          { from: "./src/img", to: "img" },
          { from: "./src/manifest.json", to: "manifest.json" },
          { from: "./src/robots.txt", to: "robots.txt" },
          { from: "./src/sitemap.xml", to: "sitemap.xml" },
          { from: "./src/_headers", to: "_headers", toType: "file" },
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
              // Заранее кэшируем только оболочку сайта и первый экран. Остальные картинки
              // (карточки, слайды попапов) попадают в кэш при первом показе — runtimeCaching ниже.
              // Иначе service worker при первом заходе качает ~8 МБ параллельно со страницей.
              include: [
                /\.(html|js|css)$/,
                /^manifest\.json$/,
                /^fonts\/.*\.(woff2|ttf)$/,
                /^img\/preloader\//,
                /^img\/myself\//,
                /^img\/prev_video\/.*\.webp$/,
                /^img\/service\/favicon\.ico$/,
              ],
              exclude: [/\.map$/, /^manifest.*\.js$/],
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
