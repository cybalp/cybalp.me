// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/timeline.ts
// ❯ @desc Timeline data management.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ DATA LOADING
// ❯ @hint load from content/timeline
const timelineModules = import.meta.glob("../content/timeline/*.json", {
	eager: true,
});

// ❯ TYPES
export interface TimelineItem {
	id: string;
	title: string;
	description: string;
	type: "education" | "work" | "project" | "achievement";
	startDate: string;
	endDate?: string;
	location?: string;
	organization?: string;
	position?: string;
	skills?: string[];
	achievements?: string[];
	links?: {
		name: string;
		url: string;
		type: "certificate" | "project" | "other";
	}[];
	icon?: string;
	color?: string;
	featured?: boolean;
}

// ❯ DATA EXPORT
export const timelineData: TimelineItem[] = Object.entries(timelineModules).map(
	([path, mod]: [string, any]) => {
		const id = path.split("/").pop()?.replace(".json", "") || "";
		const data = mod.default;
		return { id, ...data } as TimelineItem;
	},
);

// ❯ QUERY FUNCTIONS
// ❯ @doc Calculates timeline statistics.
export const getTimelineStats = () => {
	const total = timelineData.length;
	const byType = {
		education: timelineData.filter((item) => item.type === "education").length,
		work: timelineData.filter((item) => item.type === "work").length,
		project: timelineData.filter((item) => item.type === "project").length,
		achievement: timelineData.filter((item) => item.type === "achievement")
			.length,
	};
	return { total, byType };
};

// ❯ @doc Filters timeline by type, sorted by date.
export const getTimelineByType = (type?: string) => {
	if (!type || type === "all") {
		return timelineData.sort(
			(a, b) =>
				new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
		);
	}
	return timelineData
		.filter((item) => item.type === type)
		.sort(
			(a, b) =>
				new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
		);
};

// ❯ @doc Returns featured timeline items.
export const getFeaturedTimeline = () => {
	return timelineData
		.filter((item) => item.featured)
		.sort(
			(a, b) =>
				new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
		);
};

// ❯ @doc Returns ongoing items without end date.
export const getCurrentItems = () => {
	return timelineData.filter((item) => !item.endDate);
};

// ❯ @doc Calculates total work experience in months.
export const getTotalWorkExperience = () => {
	const workItems = timelineData.filter((item) => item.type === "work");
	let totalMonths = 0;
	workItems.forEach((item) => {
		const startDate = new Date(item.startDate);
		const endDate = item.endDate ? new Date(item.endDate) : new Date();
		const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
		const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
		totalMonths += diffMonths;
	});
	return {
		years: Math.floor(totalMonths / 12),
		months: totalMonths % 12,
	};
};
