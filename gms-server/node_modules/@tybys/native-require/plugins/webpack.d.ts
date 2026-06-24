import { Compiler } from 'webpack'

export declare interface NativeRequireWebpackPluginOptions {
  variable?: string
}

export declare class NativeRequireWebpackPlugin {
  constructor (options: NativeRequireWebpackPluginOptions)
  apply (compiler: Compiler): void
}
