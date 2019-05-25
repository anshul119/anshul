const path = require('path');
const webpack = require('webpack');

const SRC_DIR = path.join(__dirname, '/client/src');
const DIST_DIR = path.join(__dirname, '/client/dist');

module.exports = {
	entry: `${SRC_DIR}/index.jsx`,
	output: {
		path: DIST_DIR,
		filename: 'bundle.js'
	},
	resolve: {
		extensions: ['.js', '.jsx', '.json', '.css'],
		alias: {
			components: path.join(__dirname, '/client/src/components'),
			assets: path.join(__dirname, '/client/src/assets'),
			scss: path.join(__dirname, '/client/src/scss')
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
				loader: 'file-loader'
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
							plugins: ['@babel/plugin-proposal-class-properties']
						}
					]
				}
			}
		]
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production')
		})
	]
};
