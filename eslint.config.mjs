import cds from '@sap/cds/eslint.config.mjs'
export default [
  ...cds,
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs'
    }
  },
  {
    name: 'test-files-config',
    files: ['tests/**/*'],
    rules: {
      'no-console': 'off'
    }
  }
]
