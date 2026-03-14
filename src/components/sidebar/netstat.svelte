<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/sidebar/netstat.svelte
// ❯ @desc Netstat charts component with ECharts.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import Icon from "@components/common/icon.svelte";
import { BREAKPOINT_LG } from "@constants/breakpoints";
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { navigateToPage } from "@utils/navigation";
import { getCategoryUrl, getTagUrl } from "@utils/url";
import dayjs from "dayjs";
// ❯ IMPORTS
import { onMount } from "svelte";

// ❯ PROPS
let {
	posts = [],
	categories = [],
	tags = [],
	class: className = "",
	style = "",
	side = "default",
}: {
	posts?: any[];
	categories?: any[];
	tags?: any[];
	class?: string;
	style?: string;
	side?: string;
} = $props();

// ❯ CONFIGURATION
const labels = {
	year: i18n(I18nKey.year),
	month: i18n(I18nKey.month),
	day: i18n(I18nKey.day),
	posts: i18n(I18nKey.posts),
	activities: "Activities",
	categories: i18n(I18nKey.categories),
	tags: i18n(I18nKey.tags),
	statistics: i18n(I18nKey.statistics),
};

// ❯ STATE
let container = $state<HTMLDivElement>();
let heatmapContainer = $state<HTMLDivElement>();
let categoriesContainer = $state<HTMLDivElement>();
let tagsContainer = $state<HTMLDivElement>();
let echarts: any = $state();
let heatmapChart: any = $state();
let categoriesChart: any = $state();
let tagsChart: any = $state();

let timeScale: "year" | "month" | "day" = $state("year");
let lastScale = $state<"year" | "month" | "day">("year");
let isDark = $state(false);
let isDesktop = $state(true);
let isLoading = $state(false);
let gradientOffset = $state(0);
let gradientInterval: any = $state(null);
let simulationInterval: any = $state(null);

// ❯ UTILITIES
// ❯ @doc Updates desktop state based on window width.
const updateIsDesktop = () => {
	if (typeof window !== "undefined") {
		isDesktop = window.innerWidth >= BREAKPOINT_LG;
	}
};

// ❯ @doc Gets theme colors based on dark mode.
const getThemeColors = () => {
	const isDarkNow = document.documentElement.classList.contains("dark");
	return {
		text: isDarkNow ? "#e5e7eb" : "#374151",
		primary: isDarkNow ? "#60a5fa" : "#3b82f6", // Use standard hex for primary to avoid oklch issues in ECharts
		grid: isDarkNow ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
		areaStart: isDarkNow
			? "rgba(96, 165, 250, 0.5)"
			: "rgba(59, 130, 246, 0.5)",
		areaEnd: isDarkNow ? "rgba(96, 165, 250, 0)" : "rgba(59, 130, 246, 0)",
	};
};

// ❯ @doc Gets font family for charts.
const getChartsFontFamily = () => {
	const fallback =
		"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif";
	if (typeof window === "undefined") return fallback;
	const target = container ?? document.body ?? document.documentElement;
	const fontFamily = window.getComputedStyle(target).fontFamily;
	return fontFamily && fontFamily !== "inherit" ? fontFamily : fallback;
};

// ❯ ECHARTS LOADING
// ❯ @doc Dynamically loads ECharts with tree shaking.
const loadECharts = async () => {
	if (typeof window === "undefined") return;
	isDark = document.documentElement.classList.contains("dark");

	// ❯ dynamically import ECharts with tree shaking
	const echartsCore = await import("echarts/core");
	const { LineChart, RadarChart, BarChart, PieChart } = await import(
		"echarts/charts"
	);
	const { TitleComponent, TooltipComponent, GridComponent, LegendComponent } =
		await import("echarts/components");
	const { SVGRenderer } = await import("echarts/renderers");

	// ❯ register components
	echartsCore.use([
		LineChart,
		RadarChart,
		BarChart,
		PieChart,
		TitleComponent,
		TooltipComponent,
		GridComponent,
		LegendComponent,
		SVGRenderer,
	]);

	echarts = echartsCore;
};

// ❯ CHART INITIALIZATION
let isInitialized = $state(false);

