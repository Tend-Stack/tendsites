import { describe, expect, it, vi } from 'vitest';

import { createDemoSite } from './demo-site';
import {
	DEMO_DRAFT_CONTRACT,
	DemoDraftStore,
	parseDemoDraft,
	type DraftStorage
} from './draft-storage';

function deferred() {
	let resolve!: () => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<void>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

describe('versioned local draft storage', () => {
	it('loads the legacy bare-site shape and migrates it on save', async () => {
		const writes: unknown[] = [];
		const site = createDemoSite();
		const storage: DraftStorage = {
			get: async () => site,
			set: async (_key, value) => void writes.push(value),
			delete: async () => undefined
		};
		const store = new DemoDraftStore(storage, 'draft', () => new Date('2026-08-10T00:00:00Z'));

		expect((await store.load())?.revision).toBe(0);
		await store.save(site);
		expect(writes).toEqual([
			expect.objectContaining({
				contract: DEMO_DRAFT_CONTRACT,
				revision: 1,
				savedAt: '2026-08-10T00:00:00.000Z'
			})
		]);
	});

	it('adds the first content collection when loading a pre-content draft', () => {
		const legacy = createDemoSite() as unknown as Record<string, unknown>;
		delete legacy.collections;
		const parsed = parseDemoDraft({
			contract: DEMO_DRAFT_CONTRACT,
			revision: 7,
			savedAt: '2026-08-10T00:00:00.000Z',
			site: legacy
		});
		expect(parsed?.revision).toBe(7);
		expect(parsed?.site.collections[0]).toMatchObject({ id: 'journal-posts', kind: 'posts' });
		expect(parsed?.site.collections[0].items).toHaveLength(3);
	});

	it('rejects malformed and unbounded stored drafts', () => {
		expect(parseDemoDraft({ contract: DEMO_DRAFT_CONTRACT, revision: -1 })).toBeNull();
		expect(parseDemoDraft({ ...createDemoSite(), tagline: 'x'.repeat(300_000) })).toBeNull();
	});

	it('serializes writes so an older save cannot overwrite a newer edit', async () => {
		const first = deferred();
		const second = deferred();
		const writes: Array<{ value: unknown; gate: ReturnType<typeof deferred> }> = [];
		const gates = [first, second];
		const storage: DraftStorage = {
			get: async () => null,
			set: async (_key, value) => {
				const gate = gates[writes.length];
				writes.push({ value, gate });
				await gate.promise;
			},
			delete: async () => undefined
		};
		const store = new DemoDraftStore(storage, 'draft', () => new Date('2026-08-10T00:00:00Z'));
		const older = createDemoSite();
		const newer = createDemoSite();
		newer.name = 'Newest version';

		const olderSave = store.save(older);
		const newerSave = store.save(newer);
		await vi.waitFor(() => expect(writes).toHaveLength(1));
		first.resolve();
		await olderSave;
		await vi.waitFor(() => expect(writes).toHaveLength(2));
		second.resolve();
		await newerSave;

		expect(writes.map(({ value }) => (value as { revision: number }).revision)).toEqual([1, 2]);
		expect((writes[1].value as { site: { name: string } }).site.name).toBe('Newest version');
	});

	it('allows a later revision to recover after one failed write', async () => {
		let attempts = 0;
		const storage: DraftStorage = {
			get: async () => null,
			set: async () => {
				attempts += 1;
				if (attempts === 1) throw new Error('temporary failure');
			},
			delete: async () => undefined
		};
		const store = new DemoDraftStore(storage, 'draft');

		await expect(store.save(createDemoSite())).rejects.toThrow('temporary failure');
		await expect(store.save(createDemoSite())).resolves.toMatchObject({ revision: 2 });
	});

	it('can replace an unreadable saved copy with the visible draft', async () => {
		let stored: unknown = { contract: DEMO_DRAFT_CONTRACT, revision: -1 };
		const storage: DraftStorage = {
			get: async () => stored,
			set: async (_key, value) => {
				stored = value;
			},
			delete: async () => {
				stored = null;
			}
		};
		const store = new DemoDraftStore(storage, 'draft');

		await expect(store.load()).rejects.toThrow('invalid or too large');
		await store.reset();
		await expect(store.save(createDemoSite())).resolves.toMatchObject({ revision: 1 });
		expect(parseDemoDraft(stored)?.site.name).toBe('Willow Journal');
	});
});
