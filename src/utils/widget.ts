// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/widget.ts
// ❯ @desc Widget component management.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import { sidebarConfig } from "@/config";
// ❯ IMPORTS
import type {
	SidebarConfig,
	WidgetComponentConfig,
	WidgetComponentType,
} from "@/types/config";

// ❯ CONSTANTS
export const WIDGET_COMPONENT_MAP = {
	profile: "@components/sidebar/profile.astro",
	wall: "@components/sidebar/wall.astro",
	categories: "@components/sidebar/categories.astro",
	tags: "@components/sidebar/tags.astro",
	toc: "@components/sidebar/toc.astro",
	statistics: "@components/sidebar/netstat.astro",
	custom: null,
} as const;

// ❯ WIDGET MANAGER
export class WidgetManager {
	private config: SidebarConfig;

	constructor(config: SidebarConfig = sidebarConfig) {
		this.config = config;
	}
	getConfig(): SidebarConfig {
		return this.config;
	}

	// ❯ VISIBILITY
	// ❯ @doc Checks if component should be shown for path.
	shouldShowComponent(
		component: WidgetComponentConfig,
		currentPath?: string,
	): boolean {
		if (!component.visibility || !currentPath) {
			return true;
		}
		const { mode, paths } = component.visibility;
		let normalizedPath = currentPath.startsWith("/")
			? currentPath
			: `/${currentPath}`;
		if (normalizedPath.length > 1 && normalizedPath.endsWith("/")) {
			normalizedPath = normalizedPath.slice(0, -1);
		}

		const matches = paths.some((pattern) => {
			try {
				return new RegExp(pattern).test(normalizedPath);
			} catch (e) {
				console.warn(
					`Invalid regex pattern in component visibility config: ${pattern}`,
					e,
				);
				return false;
			}
		});

		if (mode === "include") {
			return matches;
		}
		if (mode === "exclude") {
			return !matches;
		}
		return true;
	}

	// ❯ COMPONENT QUERIES
	// ❯ @doc Gets components for specified side.
	getComponentsBySide(
		side: "left" | "right",
		currentPath?: string,
	): WidgetComponentConfig[] {
		const components = this.config.components[side] || [];
		if (currentPath) {
			return components.filter((c) => this.shouldShowComponent(c, currentPath));
		}
		return components;
	}
	// ❯ @doc Gets components by position across both sides.
	getComponentsByPosition(
		position: "top" | "sticky",
		currentPath?: string,
	): WidgetComponentConfig[] {
		const left = this.getComponentsBySideAndPosition(
			"left",
			position,
			currentPath,
		);
		const right = this.getComponentsBySideAndPosition(
			"right",
			position,
			currentPath,
		);
		return [...left, ...right];
	}
	// ❯ @doc Gets components by side and position.
	getComponentsBySideAndPosition(
		side: "left" | "right" | "middle",
		position: "top" | "sticky",
		currentPath?: string,
	): WidgetComponentConfig[] {
		const leftComponents = (this.config.components.left || [])
			.filter((c) => c.position === position)
			.filter((c) => this.shouldShowComponent(c, currentPath));
		const rightComponents = (this.config.components.right || [])
			.filter((c) => c.position === position)
			.filter((c) => this.shouldShowComponent(c, currentPath));

		if (side === "left") {
			return [...leftComponents, ...rightComponents];
		}

		if (side === "right") {
			return rightComponents;
		}

		if (side === "middle") {
			return [...leftComponents, ...rightComponents];
		}

		return [];
	}

