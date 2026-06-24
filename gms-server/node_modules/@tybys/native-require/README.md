# native-require

Try to get native require function in any environment.

``` bash
$ npm install @tybys/native-require
```

## When should you use this package

If you want to write a library which supports both Node.js and browser, and you hope it can be work well with webpack, you can use this package instead of writing `__non_webpack_require__` directly in your code.

## Usage:

### Webpack

Plugin is **not** neccesary.

``` js
const { NativeRequireWebpackPlugin } = require('@tybys/native-require/plugins/webpack.js')

module.exports = {
  /* ... */
  plugins: [
    new NativeRequireWebpackPlugin()
  ]
}
```

CommonJS:

``` js
const { tryGetRequireFunction } = require('@tybys/native-require/index.js') // index.js can not be omitted
const nativeRequire = tryGetRequireFunction()
if (typeof nativeRequire === 'function') {
  // ...
}
```

ESM format input / TypeScript:

``` ts
import { tryGetRequireFunction } from '@tybys/native-require'
const nativeRequire = tryGetRequireFunction()
if (typeof nativeRequire === 'function') {
  // ...
}
```

### Rollup

**NOTE**: If you are using commonjs `require('@tybys/native-require/index.js')` with `@rollup/plugin-commonjs`, you need to add `@tybys/native-require/plugins/rollup.js`.

``` js
const { nativeRequireRollupPlugin } = require('@tybys/native-require/plugins/rollup.js')

module.exports = {
  plugins: [
    nativeRequireRollupPlugin(),
    /* commonjs node-resolve ... */
  ]
}
```

``` js
const { tryGetRequireFunction } = require('@tybys/native-require/index.js') // index.js can not be omitted
```

ESM / TypeScript:

``` js
import { tryGetRequireFunction } from '@tybys/native-require'
const nativeRequire = tryGetRequireFunction()
if (typeof nativeRequire === 'function') {
  // ...
}
```

### Browser (Generally do not use) / Electron renderer process

``` html
<script src="node_modules/@tybys/native-require/dist/native-require.js"></script>
<script>
  (function () {
    var nativeRequire = nr.tryGetRequireFunction(typeof module !== 'undefined' ? module : undefined)();
    if (typeof nativeRequire === 'function') {
      // ...
    }
  })();
</script>
```

Examples are in `test` folder.
