exports.nativeRequireRollupPlugin = function () {
  return {
    name: 'native-require',
    renderChunk (code /*, chunk, options */) {
      return code.replace(/function\s+commonjsRequire\s+\((.+?)\)\s+\{\s*(\r?\n)*\s*throw new Error\((.+?)\);\s*(\r?\n)*\s*\}/g, '')
        .replace(/commonjsRequire/g, 'require')
    }
  }
}
