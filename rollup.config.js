import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

import pkg from './package.json';

export default {
	input: './index',
	output: [{
		file: pkg.main,
		format: 'cjs',
		sourcemap: true
	}, {
		file: pkg.module,
		format: 'es',
		sourcemap: true
	}, {
		file: `./dist/${pkg.name}.min.js`,
		name: pkg.name.replace(/-(.)/g, (_, str) => str.toUpperCase()),
		format: 'iife',
	}],
	plugins: [
		resolve(),
		commonjs(),
		babel(),
	],
}
