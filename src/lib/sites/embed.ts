export type EmbedProvider = 'youtube' | 'vimeo' | 'x' | 'twitch';

export type EmbedReference = {
	provider: EmbedProvider;
	sourceUrl: string;
	contentId: string;
};

const youtubeId = /^[A-Za-z0-9_-]{6,20}$/;
const vimeoId = /^\d{5,15}$/;
const socialHandle = /^[A-Za-z0-9_]{1,30}$/;
const numericPostId = /^\d{5,24}$/;
const twitchSlug = /^[A-Za-z0-9_-]{4,100}$/;

function parseYouTube(url: URL): EmbedReference | null {
	const host = url.hostname.toLowerCase();
	let contentId = '';
	if (host === 'youtu.be') contentId = url.pathname.split('/').filter(Boolean)[0] ?? '';
	if (
		[
			'youtube.com',
			'www.youtube.com',
			'm.youtube.com',
			'youtube-nocookie.com',
			'www.youtube-nocookie.com'
		].includes(host)
	) {
		if (url.pathname === '/watch') contentId = url.searchParams.get('v') ?? '';
		else if (/^\/(embed|shorts|live)\//.test(url.pathname)) {
			contentId = url.pathname.split('/').filter(Boolean)[1] ?? '';
		}
	}
	if (!youtubeId.test(contentId)) return null;
	return {
		provider: 'youtube',
		contentId,
		sourceUrl: `https://www.youtube.com/watch?v=${contentId}`
	};
}

function parseVimeo(url: URL): EmbedReference | null {
	const host = url.hostname.toLowerCase();
	if (!['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) return null;
	const parts = url.pathname.split('/').filter(Boolean);
	const contentId = host === 'player.vimeo.com' && parts[0] === 'video' ? parts[1] : parts[0];
	if (!contentId || !vimeoId.test(contentId)) return null;
	return { provider: 'vimeo', contentId, sourceUrl: `https://vimeo.com/${contentId}` };
}

function parseX(url: URL): EmbedReference | null {
	const host = url.hostname.toLowerCase();
	if (!['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(host)) return null;
	const [handle, segment, contentId] = url.pathname.split('/').filter(Boolean);
	if (
		!socialHandle.test(handle ?? '') ||
		segment !== 'status' ||
		!numericPostId.test(contentId ?? '')
	) {
		return null;
	}
	return { provider: 'x', contentId, sourceUrl: `https://x.com/${handle}/status/${contentId}` };
}

function parseTwitch(url: URL): EmbedReference | null {
	const host = url.hostname.toLowerCase();
	const parts = url.pathname.split('/').filter(Boolean);
	if (host === 'clips.twitch.tv' && twitchSlug.test(parts[0] ?? '')) {
		return {
			provider: 'twitch',
			contentId: `clip:${parts[0]}`,
			sourceUrl: `https://clips.twitch.tv/${parts[0]}`
		};
	}
	if (!['twitch.tv', 'www.twitch.tv'].includes(host)) return null;
	if (parts[0] === 'videos' && numericPostId.test(parts[1] ?? '')) {
		return {
			provider: 'twitch',
			contentId: `video:${parts[1]}`,
			sourceUrl: `https://www.twitch.tv/videos/${parts[1]}`
		};
	}
	if (socialHandle.test(parts[0] ?? '') && parts[1] === 'clip' && twitchSlug.test(parts[2] ?? '')) {
		return {
			provider: 'twitch',
			contentId: `clip:${parts[2]}`,
			sourceUrl: `https://www.twitch.tv/${parts[0]}/clip/${parts[2]}`
		};
	}
	return null;
}

export function parseEmbedUrl(value: string): EmbedReference | null {
	const trimmed = value.trim();
	if (!trimmed || trimmed.length > 800) return null;
	let url: URL;
	try {
		url = new URL(trimmed);
	} catch {
		return null;
	}
	if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
	return parseYouTube(url) ?? parseVimeo(url) ?? parseX(url) ?? parseTwitch(url);
}

export function embedProviderLabel(provider: EmbedProvider): string {
	return { youtube: 'YouTube', vimeo: 'Vimeo', x: 'X post', twitch: 'Twitch' }[provider];
}

export function getEmbedPreviewUrl(embed: EmbedReference): string | null {
	if (embed.provider === 'youtube') {
		return `https://www.youtube-nocookie.com/embed/${embed.contentId}`;
	}
	if (embed.provider === 'vimeo') return `https://player.vimeo.com/video/${embed.contentId}`;
	return null;
}

export function isEmbedReference(value: unknown): value is EmbedReference {
	if (!value || typeof value !== 'object') return false;
	const candidate = value as Partial<EmbedReference>;
	if (
		!['youtube', 'vimeo', 'x', 'twitch'].includes(candidate.provider ?? '') ||
		typeof candidate.sourceUrl !== 'string' ||
		typeof candidate.contentId !== 'string'
	) {
		return false;
	}
	const normalized = parseEmbedUrl(candidate.sourceUrl);
	return Boolean(
		normalized &&
		normalized.provider === candidate.provider &&
		normalized.contentId === candidate.contentId
	);
}
