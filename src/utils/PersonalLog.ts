// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/PersonalLog.ts
// ❯ @desc PersonalLog moment data loading utilities.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
const PersonalLogModules = import.meta.glob(
	"../content/PersonalLog/**/*.json",
	{ eager: true },
);

// ❯ TYPES
export interface Moment {
	id: string;
	title?: string;
	content: string;
	date: string;
	images?: string[];
	basePath?: string;
}

// ❯ DATA LOADING
export const moments: Moment[] = Object.entries(PersonalLogModules).map(
	([path, mod]: [string, any]) => {
		const id = path.split("/").pop()?.replace(".json", "") || "";
		const data = mod.default as any;
		const basePath = path.replace("../", "").replace(/\/[^/]+$/, "");

		const moment: Moment = {
			id,
			...data,
			basePath,
		};
		return moment;
	},
);

// ❯ DATA PROCESSING
export const sortedMoments = [...moments].sort(
	(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
);

