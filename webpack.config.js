const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    popup: './src/popup/popup.ts',
    background: './src/background/background.ts',
    content: './src/content/content.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]/[name].js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        { 
          from: './src/manifest.json',
          to: './manifest.json',
          transform(content) {
            return Buffer.from(JSON.stringify({
              ...JSON.parse(content.toString()),
              background: {
                service_worker: 'background/background.js',
                type: 'module'
              }
            }, null, 2))
          }
        },
        { from: './src/popup/popup.html', to: './popup/popup.html' },
        { from: './src/styles', to: './styles' },
      ],
    }),
  ],
  optimization: {
    minimize: false // This helps with debugging
  }
};