/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Package version, injected at build time from package.json#version. */
  readonly __VERSION__: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
