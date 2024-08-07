import webpack = require("webpack");

import * as path from "path";

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
        test: /\.css$/,
        use: [
          {
            loader: "style-loader" // Creates style nodes from JS strings
          },
          {
            loader: "css-loader" // Translates CSS into CommonJS
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"]
  },
  node: {
    fs: "empty"
  }
};

export default webpackConfig;
