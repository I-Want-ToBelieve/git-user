import { defineConfig } from 'tsup'

/**
 * @see https://tsup.egoist.sh/#usage
 */
export default defineConfig({
  name: 'cli',
  entry: ['src/index.ts'],
  outDir: 'dist',
  target: 'node14',
  minify: true,
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  noExternal: ['omelette', 'cli-table3', 'commander', 'conf', 'ini', 'zx'],
})