// ❯ @doc Initializes all charts.
const initCharts = () => {
	if (isInitialized) return;
	initActivityChart();
	if (isDesktop) initRadarCharts();
	isInitialized = true;
	startLiveEffects();
	// Force update chart after initialization to ensure all years are shown
	setTimeout(() => {
		if (heatmapChart && timeScale === "year") {
			initActivityChart(true);
		}
	}, 100);
};

// ❯ @doc Starts live effects for Activities chart.
const startLiveEffects = () => {
	// ❯ Clear existing intervals
	if (gradientInterval) clearInterval(gradientInterval);
	if (simulationInterval) clearInterval(simulationInterval);

	// ❯ Gradient animation (slower, less jittery)
	gradientInterval = setInterval(() => {
		gradientOffset = (gradientOffset + 0.05) % 1;
		if (heatmapChart && isInitialized) {
			const colors = getThemeColors();
			const gradientColor = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
				{ offset: 0, color: colors.areaStart },
				{ offset: 0.5 + gradientOffset * 0.05, color: colors.areaStart },
				{ offset: 1, color: colors.areaEnd },
			]);
			heatmapChart.setOption(
				{
					series: [
						{
							areaStyle: { color: gradientColor },
						},
					],
				},
				false,
			);
		}
	}, 300); // Slower update interval

	// ❯ Real-time data simulation removed to reduce jitter
};

// ❯ @doc Initializes activity line chart with live effects.
const initActivityChart = (isUpdate = false) => {
	if (!heatmapContainer || !echarts) return;

	// ❯ try to get existing instance for Swup persistence
	const existingChart = echarts.getInstanceByDom(heatmapContainer);
	const isNew = !existingChart;
	if (existingChart) {
		heatmapChart = existingChart;
	} else {
		heatmapChart = echarts.init(heatmapContainer, isDark ? "dark" : null, {
			renderer: "svg",
		});
	}

	const colors = getThemeColors();
	const fontFamily = getChartsFontFamily();

	const now = dayjs();
	let data: any[] = [];
	let xAxisData: string[] = [];

	if (timeScale === "year") {
		// Show years from 2024 to current year (including years with no posts)
		const currentYear = now.year();
		const startYear = 2024;

		for (let year = startYear; year <= currentYear; year++) {
			const yearStr = year.toString();
			xAxisData.push(yearStr);
			const count = posts
				? posts.filter((p) => {
						if (!p || !p.data || !p.data.published) return false;
						return dayjs(p.data.published).year() === year;
					}).length
				: 0;
			data.push(count);
		}
	} else if (timeScale === "month") {
		// Last 12 months
		for (let i = 11; i >= 0; i--) {
			const month = now.subtract(i, "month");
			const monthStr = month.format("YYYY-MM");
			xAxisData.push(month.format("MMM"));
			const count = posts.filter(
				(p) => dayjs(p.data.published).format("YYYY-MM") === monthStr,
			).length;
			data.push(count);
		}
	} else {
		// Last 30 days
		for (let i = 29; i >= 0; i--) {
			const day = now.subtract(i, "day");
			const dayStr = day.format("YYYY-MM-DD");
			xAxisData.push(day.format("DD"));
			const count = posts.filter(
				(p) => dayjs(p.data.published).format("YYYY-MM-DD") === dayStr,
			).length;
			data.push(count);
		}
	}

	// ❯ Animated gradient with offset
	const gradientColor = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
		{ offset: 0, color: colors.areaStart },
		{ offset: 0.5 + gradientOffset * 0.1, color: colors.areaStart },
		{ offset: 1, color: colors.areaEnd },
	]);

	const maxValue = Math.max(...data, 1);
	const highlightIndex = data.length - 1; // Last point for pulse effect

	const option = {
		backgroundColor: "transparent",
		textStyle: { fontFamily },
		animation: isNew || isUpdate,
		animationDuration: isNew ? 2000 : 800,
		animationEasing: "cubicOut",
		title: {
			text: labels.activities,
			left: "left",
			textStyle: {
				fontFamily,
				fontSize: 14,
				color: colors.text,
				fontWeight: "bold",
			},
		},
		tooltip: {
			trigger: "axis",
			confine: true,
			backgroundColor: isDark
				? "rgba(30, 30, 30, 0.95)"
				: "rgba(255, 255, 255, 0.95)",
			borderColor: colors.primary,
			borderWidth: 2,
			textStyle: { fontFamily, color: colors.text, fontSize: 12 },
			padding: [8, 12],
			formatter: (params: any) => {
				const param = params[0];
				const value = param.value;
				const isHigh = value >= maxValue * 0.7;
				const emoji = isHigh ? "🟢 Activity" : value > 0 ? "✨" : "";
				return `${emoji} ${param.name}: <strong style="color: ${colors.primary}">${value}</strong> ${labels.posts}`;
			},
			axisPointer: {
				type: "line",
				lineStyle: {
					color: colors.primary,
					width: 2,
					type: "dashed",
				},
			},
		},
		grid: {
			left: "10%",
			right: "5%",
			bottom: "15%",
			top: "25%",
			containLabel: true,
		},
		xAxis: {
			type: "category",
			data: xAxisData,
			axisLine: { lineStyle: { color: colors.grid } },
			axisLabel: { fontFamily, color: colors.text, fontSize: 10 },
		},
		yAxis: {
			type: "value",
			minInterval: 1,
			axisLine: { show: false },
			axisLabel: { fontFamily, color: colors.text, fontSize: 10 },
			splitLine: { lineStyle: { color: colors.grid, type: "dashed" } },
		},
		series: [
			{
				data: data.map((value, index) => ({
					value,
					itemStyle: {
						color:
							index === highlightIndex && value > 0
								? new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
										{ offset: 0, color: colors.primary },
										{ offset: 0.7, color: colors.primary },
										{ offset: 1, color: "transparent" },
									])
								: colors.primary,
						shadowBlur: index === highlightIndex && value > 0 ? 10 : 0,
						shadowColor: colors.primary,
					},
				})),
				type: "line",
				smooth: true,
				symbol: "circle",
				symbolSize: (value: number, params: any) => {
					const index = params.dataIndex;
					return index === highlightIndex && value > 0 ? 10 : 6;
				},
				lineStyle: {
					width: 3,
					color: colors.primary,
					shadowBlur: 5,
					shadowColor: colors.primary,
					shadowOffsetY: 2,
				},
				areaStyle: {
					color: gradientColor,
				},
				emphasis: {
					focus: "series",
					itemStyle: {
						borderColor: colors.primary,
						borderWidth: 3,
						shadowBlur: 15,
						shadowColor: colors.primary,
					},
					lineStyle: {
						width: 4,
					},
				},
				animationDelay: (idx: number) => idx * 50,
			},
		],
	};

	heatmapChart.setOption(option);

	// Add click handler for Activities chart
	heatmapChart.off("click");
	heatmapChart.on("click", (params: any) => {
		if (params && params.name) {
			if (timeScale === "year") {
				navigateToPage(`/vault/?year=${params.name}`);
			}
		}
	});
};

