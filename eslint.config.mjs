import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', 'apps/api/src/supabase/database.types.ts', 'playwright-report/**'] },
  js.configs.recommended,
  {
    files: ['apps/web/**/*.js'],
    languageOptions: { globals: globals.browser },
    rules: {
      // Markup goes through html`` + render()/append() (dom.js), which escape values.
      'no-restricted-properties': [
        'error',
        { property: 'innerHTML', message: 'Use render() or append() from core/dom.js.' },
        { property: 'outerHTML', message: 'Use render() or append() from core/dom.js.' },
        { object: 'document', property: 'write', message: 'Never.' },
      ],
      'no-restricted-syntax': ['error', { selector: "CallExpression[callee.property.name='insertAdjacentHTML']", message: 'Use append() from core/dom.js.' }],
    },
  },
  {
    files: ['apps/web/src/core/dom.js'],
    rules: { 'no-restricted-properties': 'off', 'no-restricted-syntax': 'off' },
  },
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: ['**/*.ts'] })),
  {
    files: ['**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  { files: ['**/*.cjs', '**/jest.config.js', 'api/**/*.js', 'scripts/**/*.mjs', 'e2e/**/*.ts'], languageOptions: { globals: globals.node } },
);
