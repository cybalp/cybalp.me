<script lang="ts">
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/components/data/netstatCharts.svelte
// ❯ @desc Netstat charts component for dedicated page.
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
}: {
	posts?: any[];
	categories?: any[];
	tags?: any[];
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
};

// ❯ STATE
let container = $state<HTMLDivElement>();
let activitiesContainer = $state<HTMLDivElement>();
let categoriesContainer = $state<HTMLDivElement>();
let tagsContainer = $state<HTMLDivElement>();
let echarts: any = $state();
let activitiesChart: any = $state();
let categoriesChart: any = $state();
let tagsChart: any = $state();

let timeScale: "year" | "month" | "day" = $state("year");
let lastScale = $state<"year" | "month" | "day">("year");
let isDark = $state(false);
let isDesktop = $state(true);
let gradientOffset = $state(0);
let gradientInterval: any = $state(null);

// ❯ UTILITIES
const updateIsDesktop = () => {
	if (typeof window !== "undefined") {
		isDesktop = window.innerWidth >= BREAKPOINT_LG;
	}
};

const getThemeColors = () => {
	const isDarkNow = document.documentElement.classList.contains("dark");
	return {
		text: isDarkNow ? "#e5e7eb" : "#374151",
		primary: isDarkNow ? "#60a5fa" : "#3b82f6",
		grid: isDarkNow ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
		areaStart: isDarkNow
			? "rgba(96, 165, 250, 0.5)"
			: "rgba(59, 130, 246, 0.5)",
		areaEnd: isDarkNow ? "rgba(96, 165, 250, 0)" : "rgba(59, 130, 246, 0)",
	};
};

const getChartsFontFamily = () => {
	const fallback =
		"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif";
	if (typeof window === "undefined") return fallback;
	const target = container ?? document.body ?? document.documentElement;
	const fontFamily = window.getComputedStyle(target).fontFamily;
	return fontFamily && fontFamily !== "inherit" ? fontFamily : fallback;
};