// ❯ @doc Initializes radar charts for categories and tags.
const initRadarCharts = () => {
	if (!echarts) return;
	const colors = getThemeColors();
	const fontFamily = getChartsFontFamily();

	// Categories Bar Chart
	if (categoriesContainer) {
		const existingCategoriesChart =
			echarts.getInstanceByDom(categoriesContainer);
		if (existingCategoriesChart) {
			categoriesChart = existingCategoriesChart;
		} else {
			categoriesChart = echarts.init(
				categoriesContainer,
				isDark ? "dark" : null,
				{ renderer: "svg" },
			);
		}

		// Sort categories by count descending
		const sortedCategories = [...categories].sort((a, b) => b.count - a.count);
		const categoryNames = sortedCategories.map((c) => c.name);
		const categoryData = sortedCategories.map((c, index) => ({
			value: c.count,
			name: c.name,
			itemStyle: {
				color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
					{
						offset: 0,
						color: isDark ? "rgba(255, 123, 0, 0.9)" : "rgba(255, 123, 0, 0.8)",
					},
					{
						offset: 1,
						color: isDark ? "rgba(255, 123, 0, 0.4)" : "rgba(255, 123, 0, 0.5)",
					},
				]),
				borderRadius: [4, 4, 0, 0],
			},
		}));

		categoriesChart.setOption({
			backgroundColor: "transparent",
			textStyle: { fontFamily },
			animation: true,
			animationDuration: 2000,
			animationEasing: "cubicOut",
			tooltip: {
				show: true,
				trigger: "axis",
				confine: true,
				backgroundColor: isDark
					? "rgba(30, 30, 30, 0.95)"
					: "rgba(255, 255, 255, 0.95)",
				borderColor: "rgba(255, 123, 0, 0.9)",
				borderWidth: 2,
				textStyle: { fontFamily, color: colors.text, fontSize: 12 },
				padding: [8, 12],
				formatter: (params: any) => {
					const param = params[0];
					return `${param.name}: <strong style="color: rgba(255, 123, 0, 0.9)">${param.value}</strong> ${labels.posts}`;
				},
				axisPointer: {
					type: "shadow",
					shadowStyle: {
						color: "rgba(255, 123, 0, 0.2)",
					},
				},
			},
			title: {
				text: labels.categories,
				left: "left",
				textStyle: {
					fontFamily,
					fontSize: 14,
					color: colors.text,
					fontWeight: "bold",
				},
			},
			grid: {
				left: "15%",
				right: "5%",
				bottom: "15%",
				top: "20%",
				containLabel: false,
			},
			xAxis: {
				type: "category",
				data: categoryNames,
				axisLine: { lineStyle: { color: colors.grid } },
				axisLabel: {
					fontFamily,
					color: colors.text,
					fontSize: 10,
					rotate: categoryNames.some((name) => name.length > 8) ? 15 : 0,
					interval: 0,
				},
				axisTick: { show: false },
			},
			yAxis: {
				type: "value",
				minInterval: 1,
				axisLine: { show: false },
				axisLabel: { fontFamily, color: colors.text, fontSize: 10 },
				splitLine: {
					lineStyle: {
						color: colors.grid,
						type: "dashed",
					},
				},
			},
			series: [
				{
					type: "bar",
					data: categoryData,
					barWidth: "60%",
					emphasis: {
						itemStyle: {
							shadowBlur: 10,
							shadowColor: "rgba(255, 123, 0, 0.5)",
							borderColor: "rgba(255, 123, 0, 1)",
							borderWidth: 2,
						},
						focus: "series",
					},
					animationDelay: (idx: number) => idx * 100,
				},
			],
		});

		// Add click handler for category navigation
		categoriesChart.off("click");
		categoriesChart.on("click", (params: any) => {
			if (params && params.name) {
				const categoryUrl = getCategoryUrl(params.name);
				navigateToPage(categoryUrl);
			}
		});
	}

	// Tags Pie Chart
	if (tagsContainer) {
		const existingTagsChart = echarts.getInstanceByDom(tagsContainer);
		if (existingTagsChart) {
			tagsChart = existingTagsChart;
		} else {
			tagsChart = echarts.init(tagsContainer, isDark ? "dark" : null, {
				renderer: "svg",
			});
		}

		const sortedTags = [...tags].sort((a, b) => b.count - a.count).slice(0, 10);
		const totalPosts = sortedTags.reduce((sum, t) => sum + t.count, 0);

		const pieData = sortedTags.map((t, index) => {
			const hue = (index * 137.5) % 360;
			const saturation = isDark ? "80%" : "70%";
			const lightness = isDark ? "65%" : "58%";
			const baseColor = `hsl(${hue}, ${saturation}, ${lightness})`;

			// Create radial gradient for each slice
			const gradient = new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
				{
					offset: 0,
					color: `hsla(${hue}, ${saturation}, ${Number.parseInt(lightness) + 20}%, 1)`,
				},
				{ offset: 0.5, color: baseColor },
				{
					offset: 0.8,
					color: `hsla(${hue}, ${saturation}, ${Number.parseInt(lightness) - 5}%, 0.95)`,
				},
				{
					offset: 1,
					color: `hsla(${hue}, ${saturation}, ${Number.parseInt(lightness) - 15}%, 0.85)`,
				},
			]);

			return {
				value: t.count,
				name: t.name,
				itemStyle: {
					color: gradient,
					borderColor: isDark
						? "rgba(255, 255, 255, 0.15)"
						: "rgba(255, 255, 255, 0.9)",
					borderWidth: 3,
					shadowBlur: 12,
					shadowOffsetX: 0,
					shadowOffsetY: 2,
					shadowColor: `hsla(${hue}, ${saturation}, ${Number.parseInt(lightness) - 15}%, 0.6)`,
				},
			};
		});

		tagsChart.setOption({
			backgroundColor: "transparent",
			textStyle: { fontFamily },
			animation: true,
			animationDuration: 2000,
			animationEasing: "elasticOut",
			tooltip: {
				show: true,
				trigger: "item",
				confine: true,
				backgroundColor: isDark
					? "rgba(30, 30, 30, 0.98)"
					: "rgba(255, 255, 255, 0.98)",
				borderColor: "rgba(16, 185, 129, 0.9)",
				borderWidth: 2,
				borderRadius: 8,
				textStyle: {
					fontFamily,
					color: colors.text,
					fontSize: 13,
					fontWeight: 500,
				},
				padding: [12, 16],
				formatter: (params: any) => {
					const percentage = ((params.value / totalPosts) * 100).toFixed(1);
					return `
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${params.color}; border: 2px solid rgba(255, 255, 255, 0.3);"></span>
                                <div>
                                    <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
                                    <div style="font-size: 11px; opacity: 0.8;">
                                        <strong style="color: rgba(16, 185, 129, 0.9);">${params.value}</strong> ${labels.posts} • ${percentage}%
                                    </div>
                                </div>
                            </div>
                        `;
				},
				extraCssText: isDark
					? "box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);"
					: "box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);",
			},
			title: {
				text: labels.tags,
				left: "left",
				textStyle: {
					fontFamily,
					fontSize: 14,
					color: colors.text,
					fontWeight: "bold",
				},
			},
			series: [
				{
					type: "pie",
					radius: ["48%", "78%"],
					center: ["50%", "55%"],
					data: pieData,
					roseType: false,
					avoidLabelOverlap: true,
					stillShowZeroSum: false,
					label: {
						show: false,
					},
					labelLine: {
						show: false,
					},
					emphasis: {
						scale: true,
						scaleSize: 12,
						itemStyle: {
							shadowBlur: 25,
							shadowOffsetX: 0,
							shadowOffsetY: 6,
							shadowColor: isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.4)",
							borderColor: "rgba(255, 255, 255, 1)",
							borderWidth: 4,
						},
						label: {
							show: false,
						},
					},
					animationType: "scale",
					animationEasing: "elasticOut",
					animationDelay: (idx: number) => idx * 100,
					animationDuration: (idx: number) => 1200 + idx * 120,
				},
			],
		});

		// Add click handler for tags navigation
		tagsChart.off("click");
		tagsChart.on("click", (params: any) => {
			if (params && params.name) {
				const tagUrl = getTagUrl(params.name);
				navigateToPage(tagUrl);
			}
		});
	}
};

