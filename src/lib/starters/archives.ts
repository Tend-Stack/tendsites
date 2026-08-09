import { z } from 'zod';
import { IdentifierSchema, RelativeProjectPathSchema, Sha256HexSchema } from '../contracts/sites';

const packageJson =
	'{"name":"tend-site","private":true,"type":"module","scripts":{"build":"vite build"},"dependencies":{"@sveltejs/kit":"^2.0.0","svelte":"^5.0.0"},"devDependencies":{"@sveltejs/adapter-static":"^3.0.0","vite":"^7.0.0"}}';
const tendSiteJson =
	'{"schema":1,"adapter":"sveltekit","content":{"pages":"src/content/pages","posts":"src/content/posts"},"media":{"provider":"repository","directory":"static/media","publicPath":"/media"},"i18n":{"defaultLocale":"en","locales":["en"],"strategy":"multiple_folders"},"build":{"script":"build","output":"build"}}';

const StarterSourceFileSchema = z
	.object({
		path: RelativeProjectPathSchema,
		content: z.string().min(1).max(100_000),
		sha256: Sha256HexSchema
	})
	.strict();
export const StarterArchiveSchema = z
	.object({
		contract: z.literal('tend.host/sites-starter-archive/v1'),
		templateId: IdentifierSchema,
		revisionSha256: Sha256HexSchema,
		files: z.array(StarterSourceFileSchema).min(3).max(100)
	})
	.strict()
	.refine(
		(archive) => new Set(archive.files.map((file) => file.path)).size === archive.files.length,
		'Starter paths must be unique'
	);
export type StarterArchive = z.infer<typeof StarterArchiveSchema>;

const pages = {
	minimal: [
		'<script lang="ts">const title = "Welcome";</script><svelte:head><title>{title}</title></svelte:head><main><h1>{title}</h1><p>Your site is ready.</p></main>',
		'9d2ad93e05d863bfc7dc3fa142ce5698dca73a10d10d653196509068363266fd',
		'bc191715c3bf414bb5eba0228b3eb8ede704a52a99ef5073244285f932787fef'
	],
	editorial: [
		'<script lang="ts">const title = "Field Notes";</script><svelte:head><title>{title}</title></svelte:head><main><p>JOURNAL</p><h1>{title}</h1><p>Stories worth keeping.</p></main>',
		'039feaa2bc98c2939ffa493b354941e13719be626efa2bfcfb70efaa2f83eabb',
		'0c576ab1188fc41d67429922b93bc7f50d0604182c01df473afe67f5ebc626f4'
	],
	studio: [
		'<script lang="ts">const title = "Selected Work";</script><svelte:head><title>{title}</title></svelte:head><main><h1>{title}</h1><p>Projects, process, and practice.</p></main>',
		'21b0a13c82328a556097b68ec1b69c60211e896d80a17ced38da72b6dd207505',
		'ba7accd3fd430ebe3c072ae0152c1856ef397b199701cf051a8e152f250e7c48'
	],
	docs: [
		'<script lang="ts">const title = "Documentation";</script><svelte:head><title>{title}</title></svelte:head><main><nav>Guides</nav><article><h1>{title}</h1><p>Start here.</p></article></main>',
		'ed2a4e514b3b5c449197475ec161e66f6be54a520eb35a8d21e66ac26b57c007',
		'57a8a2213707b94fa9c2eb1636db16331bfd1faa438ecf21931c664b4e96027b'
	]
} as const;

export const starterArchives: Readonly<Record<keyof typeof pages, StarterArchive>> =
	Object.fromEntries(
		Object.entries(pages).map(([templateId, [content, pageSha256, revisionSha256]]) => [
			templateId,
			StarterArchiveSchema.parse({
				contract: 'tend.host/sites-starter-archive/v1',
				templateId,
				revisionSha256,
				files: [
					{
						path: 'package.json',
						content: packageJson,
						sha256: 'eedd5ddbb807092f1690275606fdab40ad0521bb06f4c916954a45afbec58195'
					},
					{
						path: 'tend.site.json',
						content: tendSiteJson,
						sha256: 'c42c971a96f3c65c4ac7cdfbf486e6cba6cdf0ba26fe74c8f3c3412d41330a22'
					},
					{ path: 'src/routes/+page.svelte', content, sha256: pageSha256 }
				]
			})
		])
	) as Record<keyof typeof pages, StarterArchive>;

async function sha256(value: string): Promise<string> {
	const bytes = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyStarterArchive(input: StarterArchive): Promise<StarterArchive> {
	const archive = StarterArchiveSchema.parse(input);
	for (const file of archive.files)
		if ((await sha256(file.content)) !== file.sha256)
			throw new Error(`Starter file digest mismatch: ${file.path}`);
	const canonical = [...archive.files]
		.sort((left, right) => left.path.localeCompare(right.path))
		.map((file) => `${file.path}:${file.sha256}`)
		.join('\n');
	if ((await sha256(canonical)) !== archive.revisionSha256)
		throw new Error('Starter revision digest mismatch');
	return archive;
}
