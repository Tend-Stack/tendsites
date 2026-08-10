import { mount, unmount } from 'svelte';

import SitesApp from '../lib/sites/SitesApp.svelte';

type ExtensionHost = {
	id: string;
	storage?: {
		get(key: string): Promise<unknown>;
		set(key: string, value: unknown): Promise<void>;
		delete(key: string): Promise<void>;
	};
	onUnmount(callback: () => void): void;
};

function ensureStylesheet(): void {
	const id = 'host-tend-sites-styles';
	if (document.getElementById(id)) return;

	const stylesheet = document.createElement('link');
	stylesheet.id = id;
	stylesheet.rel = 'stylesheet';
	const moduleUrl = import.meta.url;
	stylesheet.href = new URL('./style.css', moduleUrl).href;
	document.head.append(stylesheet);
}

export default function activate(host: ExtensionHost) {
	return {
		mount(container: HTMLElement) {
			ensureStylesheet();
			const app = mount(SitesApp, {
				target: container,
				props: { embedded: true, storage: host.storage }
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
