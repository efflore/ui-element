import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

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
    terser()
  ]
};