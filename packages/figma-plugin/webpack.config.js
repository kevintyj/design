const HtmlWebpackPlugin = require("html-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const path = require("node:path");
const webpack = require("webpack");

module.exports = (_env, argv) => ({
	mode: argv.mode === "production" ? "production" : "development",
	devtool: argv.mode === "production" ? false : "inline-source-map",
	cache: false,

	entry: {
		ui: "./src/ui.tsx", // The entry point for our UI
		code: "./src/code.ts", // The entry point for our figma code
	},

	module: {
		rules: [
			// Converts TypeScript code to JavaScript with Babel for better compatibility
			{
				test: /\.(tsx?|jsx?|mjs|js)$/,
				exclude: /node_modules\/(?!(@design)\/).*/,
				use: [
					{
						loader: "babel-loader",
						options: {
							presets: [
								[
									"@babel/preset-env",
									{
										targets: {
											browsers: ["ie >= 11"],
										},
										modules: false,
										useBuiltIns: "usage",
										corejs: 3,
									},
								],
								"@babel/preset-typescript",
								[
									"@babel/preset-react",
									{
										runtime: "automatic",
									},
								],
							],
							plugins: [
								"@babel/plugin-proposal-class-properties",
								"@babel/plugin-proposal-object-rest-spread",
								"@babel/plugin-proposal-nullish-coalescing-operator",
								"@babel/plugin-proposal-optional-chaining",
							],
						},
					},
				],
			},

			// Enables including CSS by doing "import './file.css'" in your TypeScript code
			// Updated for Tailwind v4 - no need for autoprefixer as it's built in
			{
				test: /\.css$/,
				use: ["style-loader", { loader: "css-loader", options: { importLoaders: 1 } }, "postcss-loader"],
			},

			// Allows you to use "<%= require('./file.svg') %>" in your HTML code to get a data URI
			{
				test: /\.svg$/,
				loader: "url-loader",
			},
		],
	},

	// Webpack tries these extensions for you if you omit the extension like "import './file'"
	resolve: {
		extensions: [".tsx", ".ts", ".jsx", ".js"],
	},

	output: {
		filename: (pathData) => {
			return pathData.chunk.name === "code" ? "code.js" : "[name].js";
		},
		path: path.resolve(__dirname, "dist"), // Compile into a folder called "dist"
		clean: true, // Clean the dist folder before each build
	},

	// Tells Webpack to generate "ui.html" and to inline "ui.ts" into it
	plugins: [
		new webpack.DefinePlugin({
			global: {}, // Fix missing symbol error when running in developer VM
		}),
		new HtmlWebpackPlugin({
			inject: "body",
			template: "./src/ui.html",
			filename: "ui.html",
			chunks: ["ui"],
			cache: false,
		}),
		new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/ui/]),
	],
});
