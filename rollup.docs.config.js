import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

export default {
	input: 'docs/main.js',
	output: {
		dir: './docs/assets/js/',
		format: 'esm',
		entryFileNames: '[name].min.js',
		chunkFileNames: 'dist/chunks/[name]-[hash].js',
		inlineDynamicImports: true
	},
	plugins: [
		nodeResolve(),
		terser(),
	]
}
