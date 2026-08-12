import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', 'src', 'lib', 'starters', 'runtime');
const work = await mkdtemp(resolve(tmpdir(), 'tend-sites-starter-'));

function run(command, args) {
	return new Promise((done, reject) => {
		const windowsNpm = process.platform === 'win32' && command === 'npm';
		const executable = windowsNpm ? (process.env.ComSpec ?? 'cmd.exe') : command;
		const executableArgs = windowsNpm ? ['/d', '/s', '/c', 'npm.cmd', ...args] : args;
		const child = spawn(executable, executableArgs, { cwd: work });
		let stderr = '';
		child.stderr.on('data', (chunk) => (stderr += chunk));
		child.once('error', reject);
		child.once('exit', (code) => {
			if (code === 0) done();
			else reject(new Error(stderr.slice(-4_000) || `${command} exited ${code}`));
		});
	});
}

try {
	for (const path of [
		'package.json',
		'package-lock.json',
		'svelte.config.js',
		'vite.config.js',
		'src/app.html',
		'src/routes/+layout.js'
	]) {
		const destination = resolve(work, path);
		await mkdir(dirname(destination), { recursive: true });
		await cp(resolve(root, path), destination);
	}
	await run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund']);
	for (const id of ['minimal', 'editorial', 'studio', 'docs']) {
		await cp(resolve(root, 'pages', `${id}.svelte`), resolve(work, 'src', 'routes', '+page.svelte'));
		await run('npm', ['run', 'build']);
		const output = await readFile(resolve(work, 'build', 'index.html'), 'utf8');
		if (!output.includes('<!doctype html>')) throw new Error(`${id} did not produce a static page`);
		console.log(`Verified ${id} starter build.`);
	}
} finally {
	await rm(work, { recursive: true, force: true });
}
