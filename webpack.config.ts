import webpack = require("webpack");

const path = require("path");

const webpackConfig: webpack.Configuration = {
  resolveLoader: {
    modules: [path.resolve(__dirname, "src"), "node_modules"]
  },
  mode: "development",
  entry: {
    manifest: path.join(__dirname, "src/manifest.json"),
    "js/popup": path.join(__dirname, "src/js/popup/index.tsx"),
    "js/eventPage": path.join(__dirname, "src/js/eventPage/index.ts")
  },
  devtool: "inline-source-map",
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        // Only apply these loaders to manifest.json.
        test: /manifest.json$/,
        // Loaders are applied in reverse order.
        use: [
          // Second: JSON -> JS
          // "json-loader",
          // First: partial manifest.json -> complete manifest.json
          "manifest-loader"
        ]
      },
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: "ts-loader"
      },
      {
        exclude: /node_modules/,
        test: /\.scss$/,
        use: [
          {
            loader: "style-loader" // Creates style nodes from JS strings
          },
          {
            loader: "css-loader" // Translates CSS into CommonJS
          },
          {
            loader: "sass-loader" // Compiles Sass to CSS
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  node: {
    fs: "empty"
  }
};

export default webpackConfig;
