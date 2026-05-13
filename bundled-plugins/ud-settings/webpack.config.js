const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const DependencyExtractionWebpackPlugin = require("@wordpress/dependency-extraction-webpack-plugin");

module.exports = {
	mode: "production",

	entry: {
		"admin-script": "./src/admin.js",
		editor: "./src/editor.scss",

	"options/block-visibility/editor-script":
		"./src/options/block-visibility/editor.js",
	},

	output: {
		path: path.resolve(__dirname, "build"),
		filename: "[name].js",
	},

	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader",
					options: {
						presets: ["@wordpress/babel-preset-default"],
					},
				},
			},
			{
				test: /\.scss$/,
				use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
			},
		],
	},

	plugins: [
		new MiniCssExtractPlugin({
			filename: "[name].css",
		}),
		new DependencyExtractionWebpackPlugin({
			outputFormat: "php",
			outputFilename: "[name].asset.php",
		}),
	],

externals: {
	"@wordpress/api-fetch": "wp.apiFetch",
	"@wordpress/blocks": "wp.blocks",
	"@wordpress/components": "wp.components",
	"@wordpress/dom-ready": "wp.domReady",
	"@wordpress/element": "wp.element",
	"@wordpress/i18n": "wp.i18n",
},

	stats: "minimal",
};