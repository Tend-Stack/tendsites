import { describe, expect, it } from 'vitest';

import { canonicalJson, sha256CanonicalJson } from './canonical';

describe('canonical JSON', () => {
	it('sorts object keys while preserving array order', async () => {
		const left = { z: [2, 1], a: { y: true, x: null } };
		const right = { a: { x: null, y: true }, z: [2, 1] };
		expect(canonicalJson(left)).toBe('{"a":{"x":null,"y":true},"z":[2,1]}');
		expect(await sha256CanonicalJson(left)).toBe(await sha256CanonicalJson(right));
	});

	it.each([undefined, Number.NaN, Number.POSITIVE_INFINITY, new Date(), { value: undefined }])(
		'rejects non-JSON input %#',
		(value) => expect(() => canonicalJson(value as never)).toThrow()
	);

	it('normalizes negative zero', () => {
		expect(canonicalJson({ value: -0 })).toBe('{"value":0}');
	});
});
