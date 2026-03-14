// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/media.ts
// ❯ @desc Album data loading and processing utilities.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
const albumModules = import.meta.glob("../content/media/**/*.json", {
	eager: true,
});

// ❯ TYPES
export interface Photo {
	src: string;
	alt?: string;
	title?: string;
	description?: string;
	tags?: string[];
	date?: string;
	width?: number;
	height?: number;
	downloadable?: boolean;
}

export interface AlbumGroup {
	id: string;
	title: string;
	description?: string;
	cover: string;
	date: string;
	location?: string;
	url?: string;
	tags?: string[];
	layout?: "grid" | "masonry" | "list";
	columns?: number;
	// @docs When set, the gallery grid shows photos in batches of this size with a "Show more" button.
	//       Fancybox gallery only includes currently visible photos (re-evaluated on each click).
	pageSize?: number;
	photos: Photo[];
	visible?: boolean;
	basePath?: string;
}

// ❯ DATA LOADING
export const albums: AlbumGroup[] = Object.entries(albumModules).map(
	([path, mod]: [string, any]) => {
		const id = path.split("/").pop()?.replace(".json", "") || "";
		const data = mod.default as any;
		const basePath = path.replace("../", "").replace(/\/[^/]+$/, "");

		const album: AlbumGroup = {
			id,
			...data,
			photos: data.photos || [],
			visible: data.visible !== false,
			basePath,
		};
		return album;
	},
);

// ❯ DATA PROCESSING
export const sortedAlbums = [...albums].sort(
	(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);
