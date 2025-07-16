const HtmlWebpackPlugin = require("html-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const path = require("node:path");
const { rspack } = require("@rspack/core");

module.exports = (_env, argv) => ({
	mode: argv.mode === "production" ? "production" : "development",
	devtool: argv.mode === "production" ? false : "inline-source-map",
	cache: false,

	entry: {
		ui: "./src/ui.tsx",
		code: "./src/code.ts",
	},

	module: {
		rules: [
			// Converts TypeScript code to JavaScript with SWC for better performance
			{
				test: /\.(tsx?|jsx?|mjs|js)$/,
				exclude: /node_modules\/(?!(@kevintyj)\/).*/,
				loader: "builtin:swc-loader",
				options: {
					jsc: {
						parser: {
							syntax: "typescript",
							tsx: true,
							decorators: true,
						},
						transform: {
							react: {
								runtime: "automatic",
								development: argv.mode !== "production",
							},
						},
						target: "es5",
						externalHelpers: true,
					},
				},
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
		new rspack.DefinePlugin({
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
