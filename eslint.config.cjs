const globals = require('globals');
const pluginJs = require('@eslint/js');

module.exports = [
  
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**'],
    languageOptions: {
      globals: {
        ...globals.node
      },
      ecmaVersion: 'latest'
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      'no-console': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },

  {
    files: ['**/__tests__/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  }
];
