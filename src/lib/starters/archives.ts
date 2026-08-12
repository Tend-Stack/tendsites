import { z } from 'zod';
import { IdentifierSchema, RelativeProjectPathSchema, Sha256HexSchema } from '../contracts/sites';
import appHtml from './runtime/src/app.html?raw';
import layoutJs from './runtime/src/routes/+layout.js?raw';
import docsPage from './runtime/pages/docs.svelte?raw';
import editorialPage from './runtime/pages/editorial.svelte?raw';
import minimalPage from './runtime/pages/minimal.svelte?raw';
import studioPage from './runtime/pages/studio.svelte?raw';
import packageJson from './runtime/package.json?raw';
import packageLock from './runtime/package-lock.json?raw';
import svelteConfig from './runtime/svelte.config.js?raw';
import viteConfig from './runtime/vite.config.js?raw';

const tendSiteJson =
	'{"schema":1,"adapter":"sveltekit","content":{"pages":"src/content/pages","posts":"src/content/posts"},"media":{"provider":"repository","directory":"static/media","publicPath":"/media"},"i18n":{"defaultLocale":"en","locales":["en"],"strategy":"multiple_folders"},"build":{"script":"build","output":"build"}}';

const runtimeFiles = [
	{
		path: 'package.json',
		content: packageJson,
		sha256: '0e1d601e6a35463dc2932dfd708ec6fb958a7b64f00a2dfcde920519d5fff580'
	},
	{
		path: 'package-lock.json',
		content: packageLock,
		sha256: 'c4575b5b29a14d35442201a1dd32afe6eba4cd71fc6d74dac52714e3077f1b85'
	},
	{
		path: 'svelte.config.js',
		content: svelteConfig,
		sha256: '0085d4b1d28d2258afeefaff5ff7f51637e57c9a294875a213512fed5782310e'
	},
	{
		path: 'vite.config.js',
		content: viteConfig,
		sha256: '57fab6695036bdec420fc24934ecc4cf5344ac2723a6ce0e2728a66ad96785b8'
	},
	{
		path: 'src/app.html',
		content: appHtml,
		sha256: 'e1aa9a12e3b6a9b60e76c6bd62dd35b7df836a5fd0e2599fb75db490ff132435'
	},
	{
		path: 'src/routes/+layout.js',
		content: layoutJs,
		sha256: '30eec0a0e67c08341a51c51fa019afb5f4815eec5a183501f2e39d5da1c4e67d'
	},
	{
		path: 'tend.site.json',
		content: tendSiteJson,
		sha256: 'c42c971a96f3c65c4ac7cdfbf486e6cba6cdf0ba26fe74c8f3c3412d41330a22'
	}
] as const;

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
		minimalPage,
		'e5e78c37d6cc63609af46a77e1ba54c0b15f029a5d97328737105cb872ac112c',
		'dbb46e269a1a639d14691810235a443508f03946d88cad54fb7522a6a7e51fd1'
	],
	editorial: [
		editorialPage,
		'fdce6765cca696626daa4e9e069d9d1de61d9a3bcb74829bdd120d4a6cb75a8b',
		'2d0235c37b6166f7bc4590c5fe2e6e293aaf641f7c6d7f9171939a93e9ccffbc'
	],
	studio: [
		studioPage,
		'16b28cf3b50ecf527b9cbd2f899564bc874d67a48bd6704d46fbb7d7cfda7dd9',
		'47746a646705361d54304ef32838d37b3d2844ca1ed9b13142eecb4610b8549d'
	],
	docs: [
		docsPage,
		'3d3cbf2ecd97e1c154032bb1eae8156079c1a7db7567b876c5edbb78fdbd827c',
		'931d596391e97c43e2e9676727a4c887f11a2140b148f928c30ec2c3a28f1847'
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
					...runtimeFiles,
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