// ❯ ECHARTS LOADING
const loadECharts = async () => {
	if (typeof window === "undefined") return;
	isDark = document.documentElement.classList.contains("dark");

	const echartsCore = await import("echarts/core");
	const { LineChart, BarChart, PieChart } = await import("echarts/charts");
	const { TitleComponent, TooltipComponent, GridComponent, LegendComponent } =
		await import("echarts/components");
	const { SVGRenderer } = await import("echarts/renderers");

	echartsCore.use([
		LineChart,
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

const initCharts = () => {
	if (isInitialized) return;
	initActivitiesChart();
	initCategoriesChart();
	initTagsChart();
	isInitialized = true;
	startLiveEffects();
};

const startLiveEffects = () => {
	if (gradientInterval) clearInterval(gradientInterval);

	gradientInterval = setInterval(() => {
		gradientOffset = (gradientOffset + 0.05) % 1;
		if (activitiesChart && isInitialized) {
			const colors = getThemeColors();
			const gradientColor = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
				{ offset: 0, color: colors.areaStart },
				{ offset: 0.5 + gradientOffset * 0.05, color: colors.areaStart },
				{ offset: 1, color: colors.areaEnd },
			]);
			activitiesChart.setOption(
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
	}, 300);
};

const initActivitiesChart = (isUpdate = false) => {
	if (!activitiesContainer || !echarts) return;

	const existingChart = echarts.getInstanceByDom(activitiesContainer);
	const isNew = !existingChart;
	if (existingChart) {
		activitiesChart = existingChart;
	} else {
		activitiesChart = echarts.init(
			activitiesContainer,
			isDark ? "dark" : null,
			{ renderer: "svg" },
		);
	}

	const colors = getThemeColors();
	const fontFamily = getChartsFontFamily();

	const now = dayjs();
	let data: any[] = [];
	let xAxisData: string[] = [];

	if (timeScale === "year") {
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

	const gradientColor = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
		{ offset: 0, color: colors.areaStart },
		{ offset: 0.5 + gradientOffset * 0.1, color: colors.areaStart },
		{ offset: 1, color: colors.areaEnd },
	]);

	const maxValue = Math.max(...data, 1);
	const highlightIndex = data.length - 1;

	const option = {
		backgroundColor: "transparent",
		textStyle: { fontFamily },
		animation: isNew || isUpdate,
		animationDuration: isNew ? 2000 : 800,
		animationEasing: "cubicOut",
		title: {
			show: false,
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
			top: "10%",
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

	activitiesChart.setOption(option);

	// Add click handler for Activities chart
	activitiesChart.off("click");
	activitiesChart.on("click", (params: any) => {
		if (params && params.name) {
			const year = params.name;
			if (timeScale === "year") {
				navigateToPage(`/vault/?year=${year}`);
			}
		}
	});
};

const initCategoriesChart = () => {
	if (!categoriesContainer || !echarts) return;

	const existingChart = echarts.getInstanceByDom(categoriesContainer);
	if (existingChart) {
		categoriesChart = existingChart;
	} else {
		categoriesChart = echarts.init(
			categoriesContainer,
			isDark ? "dark" : null,
			{ renderer: "svg" },
		);
	}

	const colors = getThemeColors();
	const fontFamily = getChartsFontFamily();

	const sortedCategories = [...categories].sort((a, b) => b.count - a.count);
	const categoryNames = sortedCategories.map((c) => c.name);
	const categoryData = sortedCategories.map((c) => ({
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
			show: false,
		},
		grid: {
			left: "15%",
			right: "5%",
			bottom: "15%",
			top: "10%",
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

	categoriesChart.off("click");
	categoriesChart.on("click", (params: any) => {
		if (params && params.name) {
			const categoryUrl = getCategoryUrl(params.name);
			navigateToPage(categoryUrl);
		}
	});
};

const initTagsChart = () => {
	if (!tagsContainer || !echarts) return;

	const existingChart = echarts.getInstanceByDom(tagsContainer);
	if (existingChart) {
		tagsChart = existingChart;
	} else {
		tagsChart = echarts.init(tagsContainer, isDark ? "dark" : null, {
			renderer: "svg",
		});
	}

	const colors = getThemeColors();
	const fontFamily = getChartsFontFamily();

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
		animationEasing: "cubicOut",
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
			show: false,
		},
		series: [
			{
				type: "pie",
				radius: ["48%", "78%"],
				center: ["50%", "55%"],
				data: pieData,
				label: {
					show: false,
				},
				labelLine: {
					show: false,
				},
				roseType: false,
				avoidLabelOverlap: true,
				stillShowZeroSum: false,
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

	tagsChart.off("click");
	tagsChart.on("click", (params: any) => {
		if (params && params.name) {
			const tagUrl = getTagUrl(params.name);
			navigateToPage(tagUrl);
		}
	});
};

// ❯ LIFECYCLE
onMount(() => {
	updateIsDesktop();

	const runInit = async () => {
		await loadECharts();
		initCharts();
	};

	if (container) {
		const visibilityObserver = new IntersectionObserver((entries) => {
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

		activitiesChart?.resize();
		categoriesChart?.resize();
		tagsChart?.resize();
	};

	const observer = new MutationObserver(() => {
		const newIsDark = document.documentElement.classList.contains("dark");
		if (newIsDark !== isDark) {
			isDark = newIsDark;
			if (isInitialized) {
				initActivitiesChart(true);
				initCategoriesChart();
				initTagsChart();
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
		if (gradientInterval) clearInterval(gradientInterval);
	};
});

// ❯ EFFECTS
$effect(() => {
	if (timeScale && echarts && isInitialized) {
		if (timeScale !== lastScale) {
			lastScale = timeScale;
			initActivitiesChart(true);
		}
	}
});
</script>

<!-- ❯ RENDER -->
<div bind:this={container} class="w-full">
    <div class="stats-charts">
        <!-- ❯ Activities Chart - Full Width -->
        <div class="chart-card activities-card">
            <div class="chart-header">
                <div class="chart-title-wrapper">
                    <h3 class="chart-title">Activities</h3>
                    <p class="chart-subtitle">Post activity over time</p>
                </div>
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
            </div>
            <div bind:this={activitiesContainer} class="chart-container activities-container"></div>
        </div>

        <!-- ❯ Categories & Tags - Grid Layout -->
        {#if isDesktop}
            <div class="charts-grid">
                <div class="chart-card categories-card">
                    <div class="chart-header">
                        <div class="chart-title-wrapper">
                            <h3 class="chart-title">Directories</h3>
                            <p class="chart-subtitle">Posts by category</p>
                        </div>
                    </div>
                    <div bind:this={categoriesContainer} class="chart-container bar-container"></div>
                </div>

                <div class="chart-card tags-card">
                    <div class="chart-header">
                        <div class="chart-title-wrapper">
                            <h3 class="chart-title">Alias</h3>
                            <p class="chart-subtitle">Posts by tag</p>
                        </div>
                    </div>
                    <div bind:this={tagsContainer} class="chart-container pie-container"></div>
                </div>
            </div>
        {:else}
            <div class="chart-card categories-card">
                <div class="chart-header">
                    <div class="chart-title-wrapper">
                        <h3 class="chart-title">Directories</h3>
                        <p class="chart-subtitle">Posts by category</p>
                    </div>
                </div>
                <div bind:this={categoriesContainer} class="chart-container bar-container"></div>
            </div>

            <div class="chart-card tags-card">
                <div class="chart-header">
                    <div class="chart-title-wrapper">
                        <h3 class="chart-title">Alias</h3>
                        <p class="chart-subtitle">Posts by tag</p>
                    </div>
                </div>
                <div bind:this={tagsContainer} class="chart-container pie-container"></div>
            </div>
        {/if}
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

    .charts-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1.5rem;
    }

    @media (max-width: 1024px) {
        .charts-grid {
            grid-template-columns: 1fr;
        }
    }

    .chart-card {
        background: var(--card-bg);
        border: 1px solid var(--line-color);
        border-radius: 12px;
        padding: 1.5rem;
        position: relative;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
    }

    .chart-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, 
            var(--primary) 0%, 
            rgba(59, 130, 246, 0.5) 50%, 
            var(--primary) 100%);
        opacity: 0;
        transition: opacity 0.3s;
    }

    .chart-card:hover {
        border-color: var(--primary);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }

    :global(.dark) .chart-card:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    .chart-card:hover::before {
        opacity: 1;
    }

    .activities-card::before {
        background: linear-gradient(90deg, 
            #3b82f6 0%, 
            rgba(59, 130, 246, 0.5) 50%, 
            #3b82f6 100%);
    }

    .categories-card::before {
        background: linear-gradient(90deg, 
            rgba(255, 123, 0, 0.9) 0%, 
            rgba(255, 123, 0, 0.5) 50%, 
            rgba(255, 123, 0, 0.9) 100%);
    }

    .tags-card::before {
        background: linear-gradient(90deg, 
            rgba(16, 185, 129, 0.9) 0%, 
            rgba(16, 185, 129, 0.5) 50%, 
            rgba(16, 185, 129, 0.9) 100%);
    }

    .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.25rem;
        gap: 1rem;
    }

    .chart-title-wrapper {
        flex: 1;
    }

    .chart-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: rgb(17, 24, 39);
        margin: 0 0 0.25rem 0;
        line-height: 1.4;
    }

    :global(.dark) .chart-title {
        color: rgb(249, 250, 251);
    }

    .chart-subtitle {
        font-size: 0.875rem;
        color: rgb(75, 85, 99);
        margin: 0;
    }

    :global(.dark) .chart-subtitle {
        color: rgb(209, 213, 219);
    }

    .section-header {
        position: relative;
        z-index: 10;
    }

    .time-scale-select {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.375rem 0.75rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 500;
        background: var(--btn-regular-bg);
        color: var(--btn-content);
        border: 1px solid var(--line-color);
        cursor: pointer;
        transition: all 0.2s;
    }

    .time-scale-select:hover {
        background: var(--btn-plain-bg-hover);
        border-color: var(--primary);
        color: var(--primary);
    }

    .dropdown-icon {
        font-size: 1rem;
        transition: transform 0.2s;
    }

    .dropdown-wrapper:hover .dropdown-icon {
        transform: rotate(180deg);
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
        top: calc(100% + 0.5rem);
        right: 0;
        background: rgb(255, 255, 255);
        border: 1px solid var(--line-color);
        border-radius: 8px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        opacity: 0;
        visibility: hidden;
        translate: 0 -10px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 50;
        min-width: 100px;
        overflow: hidden;
    }

    :global(.dark) .dropdown-menu-custom {
        background: rgb(23, 23, 23);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
    }

    .dropdown-item-custom {
        width: 100%;
        text-align: left;
        padding: 0.5rem 0.75rem;
        font-size: 0.75rem;
        color: rgb(55, 65, 81);
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all 0.15s;
    }

    :global(.dark) .dropdown-item-custom {
        color: rgb(229, 231, 235);
    }

    .dropdown-item-custom:hover {
        background: var(--btn-plain-bg-hover);
        color: var(--primary);
    }

    .dropdown-item-custom.active {
        color: var(--primary);
        font-weight: 600;
        background: var(--btn-plain-bg-hover);
    }

    .chart-container {
        width: 100%;
        cursor: pointer;
        position: relative;
    }

    .activities-container {
        height: 350px;
    }

    .bar-container {
        height: 320px;
    }

    .pie-container {
        height: 320px;
        position: relative;
        overflow: visible;
    }

    .tags-card .pie-container {
        filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.15));
    }

    :global(.dark) .tags-card .pie-container {
        filter: drop-shadow(0 4px 12px rgba(16, 185, 129, 0.25));
    }

    .pie-container::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: radial-gradient(circle, 
            rgba(16, 185, 129, 0.25) 0%, 
            rgba(16, 185, 129, 0.15) 30%, 
            rgba(16, 185, 129, 0.08) 60%,
            transparent 100%);
        pointer-events: none;
        z-index: 0;
        animation: pulse-glow 2.5s ease-in-out infinite;
    }

    .pie-container::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background: radial-gradient(circle, 
            rgba(16, 185, 129, 0.35) 0%, 
            rgba(16, 185, 129, 0.2) 40%, 
            rgba(16, 185, 129, 0.1) 70%,
            transparent 100%);
        pointer-events: none;
        z-index: 0;
        animation: pulse-inner 2s ease-in-out infinite;
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

    @keyframes pulse-glow {
        0%, 100% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1);
        }
        50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.15);
        }
    }

    @keyframes pulse-inner {
        0%, 100% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1);
        }
        50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2);
        }
    }

    @media (max-width: 768px) {
        .chart-card {
            padding: 1.25rem;
        }

        .chart-title {
            font-size: 1rem;
        }

        .chart-subtitle {
            font-size: 0.8125rem;
        }

        .activities-container {
            height: 280px;
        }

        .bar-container,
        .pie-container {
            height: 280px;
        }
    }
</style>

