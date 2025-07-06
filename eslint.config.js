import { typescript } from '@davidwarrington/eslint-config';

export default [
  ...typescript,

  {
    ignores: ['dist'],
  },
];
