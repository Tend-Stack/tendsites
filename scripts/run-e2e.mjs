import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const vite = resolve(root, 'node_modules', 'vite', 'bin', 'vite.js');
const playwright = resolve(root, 'node_modules', '@playwright', 'test', 'cli.js');

function waitForExit(child) {
	return new Promise((done, reject) => {
		child.once('error', reject);
		child.once('exit', (code, signal) => done({ code, signal }));
	});
}

async function waitUntilReady() {
	const deadline = Date.now() + 30_000;
	while (Date.now() < deadline) {
		try {
			const response = await fetch('http://127.0.0.1:4173');
			if (response.ok) return;
		} catch {
			// The preview process is still starting.
		}
		await new Promise((done) => setTimeout(done, 200));
	}
	throw new Error('The preview server did not become ready within 30 seconds.');
}

const build = spawn(process.execPath, [vite, 'build'], { cwd: root, stdio: 'inherit' });
const buildResult = await waitForExit(build);
if (buildResult.code !== 0) process.exit(buildResult.code ?? 1);

const preview = spawn(process.execPath, [vite, 'preview', '--host', '127.0.0.1'], {
	cwd: root,
	stdio: 'inherit'
});

let exitCode;
try {
	await waitUntilReady();
	const tests = spawn(process.execPath, [playwright, 'test'], { cwd: root, stdio: 'inherit' });
	const result = await waitForExit(tests);
	exitCode = result.code ?? 1;
} finally {
	preview.kill();
	await Promise.race([waitForExit(preview), new Promise((done) => setTimeout(done, 2_000))]);
}

process.exit(exitCode ?? 1);