	// ❯ STYLING
	// ❯ @doc Generates CSS classes for component.
	getComponentClass(
		component: WidgetComponentConfig,
		index: number,
		side: "left" | "right" | "middle",
	): string {
		const classes: string[] = [];

		if (component.responsive?.hidden) {
			component.responsive.hidden.forEach((device) => {
				switch (device) {
					case "mobile":
						classes.push("hidden md:block");
						break;
					case "tablet":
						classes.push("md:hidden lg:block");
						break;
					case "desktop":
						classes.push("lg:hidden");
						break;
				}
			});
		}
		const isFromLeft = (this.config.components.left || []).includes(component);
		const isFromRight = (this.config.components.right || []).includes(
			component,
		);

		if (side === "left") {
			if (isFromRight && !isFromLeft) {
				classes.push("hidden md:block lg:hidden");
			}
		}

		return classes.join(" ");
	}
	// ❯ @doc Generates inline styles for component.
	getComponentStyle(component: WidgetComponentConfig, index: number): string {
		const styles: string[] = [];
		if (component.style) {
			styles.push(component.style);
		}

		return styles.join("; ");
	}
	// ❯ @doc Checks if component should be collapsed.
	isCollapsed(component: WidgetComponentConfig, itemCount: number): boolean {
		if (!component.responsive?.collapseThreshold) {
			return false;
		}
		return itemCount >= component.responsive.collapseThreshold;
	}
	// ❯ @doc Gets component file path by type.
	getComponentPath(componentType: WidgetComponentType): string | null {
		return WIDGET_COMPONENT_MAP[componentType];
	}
	// ❯ @doc Checks if side has visible content.
	hasContentOnSide(
		side: "left" | "right",
		headings: any[] = [],
		currentPath?: string,
	): boolean {
		const components = this.getComponentsBySide(side, currentPath);
		if (components.length === 0) return false;
		return components.some((component) => {
			if (component.type === "toc") {
				return headings && headings.length > 0;
			}
			return true;
		});
	}
	// ❯ CONFIG MANAGEMENT
	// ❯ @doc Updates widget manager config.
	updateConfig(newConfig: Partial<SidebarConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	// ❯ @doc Adds component to specified side.
	addComponent(component: WidgetComponentConfig, side: "left" | "right"): void {
		if (!this.config.components[side]) {
			this.config.components[side] = [];
		}
		this.config.components[side].push(component);
	}
	// ❯ @doc Removes component by type from both sides.
	removeComponent(componentType: WidgetComponentType): void {
		if (this.config.components.left) {
			this.config.components.left = this.config.components.left.filter(
				(component) => component.type !== componentType,
			);
		}
		if (this.config.components.right) {
			this.config.components.right = this.config.components.right.filter(
				(component) => component.type !== componentType,
			);
		}
	}
	// ❯ @doc Reorders component in side list.
	reorderComponent(
		side: "left" | "right",
		oldIndex: number,
		newIndex: number,
	): void {
		const list = this.config.components[side];
		if (!list) return;

		if (
			oldIndex >= 0 &&
			oldIndex < list.length &&
			newIndex >= 0 &&
			newIndex < list.length
		) {
			const [moved] = list.splice(oldIndex, 1);
			list.splice(newIndex, 0, moved);
		}
	}
	isSidebarComponent(componentType: WidgetComponentType): boolean {
		return true;
	}

	// ❯ @doc Extracts page headings from DOM.
	getPageHeadings() {
		if (typeof document === "undefined") return [];
		return Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
			.filter((h) => h.id)
			.map((h) => ({
				depth: Number.parseInt(h.tagName.substring(1), 10),
				slug: h.id,
				text: (h.textContent || "").replace(/#+\s*$/, ""),
			}));
	}
	// ❯ @doc Generates grid layout classes based on content.
	getGridLayout(headings: any[] = [], currentPath?: string) {
		const hasLeftComponents = this.hasContentOnSide(
			"left",
			headings,
			currentPath,
		);
		const hasRightComponents = this.hasContentOnSide(
			"right",
			headings,
			currentPath,
		);
		const hasAnyComponents = hasLeftComponents || hasRightComponents;
		const hasLeftSidebar = hasLeftComponents;
		const hasRightSidebar = hasRightComponents;
		const gridCols = `
            grid-cols-1
            ${hasAnyComponents ? "md:grid-cols-[17.5rem_1fr]" : "md:grid-cols-1"}
            ${
							hasLeftSidebar && hasRightSidebar
								? "lg:grid-cols-[17.5rem_1fr_17.5rem]"
								: hasLeftSidebar
									? "lg:grid-cols-[17.5rem_1fr]"
									: hasRightSidebar
										? "lg:grid-cols-[1fr_17.5rem]"
										: "lg:grid-cols-1"
						}
        `
			.trim()
			.replace(/\s+/g, " ");
		const leftSidebarClass = `
            mb-0 col-span-1 hidden
            ${hasAnyComponents ? "md:block md:max-w-70" : ""}
            ${hasLeftSidebar ? "lg:block lg:max-w-70 lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2" : "lg:hidden"}
        `
			.trim()
			.replace(/\s+/g, " ");
		const rightSidebarClass = `
            mb-0 col-span-1 hidden
            md:hidden
            ${
							hasRightSidebar
								? hasLeftSidebar
									? "lg:block lg:max-w-70 lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-2"
									: "lg:block lg:max-w-70 lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2"
								: "lg:hidden"
						}
        `
			.trim()
			.replace(/\s+/g, " ");
		const mobileFooterClass = `
            footer col-span-1 onload-animation-up block lg:hidden transition-swup-fade
            ${hasAnyComponents ? "md:col-span-2" : "md:col-span-1"}
        `
			.trim()
			.replace(/\s+/g, " ");
		const middleSidebarClass = `
            col-span-1 block md:hidden
            ${!hasAnyComponents ? "hidden" : ""}
        `
			.trim()
			.replace(/\s+/g, " ");
		const mainContentClass = `
            overflow-hidden w-full
            col-span-1 row-start-1 row-end-2
            ${hasAnyComponents ? "md:col-start-2 md:col-end-3 md:row-start-1 md:row-end-2" : "md:col-span-1"}
            ${
							hasLeftSidebar && hasRightSidebar
								? "lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2"
								: hasLeftSidebar
									? "lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2"
									: hasRightSidebar
										? "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2"
										: "lg:col-span-1"
						}
        `
			.trim()
			.replace(/\s+/g, " ");

		return {
			hasLeftSidebar,
			hasRightSidebar,
			hasAnyComponents,
			gridCols,
			leftSidebarClass,
			rightSidebarClass,
			mainContentClass,
			mobileFooterClass,
			middleSidebarClass,
		};
	}
}

// ❯ GLOBAL INSTANCE
export const widgetManager = new WidgetManager();

// ❯ PUBLIC API
// ❯ @doc Gets component config by type.
export function getComponentConfig(
	componentType: WidgetComponentType,
): WidgetComponentConfig | undefined {
	const left = widgetManager.getConfig().components.left || [];
	const right = widgetManager.getConfig().components.right || [];
	return (
		left.find((c) => c.type === componentType) ||
		right.find((c) => c.type === componentType)
	);
}

// ❯ @doc Checks if component type is enabled.
export function isComponentEnabled(
	componentType: WidgetComponentType,
): boolean {
	return !!getComponentConfig(componentType);
}

// ❯ @doc Returns list of enabled component types.
export function getEnabledComponentTypes(): WidgetComponentType[] {
	const enabledComponents = widgetManager
		.getComponentsByPosition("top")
		.concat(widgetManager.getComponentsByPosition("sticky"));
	return enabledComponents.map((c) => c.type);
}
// ❯ @doc Handles click outside panel event.
export function onClickOutside(
	event: MouseEvent,
	panelId: string,
	ignoreIds: string | string[],
	action: () => void,
) {
	if (typeof document === "undefined") {
		return;
	}
	const panel = document.getElementById(panelId);

	const target = event.target as HTMLElement;

	const ids = Array.isArray(ignoreIds) ? ignoreIds : [ignoreIds];
	for (const id of ids) {
		if (target.closest(`#${id}`)) {
			return;
		}
	}
	if (panel && !panel.contains(target)) {
		action();
	}
}
