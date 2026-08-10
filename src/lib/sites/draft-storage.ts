import { cloneDemoSite, upgradeDemoSite, type DemoSite } from './demo-site';

export const DEMO_DRAFT_CONTRACT = 'tend.host/sites-local-draft/v1' as const;

export type DraftStorage = {
	get(key: string): Promise<unknown>;
	set(key: string, value: unknown): Promise<void>;
	delete(key: string): Promise<void>;
};

export type DemoDraftEnvelope = {
	contract: typeof DEMO_DRAFT_CONTRACT;
	revision: number;
	savedAt: string;
	site: DemoSite;
};

const MAX_DRAFT_BYTES = 256_000;

function isBounded(value: unknown): boolean {
	try {
		return JSON.stringify(value).length <= MAX_DRAFT_BYTES;
	} catch {
		return false;
	}
}

export function parseDemoDraft(value: unknown): DemoDraftEnvelope | null {
	if (!isBounded(value)) return null;

	// 0.2.0 previews stored the bare site before the versioned envelope was
	// introduced. Accept it once and migrate on the next successful save.
	const legacySite = upgradeDemoSite(value);
	if (legacySite) {
		return {
			contract: DEMO_DRAFT_CONTRACT,
			revision: 0,
			savedAt: new Date(0).toISOString(),
			site: legacySite
		};
	}

	if (!value || typeof value !== 'object') return null;
	const candidate = value as Partial<DemoDraftEnvelope>;
	const revision = candidate.revision;
	const savedAt = candidate.savedAt;
	if (
		candidate.contract !== DEMO_DRAFT_CONTRACT ||
		typeof revision !== 'number' ||
		!Number.isSafeInteger(revision) ||
		revision < 0 ||
		typeof savedAt !== 'string' ||
		!Number.isFinite(Date.parse(savedAt)) ||
		!upgradeDemoSite(candidate.site)
	)
		return null;
	const upgradedSite = upgradeDemoSite(candidate.site);
	if (!upgradedSite) return null;

	return {
		contract: DEMO_DRAFT_CONTRACT,
		revision,
		savedAt,
		site: upgradedSite
	};
}

export class DemoDraftStore {
	readonly #storage: DraftStorage;
	readonly #key: string;
	readonly #now: () => Date;
	#revision = 0;
	#loadPromise: Promise<DemoDraftEnvelope | null> | null = null;
	#tail: Promise<void> = Promise.resolve();

	constructor(storage: DraftStorage, key: string, now: () => Date = () => new Date()) {
		this.#storage = storage;
		this.#key = key;
		this.#now = now;
	}

	load(): Promise<DemoDraftEnvelope | null> {
		if (this.#loadPromise) return this.#loadPromise;
		this.#loadPromise = this.#storage.get(this.#key).then((stored) => {
			if (stored === null || stored === undefined) return null;
			const envelope = parseDemoDraft(stored);
			if (!envelope) throw new Error('The saved site draft is invalid or too large.');
			this.#revision = Math.max(this.#revision, envelope.revision);
			return envelope;
		});
		return this.#loadPromise;
	}

	save(site: DemoSite): Promise<DemoDraftEnvelope> {
		const snapshot = cloneDemoSite(site);
		const write = this.#tail
			.catch(() => undefined)
			.then(async () => {
				await this.load();
				const envelope: DemoDraftEnvelope = {
					contract: DEMO_DRAFT_CONTRACT,
					revision: ++this.#revision,
					savedAt: this.#now().toISOString(),
					site: snapshot
				};
				await this.#storage.set(this.#key, envelope);
				return envelope;
			});
		this.#tail = write.then(() => undefined);
		return write;
	}

	async flush(): Promise<void> {
		await this.#tail;
	}

	async retryLoad(): Promise<DemoDraftEnvelope | null> {
		await this.#tail.catch(() => undefined);
		this.#loadPromise = null;
		return this.load();
	}

	reset(): Promise<void> {
		const reset = this.#tail
			.catch(() => undefined)
			.then(async () => {
				await this.#storage.delete(this.#key);
				this.#revision = 0;
				this.#loadPromise = Promise.resolve(null);
			});
		this.#tail = reset;
		return reset;
	}
}