// ❯ LIFECYCLE
onMount(() => {
	updateIsDesktop();

	let visibilityObserver: IntersectionObserver;

	const runInit = async () => {
		await loadECharts();

		// ❯ check if in initial loading animation phase
		const hasInitialAnimation =
			document.documentElement.classList.contains("show-initial-animation") ||
			document.documentElement.classList.contains("is-loading");

		if (hasInitialAnimation) {
			// ❯ find sidebar container with animation class
			const sidebar = container?.closest(".onload-animation-up");

			const startInit = () => {
				if (!isInitialized) initCharts();
			};

			if (sidebar) {
				// ❯ listen for sidebar fade-in animation start
				sidebar.addEventListener(
					"animationstart",
					(e) => {
						if ((e as AnimationEvent).animationName === "fade-in-up") {
							startInit();
						}
					},
					{ once: true },
				);
			}

			// ❯ use MutationObserver as fallback mechanism
			const htmlObserver = new MutationObserver(() => {
				const isStillLoading =
					document.documentElement.classList.contains("is-loading");

				// ❯ start drawing charts once loading ends
				if (!isStillLoading) {
					startInit();
					htmlObserver.disconnect();
				}
			});
			htmlObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ["class"],
			});

			// ❯ 3 second fallback timeout
			setTimeout(() => {
				startInit();
				htmlObserver.disconnect();
			}, 3000);
		} else {
			// ❯ no animation, load directly
			initCharts();
		}
	};

	if (container) {
		visibilityObserver = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				visibilityObserver.disconnect();
				runInit();
			}
		});
		visibilityObserver.observe(container);
	}

	const handleResize = () => {
		const wasDesktop = isDesktop;
		updateIsDesktop();

		heatmapChart?.resize();

		if (isDesktop) {
			if (wasDesktop) {
				categoriesChart?.resize();
				tagsChart?.resize();
			} else {
				// ❯ switch from mobile to desktop, init radar charts after DOM update
				setTimeout(() => {
					initRadarCharts();
				}, 0);
			}
		}
	};

	const observer = new MutationObserver(() => {
		const newIsDark = document.documentElement.classList.contains("dark");
		if (newIsDark !== isDark) {
			isDark = newIsDark;
			if (isInitialized) {
				initActivityChart(true);
				if (isDesktop) initRadarCharts();
			}
		}
	});
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class"],
	});

	window.addEventListener("resize", handleResize);
	return () => {
		window.removeEventListener("resize", handleResize);
		observer.disconnect();
		if (visibilityObserver) visibilityObserver.disconnect();
		if (gradientInterval) clearInterval(gradientInterval);
		if (simulationInterval) clearInterval(simulationInterval);
	};
});

