import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import dotenv from 'dotenv';

const env = dotenv.config({ path: `.env.${process.env.NODE_ENV}` }).parsed;

export default {
  input: 'src/cause-effect.ts',
  output: {
    dir: './',
    format: 'esm',
    entryFileNames: '[name].js',
    chunkFileNames: 'dist/chunks/[name]-[hash].js',
    inlineDynamicImports: true
  },
  plugins: [
    typescript(),
    replace({
      preventAssignment: true,
      'process.env.DEV_MODE': JSON.stringify(env.DEV_MODE),
    }),
  ]
};