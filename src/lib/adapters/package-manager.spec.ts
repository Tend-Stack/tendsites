import { describe, expect, it } from 'vitest';

import {
	buildCommand,
	detectedPackageManagers,
	detectPackageManager,
	frozenInstallCommand,
	requireUnambiguousPackageManager
} from './package-manager';

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
		expect(buildCommand('yarn', 'generate')).toEqual(['yarn', 'run', 'generate']);
		expect(frozenInstallCommand('pnpm')).toEqual(['pnpm', 'install', '--frozen-lockfile']);
		expect(frozenInstallCommand('npm')).toEqual(['npm', 'ci']);
		expect(frozenInstallCommand('yarn')).toEqual(['yarn', 'install', '--immutable']);
		expect(frozenInstallCommand('bun')).toEqual(['bun', 'install', '--frozen-lockfile']);
	});

	it('fails closed when more than one package-manager lockfile is present', () => {
		expect(detectedPackageManagers(['package-lock.json', 'pnpm-lock.yaml'])).toEqual([
			'pnpm',
			'npm'
		]);
		expect(() => requireUnambiguousPackageManager(['package-lock.json', 'yarn.lock'])).toThrow(
			'Conflicting lockfiles'
		);
	});
});
