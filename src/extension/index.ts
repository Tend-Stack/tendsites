import { mount, unmount } from 'svelte';

import SitesApp from '../lib/sites/SitesApp.svelte';

import type { HostMediaBridge } from '../lib/sites/host-media';

type ExtensionHost = {
	id: string;
	storage?: {
		get(key: string): Promise<unknown>;
		set(key: string, value: unknown): Promise<void>;
		delete(key: string): Promise<void>;
	};
	files?: HostMediaBridge;
	onUnmount(callback: () => void): void;
};

function stylesheetUrl(): string {
	const moduleUrl = new URL(import.meta.url);
	const stylesheet = new URL('./style.css', moduleUrl);
	// Relative URL resolution intentionally drops the module query. Copy it
	// back so a safe extension update never combines new JavaScript with a
	// stylesheet cached for the previous version.
	stylesheet.search = moduleUrl.search;
	return stylesheet.href;
}

async function ensureStylesheet(): Promise<void> {
	const id = 'host-tend-sites-styles';
	const href = stylesheetUrl();
	const current = document.getElementById(id);
	if (current instanceof HTMLLinkElement && current.href === href) {
		if (current.sheet) return;
		await new Promise<void>((resolve, reject) => {
			current.addEventListener('load', () => resolve(), { once: true });
			current.addEventListener(
				'error',
				() => reject(new Error('TEND Sites styles failed to load.')),
				{
					once: true
				}
			);
		});
		return;
	}
	current?.remove();

	const stylesheet = document.createElement('link');
	stylesheet.id = id;
	stylesheet.rel = 'stylesheet';
	stylesheet.href = href;
	const loaded = new Promise<void>((resolve, reject) => {
		stylesheet.addEventListener('load', () => resolve(), { once: true });
		stylesheet.addEventListener(
			'error',
			() => {
				stylesheet.remove();
				reject(new Error('TEND Sites styles failed to load.'));
			},
			{ once: true }
		);
	});
	document.head.append(stylesheet);
	await loaded;
}

export default function activate(host: ExtensionHost) {
	return {
		async mount(container: HTMLElement) {
			await ensureStylesheet();
			const app = mount(SitesApp, {
				target: container,
				props: { embedded: true, storage: host.storage, media: host.files }
			});
			let active = true;

			const cleanup = () => {
				if (!active) return;
				active = false;
				void unmount(app);
				container.replaceChildren();
			};

			host.onUnmount(cleanup);
			return cleanup;
		}
	};
}
