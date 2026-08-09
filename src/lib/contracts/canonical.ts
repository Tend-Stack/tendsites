import type { JsonValue } from './sites';

function serialize(value: unknown): string {
	if (value === null || typeof value === 'string' || typeof value === 'boolean') {
		return JSON.stringify(value);
	}
	if (typeof value === 'number') {
		if (!Number.isFinite(value)) throw new Error('Canonical JSON forbids non-finite numbers');
		return JSON.stringify(Object.is(value, -0) ? 0 : value);
	}
	if (Array.isArray(value)) return `[${value.map(serialize).join(',')}]`;
	if (typeof value !== 'object') throw new Error('Value is not canonical JSON');
	const prototype = Object.getPrototypeOf(value);
	if (prototype !== Object.prototype && prototype !== null) {
		throw new Error('Canonical JSON accepts plain objects only');
	}
	if (Reflect.ownKeys(value).some((key) => typeof key !== 'string')) {
		throw new Error('Canonical JSON forbids symbol keys');
	}
	const object = value as Record<string, unknown>;
	return `{${Object.keys(object)
		.sort()
		.map((key) => `${JSON.stringify(key)}:${serialize(object[key])}`)
		.join(',')}}`;
}

export function canonicalJson(value: JsonValue): string {
	return serialize(value);
}

export async function sha256CanonicalJson(value: JsonValue): Promise<string> {
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(canonicalJson(value))
	);
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
