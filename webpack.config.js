const webpack = require('webpack');
const path = require('path');

module.exports = {
  context: path.join(__dirname, '/src'),
  devtool: null,
  entry: './index.js',
  output: {
    path: path.join(__dirname, '/dist'),
    filename: 'app.min.js',
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /(node_modules)/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015'],
      },
    }],
  },
  plugins: [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      mangle: true,
      sourcemap: false,
    }),
  ],
};
