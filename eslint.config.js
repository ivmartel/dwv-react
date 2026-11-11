import globals from 'globals';
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    // public: vendored (minified) dwv workers
    ignores: ['dist/', 'coverage/', 'dev-dist/', 'public/']
  },
  js.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {jsx: true}
      },
      globals: {
        ...globals.browser
      }
    },
    rules: {
      // allow unused args starting with '_'
      'no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
      // missing hook dependencies are errors, not warnings
      'react-hooks/exhaustive-deps': 'error'
    }
  },
  {
    // tests: vitest globals (describe, it, expect, vi...)
    files: ['**/*.test.{js,jsx}', 'tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.vitest
      }
    }
  },
  {
    // config files run in node
    files: ['*.config.js'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
