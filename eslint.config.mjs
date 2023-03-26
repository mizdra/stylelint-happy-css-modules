// @ts-check

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const __dirname = new URL('.', import.meta.url).pathname;

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

/** @type {import('eslint').Linter.FlatConfig[]} */
// eslint-disable-next-line import/no-default-export
export default [
  { ignores: ['dist', '**/*.css.d.ts'] },
  // NOTE: This is a hack that allows eslint-plugin-import to work with flat config.
  // ref: https://github.com/import-js/eslint-plugin-import/issues/2556#issuecomment-1419518561
  {
    languageOptions: {
      parserOptions: {
        // Eslint doesn't supply ecmaVersion in `parser.js` `context.parserOptions`
        // This is required to avoid ecmaVersion < 2015 error or 'import' / 'export' error
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    settings: {
      // This will do the trick
      'import/parsers': {
        espree: ['.js', '.cjs', '.mjs', '.jsx'],
      },
    },
  },
  ...compat.extends('@mizdra/mizdra', '@mizdra/mizdra/+typescript', '@mizdra/mizdra/+prettier'),
  ...compat.env({
    node: true,
  }),
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['tsconfig.json', 'example/tsconfig.json'],
      },
    },
  },
  {
    rules: {
      'import/no-unresolved': 'off',
    },
  },
];
