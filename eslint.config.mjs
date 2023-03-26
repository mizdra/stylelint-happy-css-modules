// @ts-expect-error
import { FlatCompat } from '@eslint/eslintrc';

const __dirname = new URL('.', import.meta.url).pathname;

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends('@mizdra/mizdra'),
  ...compat.extends('@mizdra/mizdra/+typescript'),
  ...compat.extends('@mizdra/mizdra/+prettier'),
];
