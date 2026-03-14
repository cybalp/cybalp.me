// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/arge.ts
// ❯ @desc AR-GE data management.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ DATA LOADING
// ❯ @hint load from content/arge
const projectModules = import.meta.glob("../content/arge/**/*.json", {
	eager: true,
});

// ❯ TYPES
export interface Project {
	id: string;
	title: string;
	description: string;
	image: string;
	category: "library" | "ai" | "software" | "website" | "game";
	techStack: string[];
	status: "completed" | "in-progress" | "planned";
	demoUrl?: string;
	sourceUrl?: string;
	startDate: string;
	endDate?: string;
	featured?: boolean;
	tags?: string[];
	basePath?: string;
}

// ❯ DATA EXPORT
export const projectsData: Project[] = Object.entries(projectModules).map(
	([path, mod]: [string, any]) => {
		const id = path.split("/").pop()?.replace(".json", "") || "";
		const data = mod.default as any;
		const basePath = path.replace("../", "").replace(/\/[^/]+$/, "");

		const project: Project = {
			id,
			...data,
			demoUrl: data.demoUrl ?? data.liveDemo,
			sourceUrl: data.sourceUrl ?? data.sourceCode,
			basePath,
		};
		return project;
	},
);

// ❯ QUERY FUNCTIONS
// ❯ @doc Calculates project statistics.
export const getProjectStats = () => {
	const total = projectsData.length;
	const completed = projectsData.filter((p) => p.status === "completed").length;
	const inProgress = projectsData.filter(
		(p) => p.status === "in-progress",
	).length;
	const planned = projectsData.filter((p) => p.status === "planned").length;
	return {
		total,
		byStatus: {
			completed,
			inProgress,
			planned,
		},
	};
};

// ❯ @doc Filters projects by category.
export const getProjectsByCategory = (category?: string) => {
	if (!category || category === "all") {
		return projectsData;
	}
	return projectsData.filter((p) => p.category === category);
};

// ❯ @doc Returns featured projects.
export const getFeaturedProjects = () => {
	return projectsData.filter((p) => p.featured);
};

// ❯ @doc Returns unique tech stack list.
export const getAllTechStack = () => {
	const techSet = new Set<string>();
	projectsData.forEach((project) => {
		project.techStack.forEach((tech) => techSet.add(tech));
	});
	return Array.from(techSet).sort();
};
