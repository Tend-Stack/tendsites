import { describe, expect, it } from 'vitest';

import { buildCommand, detectPackageManager } from './package-manager';

describe('package manager detection', () => {
	it('uses the frozen lockfile priority', () => {
		expect(detectPackageManager(['package-lock.json', 'pnpm-lock.yaml'])).toBe('pnpm');
		expect(detectPackageManager(['bun.lock'])).toBe('bun');
	});

	it('does not guess without a lockfile', () => {
		expect(detectPackageManager(['package.json', 'src/routes/+page.svelte'])).toBe('unknown');
	});

	it('returns argv rather than a browser-provided shell string', () => {
		expect(buildCommand('npm')).toEqual(['npm', 'run', 'build']);
		expect(buildCommand('bun')).toEqual(['bun', 'run', 'build']);
	});
});
