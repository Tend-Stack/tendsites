import { describe, expect, it } from 'vitest';

import { embedProviderLabel, getEmbedPreviewUrl, isEmbedReference, parseEmbedUrl } from './embed';

describe('reviewed media embeds', () => {
	it.each([
		['https://youtu.be/dQw4w9WgXcQ', 'youtube', 'dQw4w9WgXcQ'],
		['https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share', 'youtube', 'dQw4w9WgXcQ'],
		['https://vimeo.com/76979871', 'vimeo', '76979871'],
		['https://x.com/tend_stack/status/1234567890123456789', 'x', '1234567890123456789'],
		['https://www.twitch.tv/videos/123456789', 'twitch', 'video:123456789'],
		['https://clips.twitch.tv/FriendlyClip_12', 'twitch', 'clip:FriendlyClip_12']
	])('normalizes %s as typed evidence', (source, provider, contentId) => {
		expect(parseEmbedUrl(source)).toMatchObject({ provider, contentId });
	});

	it('uses privacy-enhanced, responsive-capable player URLs only for reviewed video providers', () => {
		const youtube = parseEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')!;
		const xPost = parseEmbedUrl('https://x.com/tend_stack/status/1234567890123456789')!;
		expect(getEmbedPreviewUrl(youtube)).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
		expect(getEmbedPreviewUrl(xPost)).toBeNull();
		expect(embedProviderLabel(xPost.provider)).toBe('X post');
	});

	it.each([
		'javascript:alert(1)',
		'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
		'https://youtube.example/watch?v=dQw4w9WgXcQ',
		'https://user:secret@youtube.com/watch?v=dQw4w9WgXcQ',
		'https://x.com/tend_stack/not-a-status/123456789',
		'https://www.twitch.tv/directory'
	])('rejects unsupported or unsafe source %s', (source) => {
		expect(parseEmbedUrl(source)).toBeNull();
	});

	it('revalidates persisted evidence instead of trusting duplicated fields', () => {
		const embed = parseEmbedUrl('https://vimeo.com/76979871')!;
		expect(isEmbedReference(embed)).toBe(true);
		expect(isEmbedReference({ ...embed, contentId: '99999999' })).toBe(false);
		expect(isEmbedReference({ ...embed, sourceUrl: 'https://example.com/76979871' })).toBe(false);
	});
});
