/**
 * dsh-devtools standalone build config.
 *
 * Node-half lib/ (trace fold + /dsh-devtools RPC host) plus the browser
 * client bundle lib/client.js (closure-factory artifact for the GUI's
 * __ModuleLoader__, CSS Modules inlined with auto-injected <style> tags).
 *
 * PROVENANCE: this config is a minimal adaptation of the DeepSeek Harness
 * web build preset `packages/client/tsdown.client.ts` (MIT, deepseek-ai/
 * deepseek-harness), as mirrored by the dsh-web-ui repository's
 * `shared/tsdown.client.ts`. It keeps only what dsh-devtools needs:
 * the node ESM library, the browser CJS client bundle, the platform
 * module-table externals, CSS Modules inlining with reproducible hashes,
 * sourcemaps, and the client-bundle purity gate. Mobile bundles, generic
 * build faces, and workspace-only behavior are intentionally removed.
 */

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, dirname, relative, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

/** Repository root: this config file's own directory (the repo root). */
const REPOSITORY_ROOT = fileURLToPath(new URL('.', import.meta.url))

/**
 * DSH shell module-table specifiers: resolved by the runtime loader, never
 * bundled. Mirrors the shell's seed table (upstream web-platform.ts).
 */
const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-schema-form',
] as const

/**
 * Documented upstream exemption: the snapshot-store engine lives in runtime
 * pending its promotion-time rehoming; the lazy CJS table answers the
 * require natively.
 */
const RUNTIME_STORE_EXEMPTION = '@deepseek-ai/dsh-client-runtime/client'

/** Externals resolved from the loader module table. */
const CLIENT_EXTERNALS: readonly string[] = [...PLATFORM_MODULES, RUNTIME_STORE_EXEMPTION]

/**
 * Virtual-id wrapper keeping module CSS away from tsdown's own css pipeline
 * (which would require @tsdown/css). The suffix matters: tsdown's guard
 * matches ids ending in `.css`, so the virtual id must not.
 */
const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

/** Rebase a physical lib-relative source onto a browser URL mirroring the repo layout. */
function browserSourcePath(source: string, sourcemapPath: string): string {
  if (!source.startsWith('.')) return source
  const physicalSource = resolvePath(dirname(sourcemapPath), source)
  const repositoryPath = relative(REPOSITORY_ROOT, physicalSource).split(sep).join('/')
  return repositoryPath.startsWith('packages/') ? `../../../${repositoryPath}` : source
}

/** Resolve an emitted JS asset import against its source-tree counterpart. */
function sourceAssetPath(source: string, importer: string): string {
  const emitted = resolvePath(dirname(importer), source)
  if (existsSync(emitted)) return emitted
  const marker = `${sep}lib${sep}types${sep}`
  const boundary = emitted.indexOf(marker)
  if (boundary < 0) return emitted
  return resolvePath(emitted.slice(0, boundary), 'src', emitted.slice(boundary + marker.length))
}

/** Node-half library config: ESM, cordis external, everything else bundled. */
function libraryConfig(id: string): UserConfig {
  return {
    name: id,
    entry: ['src/index.ts'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
    // The cordis framework resolves at runtime from the dsh profile tree;
    // its built declarations carry .ts-suffixed relative imports rolldown
    // cannot follow, so the import must stay external.
    external: ['@deepseek-ai/cordis', '@deepseek-ai/dsh-client-connection'],
  }
}

/** Browser client bundle config: CJS, module-table externals, CSS inline. */
function clientConfig(id: string): UserConfig {
  return {
    name: `${id}/client`,
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    dts: false,
    sourcemap: true,
    clean: false,
    external: [...CLIENT_EXTERNALS],
    // Browser bundles inline node-idiom deps (zustand/immer read
    // process.env.NODE_ENV; zustand's esm build probes import.meta.env.MODE,
    // which a CJS output cannot carry). The bare `import.meta.env` key is
    // required alongside the precise MODE key for truthiness probes.
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
    // tsdown auto-externalizes package dependencies; anything NOT in the
    // loader module table must inline instead. A require() the table cannot
    // answer is a guaranteed runtime throw, so the rule is the table itself.
    noExternal: (source: string) => (CLIENT_EXTERNALS.includes(source) ? undefined : true),
    plugins: [{
      // Bundle purity gate: platform seed entries stay external, and every
      // other @deepseek-ai value import is a build error (type-only imports
      // are erased and never reach this gate). Cross-plugin collaboration
      // goes through cordis services instead.
      name: 'dsh-client-bundle-purity',
      resolveId(source: string) {
        if (!source.startsWith('@deepseek-ai/')) return null
        if (CLIENT_EXTERNALS.includes(source)) return null
        throw new Error(
          `client bundle purity: "${source}" is not a platform module (CLIENT_EXTERNALS) — `
          + 'cross-plugin value imports are forbidden; collaborate through cordis services '
          + '(type-only imports are erased and never reach this gate)',
        )
      },
    }, {
      name: 'dsh-css-modules-inline',
      resolveId(source: string, importer: string | undefined) {
        if (!source.endsWith('.module.css')) return null
        const abs = importer !== undefined ? sourceAssetPath(source, importer) : source
        // Virtual id uses a repository-relative path: rolldown stamps the id
        // into the emitted bundle (#region comment), so an absolute id would
        // tie the artifact to the checkout location.
        const rel = relative(REPOSITORY_ROOT, abs).split(sep).join('/')
        return CSS_VIRTUAL_PREFIX + rel + CSS_VIRTUAL_SUFFIX
      },
      async load(virtualId: string) {
        if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
        const relId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
        const fileId = resolvePath(REPOSITORY_ROOT, relId)
        // The virtual id otherwise hides the physical stylesheet from Rolldown's watch graph.
        this.addWatchFile(fileId)
        const source = await readFile(fileId)
        // Hash determinism: lightningcss derives the css-modules [hash] from
        // the filename, so a repository-relative path keeps class names
        // reproducible from any checkout path.
        const hashFilename = relative(REPOSITORY_ROOT, fileId).split(sep).join('/')
        const { code, exports: cssExports } = transform({
          filename: hashFilename,
          code: source,
          cssModules: { pattern: '[hash]_[local]' },
          minify: true,
        })
        const classMap: Record<string, string> = {}
        // Sort deterministically: lightningcss's cssExports iteration order
        // is process-dependent (hash-map seeds), which would otherwise churn
        // the emitted lib/client.js on every rebuild.
        for (const [local, exp] of Object.entries(cssExports ?? {}).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
          classMap[local] = exp.name
        }
        // One <style data-plugin> per module file; idempotent under re-evaluation.
        return [
          `const css = ${JSON.stringify(code.toString())};`,
          `const tagId = ${JSON.stringify(`${id}/${basename(fileId)}`)};`,
          'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
          '  const tag = document.createElement(\'style\');',
          `  tag.dataset.plugin = ${JSON.stringify(id)};`,
          '  tag.dataset.pluginCss = tagId;',
          '  tag.textContent = css;',
          '  document.head.appendChild(tag);',
          '}',
          `export default ${JSON.stringify(classMap)};`,
        ].join('\n')
      },
    }],
    outputOptions: {
      entryFileNames: 'client.js',
      sourcemapPathTransform: browserSourcePath,
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  }
}

export default [libraryConfig('dsh-devtools'), clientConfig('dsh-devtools')]
