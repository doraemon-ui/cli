// eslint.config.js (CommonJS 版本)
const globals = require('globals')
const js = require('@eslint/js')
const tsParser = require('@typescript-eslint/parser')
const importPlugin = require('eslint-plugin-import')

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        NodeJS: 'readonly',
        getApp: 'readonly',
        getCurrentPages: 'readonly',
        Page: 'readonly',
        Component: 'readonly',
        App: 'readonly',
        wx: 'readonly',
        Behavior: 'readonly',
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      indent: [
        2,
        2,
        {
          SwitchCase: 1,
          ignoredNodes: [
            'Decorator',
            'Decorator ~ *',
            'PropertyDefinition[decorators.length > 0]',
            'MethodDefinition[decorators.length > 0]',
          ],
        },
      ],
      quotes: [2, 'single', { avoidEscape: true }],
      semi: [2, 'never'],
      strict: [2, 'never'],
      'comma-dangle': [2, 'always-multiline'],
      'array-bracket-newline': [2, 'consistent'],
      'jsx-quotes': [2, 'prefer-double'],
      'no-unused-vars': 'off',
    },
  },
  {
    ignores: [
      '.git',
      '.github',
      '.husky',
      '.*.js',
      'node_modules',
      'packages/**/dist',
      'packages/**/lib',
      'packages/**/types',
      'packages/**/miniprogram_dist',
      'packages/**/node_modules',
    ],
  },
]
