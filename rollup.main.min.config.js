import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import replace from '@rollup/plugin-replace'
import copy from 'rollup-plugin-copy'
import dotenv from 'dotenv'

const env = dotenv.config({ path: `.env.${process.env.NODE_ENV}` }).parsed

export default {
	input: 'index.ts',
	output: {
		dir: './',
		format: 'esm',
		entryFileNames: '[name].min.js',
		chunkFileNames: 'dist/chunks/[name]-[hash].js',
		inlineDynamicImports: true
	},
	plugins: [
		typescript(),
		terser(),
		replace({
		preventAssignment: true,
			'process.env.DEV_MODE': JSON.stringify(env.DEV_MODE),
		}),
		copy({
			targets: [
				{ 
					src: 'index.min.js',
					dest: 'docs/assets/js/'
				}
			]
		})
	]
}