// ❯ EFFECTS
$effect(() => {
	if (timeScale && echarts && isInitialized) {
		if (timeScale !== lastScale) {
			lastScale = timeScale;
			initActivityChart(true);
		}
	}
});
</script>

<!-- ❯ RENDER -->
<div id={`statistics-${side}`} data-swup-persist={`statistics-${side}`} bind:this={container} class={"pb-4 card-base " + className} {style}>
    <div class="font-bold transition text-lg text-neutral-900 dark:text-neutral-100 relative ml-8 mt-4 mb-2
        before:w-1 before:h-4 before:rounded-md before:bg-(--primary)
        before:absolute before:left-[-16px] before:top-[5.5px]">{labels.statistics}</div>
    <div class="collapse-wrapper px-4 overflow-hidden">
        <div class="stats-charts">
            <div class="chart-section heatmap-section">
                <div class="section-header">
                    <div class="dropdown-wrapper">
                        <button class="time-scale-select flex items-center gap-1">
                            {labels[timeScale]}
                            <span class="dropdown-icon flex items-center">
                                <Icon icon="material-symbols:keyboard-arrow-down-rounded" />
                            </span>
                        </button>
                        <div class="dropdown-menu-custom">
                            <button class="dropdown-item-custom" class:active={timeScale === 'year'} onclick={() => timeScale = 'year'}>{labels.year}</button>
                            <button class="dropdown-item-custom" class:active={timeScale === 'month'} onclick={() => timeScale = 'month'}>{labels.month}</button>
                            <button class="dropdown-item-custom" class:active={timeScale === 'day'} onclick={() => timeScale = 'day'}>{labels.day}</button>
                        </div>
                    </div>
                </div>
                <div bind:this={heatmapContainer} class="heatmap-container"></div>
            </div>

            {#if isDesktop}
                <div class="chart-section bar-section">
                    <div bind:this={categoriesContainer} class="bar-container"></div>
                </div>

                <div class="chart-section pie-section">
                    <div bind:this={tagsContainer} class="pie-container"></div>
                </div>
            {/if}
        </div>
    </div>
</div>

<!-- ❯ STYLES -->
<style>
    .stats-charts {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: 100%;
    }
    .chart-section {
        width: 100%;
        position: relative;
    }
    .heatmap-section {
        position: relative;
    }
    .section-header {
        position: absolute;
        right: 0;
        top: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .time-scale-select {
        display: flex;
        align-items: center;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.7rem;
        background: var(--btn-regular-bg);
        color: var(--btn-content);
        border: 1px solid var(--line-color);
        cursor: pointer;
        opacity: 0.7;
        transition: all 0.2s;
        outline: none;
    }
    .time-scale-select:hover {
        opacity: 1;
        border-color: var(--primary);
    }
    .dropdown-wrapper {
        position: relative;
        display: inline-block;
    }
    .dropdown-wrapper:hover .dropdown-menu-custom {
        opacity: 1;
        visibility: visible;
        translate: 0 0;
    }
    .dropdown-menu-custom {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 4px;
        background: var(--card-bg);
        border: 1px solid var(--line-color);
        border-radius: 4px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        opacity: 0;
        visibility: hidden;
        translate: 0 -10px;
        transition: all 0.2s;
        z-index: 50;
        min-width: 80px;
        overflow: hidden;
    }
    .dropdown-item-custom {
        width: 100%;
        text-align: left;
        padding: 6px 12px;
        font-size: 0.7rem;
        color: var(--btn-content);
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
    }
    .dropdown-item-custom:hover {
        background: var(--btn-plain-bg-hover);
        color: var(--primary);
    }
    .dropdown-item-custom.active {
        color: var(--primary);
        font-weight: bold;
        background: var(--btn-plain-bg-hover);
    }
    .dropdown-icon {
        font-size: 0.9rem;
        transition: rotate 0.2s;
    }
    .dropdown-wrapper:hover .dropdown-icon {
        rotate: 180deg;
    }
    .heatmap-container {
        height: 180px;
        width: 100%;
        position: relative;
        border-radius: 8px;
        overflow: hidden;
    }
    
    /* ❯ Pulse/Glow Animation */
    .heatmap-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at 50% 50%, 
            rgba(59, 130, 246, 0.15) 0%, 
            transparent 70%);
        opacity: 0;
        animation: pulse-glow 3s ease-in-out infinite;
        pointer-events: none;
        z-index: 1;
    }
    
    :global(.dark) .heatmap-container::before {
        background: radial-gradient(circle at 50% 50%, 
            rgba(96, 165, 250, 0.2) 0%, 
            transparent 70%);
    }
    
    @keyframes pulse-glow {
        0%, 100% {
            opacity: 0;
            transform: scale(1);
        }
        50% {
            opacity: 0.6;
            transform: scale(1.1);
        }
    }
    
    /* ❯ Chart Container Enhancements */
    .heatmap-section {
        position: relative;
    }
    
    .heatmap-section::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.03) 0%, 
            transparent 50%,
            rgba(59, 130, 246, 0.03) 100%);
        pointer-events: none;
        border-radius: 8px;
        z-index: 0;
    }
    
    .bar-container {
        height: 250px;
        width: 100%;
        cursor: pointer;
    }
    
    .bar-section {
        position: relative;
    }
    
    .bar-section::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, 
            rgba(255, 123, 0, 0.03) 0%, 
            transparent 50%,
            rgba(255, 123, 0, 0.03) 100%);
        pointer-events: none;
        border-radius: 8px;
        z-index: 0;
    }
    
    .pie-section {
        position: relative;
    }
    
    .pie-container {
        height: 250px;
        width: 100%;
        cursor: pointer;
        position: relative;
    }
    
    .pie-container::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: radial-gradient(circle, 
            rgba(16, 185, 129, 0.25) 0%, 
            rgba(16, 185, 129, 0.15) 30%, 
            rgba(16, 185, 129, 0.08) 60%,
            transparent 100%);
        pointer-events: none;
        z-index: 0;
        animation: pulse-glow-pie 2.5s ease-in-out infinite;
    }

    .pie-container::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: radial-gradient(circle, 
            rgba(16, 185, 129, 0.35) 0%, 
            rgba(16, 185, 129, 0.2) 40%, 
            rgba(16, 185, 129, 0.1) 70%,
            transparent 100%);
        pointer-events: none;
        z-index: 0;
        animation: pulse-inner-pie 2s ease-in-out infinite;
    }

    :global(.dark) .pie-container::before {
        background: radial-gradient(circle, 
            rgba(16, 185, 129, 0.3) 0%, 
            rgba(16, 185, 129, 0.15) 40%, 
            rgba(16, 185, 129, 0.08) 70%,
            transparent 100%);
    }

    :global(.dark) .pie-container::after {
        background: radial-gradient(circle, 
            rgba(16, 185, 129, 0.4) 0%, 
            rgba(16, 185, 129, 0.2) 50%, 
            transparent 100%);
    }

    @keyframes pulse-glow-pie {
        0%, 100% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1);
        }
        50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.15);
        }
    }

    @keyframes pulse-inner-pie {
        0%, 100% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1);
        }
        50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
        }
    }

    .pie-section::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, 
            rgba(16, 185, 129, 0.02) 0%, 
            transparent 40%,
            transparent 60%,
            rgba(16, 185, 129, 0.02) 100%);
        pointer-events: none;
        border-radius: 8px;
        z-index: 0;
    }
</style>

