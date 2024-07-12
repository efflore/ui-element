import typescript from '@rollup/plugin-typescript';

export default {
  // input: 'index.ts',
  input: {
    'index': 'index.ts',
    'lib/cause-effect': 'lib/cause-effect.ts',
    'lib/dom-utils': 'lib/dom-utils.ts',
    'lib/visibility-observer': 'lib/visibility-observer.ts'
  },
  output: {
    dir: './',
    format: 'esm'
  },
  plugins: [typescript()]
};