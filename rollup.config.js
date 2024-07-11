import typescript from '@rollup/plugin-typescript';

export default {
  input: 'index.ts',
  /* input: {
    'index': 'index.ts',
    'lib/cause-effect': 'lib/cause-effect.ts'
  }, */
  output: {
    dir: './',
    format: 'esm'
  },
  plugins: [typescript()]
};