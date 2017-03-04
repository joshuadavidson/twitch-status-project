const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const autoprefixer = require('autoprefixer');
const path = require('path');

// *********************************************************** //
// PLUGINS
// *********************************************************** //
// configuration for the extraction of css
const ExtractSassPluginConfig = new ExtractTextPlugin({
  filename: 'style.css',
});

// define env variable for production build
const prodDefinePlugin = new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify('production'),
  },
});

// define env variable for development build
const devDefinePlugin = new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify('development'),
  },
});

const UglifyJsPluginConfig = new webpack.optimize.UglifyJsPlugin();

const HtmlWebpackPluginConfig = new HtmlWebpackPlugin({
  template: 'index.html',
});

// *********************************************************** //
// MODULE RULES
// *********************************************************** //
// configuration rule for the processing of HTML files
const htmlLoaderRule = {
  test: /.html$/,
  loader: 'html-loader',
  options: {
    attrs: [
      'img:src',
      'video:poster',
      'source:src',
    ],
  },
};

// configuration rule for the processing of javascript files
const javascriptLoaderRule = {
  test: /\.(js|jsx)$/,
  exclude: /(node_modules)/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: [
        ['es2015', { modules: false }],
      ],
    },
  },
};

// configuation options for postcss to enable autoprefixer
const postcssOptions = {
  plugins() {
    return [autoprefixer];
  },
};
// configuration rule for the processing of SCSS files
const scssLoaderRule = {
  test: /\.(scss|css)$/,
  exclude: /(node_modules)/,
  use: ExtractSassPluginConfig.extract({
    use: [
      { loader: 'css-loader' },
      { loader: 'postcss-loader', options: postcssOptions },
      { loader: 'sass-loader' },
    ],
  }),
};

// configuration rule for the processing of image files
const imageFileLoaderRule = {
  test: /\.(jpe?g|png|gif|svg)$/,
  exclude: /(node_modules)/,
  use: [
    {
      loader: 'file-loader',
      options: {
        name: '[path][name].[ext]',
      },
    },
    { loader: 'image-webpack-loader' },
  ],
};

// configuration rule for the processing of audio/video files
const audioVideoFileLoaderRule = {
  test: /\.(mp3|ogg|wav|mp4|mov)$/,
  exclude: /(node_modules)/,
  use: [
    {
      loader: 'file-loader',
      options: {
        name: '[path][name].[ext]',
      },
    },
  ],
};

// configuration rule for the processing of font files
const fontFileLoaderRule = {
  test: /\.(ttf|otf|eot|svg|woff2?)(\?.*$|$)/,
  // exclude: /(node_modules)/,
  use: [
    {
      loader: 'file-loader',
      options: {
        name: '/fonts/[name].[ext]',
      },
    },
  ],
};

// *********************************************************** //
// WEBPACK CONFIG
// env variable set from CLI with --env= flag
// *********************************************************** //
module.exports = function getWebpackConfig(env) {
  // default webpackConfig object
  // insert all configuration that is common for productio and development env
  const webpackConfig = {
    context: path.join(__dirname, '/src'),
    devtool: false,
    entry: [path.join(__dirname, '/src/index.js')],
    output: {
      path: path.join(__dirname, '/dist'),
      filename: 'index.js',
    },
    module: {
      rules: [
        javascriptLoaderRule,
        scssLoaderRule,
        imageFileLoaderRule,
        audioVideoFileLoaderRule,
        fontFileLoaderRule,
      ],
    },
    plugins: [
      ExtractSassPluginConfig,
      HtmlWebpackPluginConfig,
    ],
  };

  // production specific config, run with webpack --env=prod
  if (env === 'prod') {
    htmlLoaderRule.options.minimize = true;
    webpackConfig.module.rules.push(htmlLoaderRule);
    webpackConfig.plugins.push(prodDefinePlugin);
    webpackConfig.plugins.push(UglifyJsPluginConfig);
  }

  // development specific config, run with webpack --env=dev
  else {
    htmlLoaderRule.options.minimize = false;
    webpackConfig.module.rules.push(htmlLoaderRule);
    webpackConfig.plugins.push(devDefinePlugin);
    webpackConfig.devServer = {
      contentBase: path.join(__dirname, '/dist'),
      compress: true,
      port: 3000,
    };
  }

  return webpackConfig;
};
