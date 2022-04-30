/**
 * @see https://github.com/release-it/release-it
 */
module.exports = {
  git: {
    commitMessage: 'chore: release v${version}',
  },
  github: {
    release: true,
  },
  plugins: {
    '@release-it/conventional-changelog': {
      infile: 'CHANGELOG.md',
      preset: {
        name: 'conventionalcommits',
        types: [
          {
            type: 'feat',
            section: 'Features',
          },
          {
            type: 'fix',
            section: 'Bug Fixes',
          },
          {},
        ],
      },
    },
  },
  npm: {
    publish: true,
  },

}
