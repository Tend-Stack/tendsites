import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

import { unzipSync, zipSync } from 'fflate';

const root = resolve(import.meta.dirname, '..');
const distribution = resolve(root, 'dist', 'extension');
const artifacts = resolve(root, 'artifacts');
const config = JSON.parse(await readFile(resolve(root, 'extension.config.json'), 'utf8'));

const inputs = new Map([
	['index.js', resolve(distribution, 'index.js')],
	['style.css', resolve(distribution, 'style.css')],
	['icon.svg', resolve(root, 'static', 'icon.svg')],
	['README.md', resolve(root, 'README.md')]
]);

const files = {};
const integrity = {};
for (const [name, path] of inputs) {
	const contents = new Uint8Array(await readFile(path));
	files[name] = contents;
	integrity[name] = `sha256-${createHash('sha256').update(contents).digest('base64')}`;
}

const manifest = { ...config, integrity };
files['extension.json'] = new TextEncoder().encode(`${JSON.stringify(manifest, null, 2)}\n`);

await rm(artifacts, { recursive: true, force: true });
await mkdir(artifacts, { recursive: true });
const archiveName = `tendsites-${config.version}.zip`;
const archivePath = resolve(artifacts, archiveName);
const archive = zipSync(files, { level: 9 });
await writeFile(archivePath, archive);
await writeFile(resolve(artifacts, 'extension.json'), files['extension.json']);

const packaged = unzipSync(archive);
const packagedManifest = JSON.parse(new TextDecoder().decode(packaged['extension.json']));
for (const [name, expectedDigest] of Object.entries(packagedManifest.integrity)) {
	const contents = packaged[name];
	if (!contents) throw new Error(`Packaged file is missing: ${name}`);
	const actualDigest = `sha256-${createHash('sha256').update(contents).digest('base64')}`;
	if (actualDigest !== expectedDigest) throw new Error(`Integrity mismatch: ${name}`);
}

console.log(
	`Packaged ${basename(archivePath)} with ${Object.keys(integrity).length} verified files.`
);
