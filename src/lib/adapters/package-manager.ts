export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun' | 'unknown';

const LOCKFILES: ReadonlyArray<readonly [string, PackageManager]> = [
	['pnpm-lock.yaml', 'pnpm'],
	['package-lock.json', 'npm'],
	['yarn.lock', 'yarn'],
	['bun.lock', 'bun'],
	['bun.lockb', 'bun']
];

export function detectPackageManager(files: readonly string[]): PackageManager {
	const normalized = new Set(files.map((path) => path.replaceAll('\\', '/').replace(/^\.\//, '')));
	for (const [lockfile, manager] of LOCKFILES) {
		if (normalized.has(lockfile)) return manager;
	}
	return 'unknown';
}

export function buildCommand(manager: Exclude<PackageManager, 'unknown'>): readonly string[] {
	return {
		pnpm: ['pnpm', 'run', 'build'],
		npm: ['npm', 'run', 'build'],
		yarn: ['yarn', 'build'],
		bun: ['bun', 'run', 'build']
	}[manager];
}
