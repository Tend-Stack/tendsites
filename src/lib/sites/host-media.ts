export type HostImageLibrary = {
	id: string;
	name: string;
	itemCount: number;
};

export type HostImageItem = {
	id: string;
	libraryId: string;
	name: string;
	mimeType: string | null;
	size: number | null;
	modifiedAt: number | null;
	description: string;
	thumbnailUrl: string;
	contentUrl: string;
};

export type HostImagePage = {
	items: HostImageItem[];
	total: number;
	nextCursor: string | null;
};

export type HostImagePreparationRecipe = {
	width: number;
	height: number;
	fit: 'cover' | 'contain';
	focalX: number;
	focalY: number;
	zoom: number;
	quality: number;
	maxBytes: number;
	background?: string;
};

export type HostPreparedImage = {
	dataUrl: string;
	mimeType: 'image/webp';
	size: number;
	width: number;
	height: number;
	originalName: string;
	originalSize: number;
};

export type HostMediaBridge = {
	listImageLibraries(): Promise<HostImageLibrary[]>;
	listImages(
		libraryId: string,
		options?: { query?: string; cursor?: string | null }
	): Promise<HostImagePage>;
	prepareImage?(file: File, recipe: HostImagePreparationRecipe): Promise<HostPreparedImage>;
};
