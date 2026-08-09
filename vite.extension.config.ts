import { resolve } from 'node:path';

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		svelte({
			compilerOptions: {
				runes: true
			}
		})
	],
	build: {
		cssCodeSplit: false,
		emptyOutDir: true,
		lib: {
			entry: resolve(import.meta.dirname, 'src/extension/index.ts'),
			formats: ['es'],
			fileName: () => 'index.js',
			cssFileName: 'style'
		},
		outDir: 'dist/extension',
		rollupOptions: {
			output: {
				assetFileNames: (assetInfo) =>
					assetInfo.name === 'style.css' ? 'style.css' : 'assets/[name]-[hash][extname]'
			}
		},
		target: 'es2022'
	}
});
