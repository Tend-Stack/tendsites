import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', 'src', 'lib', 'starters', 'runtime');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const paths = [
	'package.json',
	'package-lock.json',
	'svelte.config.js',
	'vite.config.js',
	'src/app.html',
	'src/routes/+layout.js'
];
const shared = Object.fromEntries(
	await Promise.all(paths.map(async (path) => [path, hash(await readFile(resolve(root, path))) ]))
);
shared['tend.site.json'] = 'c42c971a96f3c65c4ac7cdfbf486e6cba6cdf0ba26fe74c8f3c3412d41330a22';
const pages = Object.fromEntries(
	await Promise.all(
		['minimal', 'editorial', 'studio', 'docs'].map(async (id) => [
			id,
			await readFile(resolve(root, 'pages', `${id}.svelte`))
		])
	)
);

for (const [id, page] of Object.entries(pages)) {
	const files = { ...shared, 'src/routes/+page.svelte': hash(page) };
	const canonical = Object.entries(files)
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([path, digest]) => `${path}:${digest}`)
		.join('\n');
	console.log(id, files['src/routes/+page.svelte'], hash(canonical));
}
