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

export type HostMediaBridge = {
	listImageLibraries(): Promise<HostImageLibrary[]>;
	listImages(
		libraryId: string,
		options?: { query?: string; cursor?: string | null }
	): Promise<HostImagePage>;
};
