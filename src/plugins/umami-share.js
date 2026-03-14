((global) => {
	const cacheKey = "umami-share-cache";
	const cacheTTL = 3600_000;

	async function fetchWebsiteStats(baseUrl, apiKey, websiteId) {
		const cached = localStorage.getItem(cacheKey);
		if (cached) {
			try {
				const parsed = JSON.parse(cached);
				if (Date.now() - parsed.timestamp < cacheTTL) {
					return parsed.value;
				}
			} catch {
				localStorage.removeItem(cacheKey);
			}
		}

		const currentTimestamp = Date.now();
		const statsUrl = `${baseUrl}/v1/websites/${websiteId}/stats?startAt=0&endAt=${currentTimestamp}`;

		const res = await fetch(statsUrl, {
			headers: {
				"x-umami-api-key": apiKey,
			},
		});

		if (!res.ok) {
			throw new Error("获取网站统计数据失败");
		}

		const stats = await res.json();

		localStorage.setItem(
			cacheKey,
			JSON.stringify({ timestamp: Date.now(), value: stats }),
		);

		return stats;
	}
	async function fetchPageStats(
		baseUrl,
		apiKey,
		websiteId,
		urlPath,
		startAt = 0,
		endAt = Date.now(),
	) {
		const statsUrl = `${baseUrl}/v1/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}&url=${encodeURIComponent(urlPath)}`;

		const res = await fetch(statsUrl, {
			headers: {
				"x-umami-api-key": apiKey,
			},
		});

		if (!res.ok) {
			throw new Error("获取页面统计数据失败");
		}

		return await res.json();
	}
	global.getUmamiWebsiteStats = async (baseUrl, apiKey, websiteId) => {
		try {
			return await fetchWebsiteStats(baseUrl, apiKey, websiteId);
		} catch (err) {
			throw new Error(`获取Umami统计数据失败: ${err.message}`);
		}
	};
	global.getUmamiPageStats = async (
		baseUrl,
		apiKey,
		websiteId,
		urlPath,
		startAt,
		endAt,
	) => {
		try {
			return await fetchPageStats(
				baseUrl,
				apiKey,
				websiteId,
				urlPath,
				startAt,
				endAt,
			);
		} catch (err) {
			throw new Error(`获取Umami页面统计数据失败: ${err.message}`);
		}
	};

	global.clearUmamiShareCache = () => {
		localStorage.removeItem(cacheKey);
	};
})(window);
