// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/skills.ts
// ❯ @desc Skills data management.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ DATA LOADING
// ❯ @hint load from content/toolchains
const skillModules = import.meta.glob("../content/toolchains/*.json", {
	eager: true,
});

// ❯ TYPES
export interface Skill {
	id: string;
	name: string;
	description: string;
	icon: string;
	category:
		| "cybersecurity"
		| "backend"
		| "frontend"
		| "area-of-interest"
		| "others";
	level: "beginner" | "intermediate" | "advanced" | "expert";
	experience: {
		years: number;
		months: number;
	};
	projects?: string[];
	certifications?: string[];
	color?: string;
}

// ❯ DATA EXPORT
export const skillsData: Skill[] = Object.entries(skillModules).map(
	([path, mod]: [string, any]) => {
		const id = path.split("/").pop()?.replace(".json", "") || "";
		const data = mod.default;
		return { id, ...data } as Skill;
	},
);

// ❯ QUERY FUNCTIONS
// ❯ @doc Calculates skill statistics.
export const getSkillStats = () => {
	const total = skillsData.length;
	const byLevel = {
		beginner: skillsData.filter((s) => s.level === "beginner").length,
		intermediate: skillsData.filter((s) => s.level === "intermediate").length,
		advanced: skillsData.filter((s) => s.level === "advanced").length,
		expert: skillsData.filter((s) => s.level === "expert").length,
	};
	const byCategory = {
		cybersecurity: skillsData.filter((s) => s.category === "cybersecurity")
			.length,
		backend: skillsData.filter((s) => s.category === "backend").length,
		frontend: skillsData.filter((s) => s.category === "frontend").length,
		"area-of-interest": skillsData.filter(
			(s) => s.category === "area-of-interest",
		).length,
		others: skillsData.filter((s) => s.category === "others").length,
	};
	return { total, byLevel, byCategory };
};

// ❯ @doc Filters skills by category.
export const getSkillsByCategory = (category?: string) => {
	if (!category || category === "all") {
		return skillsData;
	}
	return skillsData.filter((s) => s.category === category);
};

// ❯ @doc Returns advanced and expert level skills.
export const getAdvancedSkills = () => {
	return skillsData.filter(
		(s) => s.level === "advanced" || s.level === "expert",
	);
};

// ❯ @doc Calculates total experience across all skills.
export const getTotalExperience = () => {
	const totalMonths = skillsData.reduce((total, skill) => {
		const years = skill.experience.years || 0;
		const months = skill.experience.months || 0;
		return total + years * 12 + months;
	}, 0);
	return {
		years: Math.floor(totalMonths / 12),
		months: totalMonths % 12,
	};
};
