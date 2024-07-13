import typescript from '@rollup/plugin-typescript';

export default {
  input: 'index.ts',
  // input: 'src/cause-effect.ts',
  // input: 'src/lib/component.ts',
  output: {
    dir: './',
    format: 'esm'
  },
  plugins: [typescript()]
};