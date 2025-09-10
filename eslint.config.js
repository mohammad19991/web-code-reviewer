const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const globals = require('globals');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  js.configs.recommended,
  prettierConfig,
  {
    files: ['src/**/*.js', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2020
      },
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettier
    },
    rules: {
      // Prettier integration
      'prettier/prettier': 'error',
      
      // Disable conflicting rules (handled by Prettier)
      'indent': 'off',
      'quotes': 'off',
      'semi': 'off',
      'comma-dangle': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      'space-before-function-paren': 'off',
      'space-before-blocks': 'off',
      'keyword-spacing': 'off',
      'space-infix-ops': 'off',
      'eol-last': 'off',
      'no-trailing-spaces': 'off',
      
      // Keep non-formatting rules
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      'no-console': 'warn',
      'no-var': 'error',
      'prefer-const': 'warn',
      
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      
      // Relaxed rules for GitHub Actions
      'no-process-exit': 'off'
    }
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    },
    rules: {
      'no-console': 'off'
    }
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      '*.min.js',
      '*.bundle.js',
      'package-lock.json',
      'yarn.lock',
      '.github/',
      '*.md',
      '*.config.js',
      'jest.config.js'
    ]
  }
];
