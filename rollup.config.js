import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: {
    'cause-effect': 'src/cause-effect.ts',
    'index': 'index.ts',
    'component': 'src/lib/component.ts',
  },
  output: {
    dir: './',
    format: 'esm',
    entryFileNames: '[name].js',
    chunkFileNames: 'dist/chunks/[name]-[hash].js'
  },
  plugins: [
    typescript(),
    terser()
  ]
};