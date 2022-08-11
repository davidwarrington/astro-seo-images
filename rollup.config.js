import { readFileSync } from 'node:fs';
import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

const pkg = readFileSync('./package.json');

export default defineConfig({
  input: './src/index.ts',
  output: {
    file: './dist/index.js',
    format: 'esm',
  },
  plugins: [
    resolve(),
    typescript({ tsconfig: './tsconfig.json' }),
  ],
});
