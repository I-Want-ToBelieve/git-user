// @ts-check

/**
 * @type {import('@commitlint/types').UserConfig}
 * @see https://commitlint.js.org/#/reference-configuration?id=typescript
 */
const Configuration = {
  /*
   * Resolve and load @commitlint/config-conventional from node_modules.
   * Referenced packages must be installed
   */
  extends: ['@commitlint/config-conventional'],
}

module.exports = Configuration
