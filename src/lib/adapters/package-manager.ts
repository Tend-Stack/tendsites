export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun' | 'unknown';
export type KnownPackageManager = Exclude<PackageManager, 'unknown'>;

const LOCKFILES: ReadonlyArray<readonly [string, KnownPackageManager]> = [
	['pnpm-lock.yaml', 'pnpm'],
	['package-lock.json', 'npm'],
	['yarn.lock', 'yarn'],
	['bun.lock', 'bun'],
	['bun.lockb', 'bun']
];

function normalizedFiles(files: readonly string[]): Set<string> {
	return new Set(files.map((path) => path.replaceAll('\\', '/').replace(/^\.\//, '')));
}

export function detectedPackageManagers(files: readonly string[]): readonly KnownPackageManager[] {
	const normalized = normalizedFiles(files);
	return [
		...new Set(
			LOCKFILES.filter(([lockfile]) => normalized.has(lockfile)).map(([, manager]) => manager)
		)
	];
}

export function detectPackageManager(files: readonly string[]): PackageManager {
	const normalized = normalizedFiles(files);
	for (const [lockfile, manager] of LOCKFILES) {
		if (normalized.has(lockfile)) return manager;
	}
	return 'unknown';
}

export function requireUnambiguousPackageManager(
	files: readonly string[]
): KnownPackageManager | null {
	const managers = detectedPackageManagers(files);
	if (managers.length > 1) {
		throw new Error(`Conflicting lockfiles: ${managers.join(', ')}`);
	}
	return managers[0] ?? null;
}

export function frozenInstallCommand(manager: KnownPackageManager): readonly string[] {
	return {
		pnpm: ['pnpm', 'install', '--frozen-lockfile'],
		npm: ['npm', 'ci'],
		yarn: ['yarn', 'install', '--immutable'],
		bun: ['bun', 'install', '--frozen-lockfile']
	}[manager];
}

export function buildCommand(manager: KnownPackageManager, script = 'build'): readonly string[] {
	return {
		pnpm: ['pnpm', 'run', script],
		npm: ['npm', 'run', script],
		yarn: ['yarn', 'run', script],
		bun: ['bun', 'run', script]
	}[manager];
}
