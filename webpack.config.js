const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const SRC_DIR = path.join(__dirname, '/client/src');
const DIST_DIR = path.join(__dirname, '/client/dist');

module.exports = environment => {
	const isProd = 'production'.indexOf(environment) !== -1;
	return {
		entry: `${SRC_DIR}/index.jsx`,
		output: {
			path: DIST_DIR,
			filename: 'bundle.js'
		},
		resolve: {
			extensions: ['.js', '.jsx', '.json', '.css'],
			alias: {
				components: path.join(__dirname, '/client/src/components'),
				utils: path.join(__dirname, '/client/src/utils'),
				assets: path.join(__dirname, '/client/src/assets'),
				scss: path.join(__dirname, '/client/src/scss'),
				apis: path.join(__dirname, '/client/src/apis')
			}
		},
		module: {
			rules: [
				{
					test: /\.scss$/,
					use: [
						'style-loader', // creates style nodes from JS strings
						'css-loader', // translates CSS into CommonJS
						'sass-loader' // compiles Sass to CSS, using Node Sass by default
					]
				},
				{
					test: /\.(png|jpe?g|gif|svg)$/,
					loader: 'file-loader',
					options: {
						name: 'assets/[name].[ext]'
					}
				},
				{
					test: /\.jsx?/,
					include: SRC_DIR,
					loader: 'babel-loader',
					query: {
						presets: [
							'@babel/preset-react',
							'@babel/preset-env',
							{
								plugins: [
									'@babel/plugin-proposal-class-properties'
								]
							}
						]
					}
				}
			]
		},
		plugins: [
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': JSON.stringify('production')
			}),
			new HtmlWebpackPlugin(
				Object.assign(
					{
						filename: 'index.html',
						template: `${SRC_DIR}/index.html`,
						minify: isProd
							? {
									collapseInlineTagWhitespace: true,
									collapseWhitespace: true,
									sortAttributes: true,
									sortClassName: true
							  }
							: false
					},
					isProd
						? {
								filename: `${DIST_DIR}/index.html`
						  }
						: null
				)
			),
			new FaviconsWebpackPlugin(`${SRC_DIR}/assets/logos/favicon.svg`),
			new CleanWebpackPlugin()
		],
		devServer: {
			contentBase: DIST_DIR,
			compress: true,
			publicPath: '/',
			hot: true,
			port: 8080,
			stats: {
				color: true
			}
		}
	};
};
