const webpack = require('webpack')
const webpackVersion = Number(webpack.version.charAt(0))
let ParserHelpers
if (webpackVersion > 4) {
  ParserHelpers = require('webpack/lib/javascript/JavascriptParserHelpers.js')
} else {
  ParserHelpers = require('webpack/lib/ParserHelpers.js')
}

const NullFactory = require("webpack/lib/NullFactory.js")
const ConstDependency = require('webpack/lib/dependencies/ConstDependency.js')

const __tybys_get_native_require__ = 
`(function () {
  return typeof __webpack_public_path__ !== 'undefined' ? (typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : undefined) : (typeof require !== 'undefined' ? require : undefined);
})`

const GET_NATIVE_REQUIRE_FUNCTION_NAME = '__tybys_get_native_require__'

class NativeRequireWebpackPlugin {
  constructor (options) {
    this._options = {
      ...(Object.prototype.toString.call(options) === '[object Object]' ? options : {})
    }
  }
  apply (compiler) {
    compiler.hooks.compilation.tap(
			"NativeRequireWebpackPlugin",
			(compilation, { normalModuleFactory }) => {
				compilation.dependencyFactories.set(ConstDependency, new NullFactory())
				compilation.dependencyTemplates.set(
					ConstDependency,
					new ConstDependency.Template()
        )

				const handler = parser => {
          parser.hooks.expression
            .for(GET_NATIVE_REQUIRE_FUNCTION_NAME)
            .tap("NativeRequireWebpackPlugin", ParserHelpers.toConstantDependency(parser, __tybys_get_native_require__))

          parser.hooks.evaluateTypeof
            .for(GET_NATIVE_REQUIRE_FUNCTION_NAME)
            .tap("NativeRequireWebpackPlugin", ParserHelpers.evaluateToString('function'))
				}

				normalModuleFactory.hooks.parser
					.for("javascript/auto")
					.tap("NativeRequireWebpackPlugin", handler)
				normalModuleFactory.hooks.parser
					.for("javascript/dynamic")
					.tap("NativeRequireWebpackPlugin", handler)
				normalModuleFactory.hooks.parser
					.for("javascript/esm")
          .tap("NativeRequireWebpackPlugin", handler)
      }
    )
  }
}

exports.NativeRequireWebpackPlugin = NativeRequireWebpackPlugin
