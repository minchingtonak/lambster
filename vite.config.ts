import { defineConfig } from 'vite';
import * as path from 'path';
import checker from 'vite-plugin-checker';
import react from '@vitejs/plugin-react';
import dts from 'vite-dts';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		checker({
			typescript: true,
			eslint: {
				lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
			},
		}),
		dts(),
	],
	build: {
		lib: {
			entry: path.resolve(__dirname, 'src/index.ts'),
			name: 'lambster',
			formats: ['es', 'umd'],
		},
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: ['react', 'react-dom'],
			output: {
				// Provide global variables to use in the UMD build
				// for externalized deps
				globals: {
					react: 'React',
					'react-dom': 'ReactDOM',
				},
				sourcemapExcludeSources: true,
			},
		},
		sourcemap: true,
		// Reduce bloat from legacy polyfills.
		// target: 'esnext',
		// Leave minification up to applications.
		minify: false,
	},
});
