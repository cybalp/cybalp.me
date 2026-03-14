(() => {
	const originalScrollTo = window.scrollTo;
	const originalScrollBy = window.scrollBy;
	const originalScrollIntoView = Element.prototype.scrollIntoView;
	const scrollProtection = {
		enabled: false,
		allowedY: null,
		startTime: 0,
		duration: 0,
		timeout: null,
	};

	function checkIsTOCNavigation() {
		const stack = new Error().stack;
		if (
			stack &&
			(stack.includes("handleAnchorClick") || stack.includes("TOC.astro"))
		) {
			return true;
		}

		if (
			window.tocClickTimestamp &&
			Date.now() - window.tocClickTimestamp < 1000
		) {
			return true;
		}

		const activeElement = document.activeElement;
		if (activeElement && activeElement.closest("#toc, .table-of-contents")) {
			return true;
		}

		return false;
	}

	function enableScrollProtection(duration = 3000, currentY = null) {
		scrollProtection.enabled = true;
		scrollProtection.allowedY =
			currentY !== null ? currentY : window.scrollY || window.pageYOffset;
		scrollProtection.startTime = Date.now();
		scrollProtection.duration = duration;

		if (scrollProtection.timeout) {
			clearTimeout(scrollProtection.timeout);
		}

		scrollProtection.timeout = setTimeout(() => {
			scrollProtection.enabled = false;
			console.log("[强力滚动保护] 保护期结束");
		}, duration);

		console.log(
			`[强力滚动保护] 启动保护 ${duration}ms，允许Y位置:`,
			scrollProtection.allowedY,
		);
	}

	function isScrollAllowed(x, y) {
		if (!scrollProtection.enabled) {
			return true;
		}

		const isTOCNavigation = checkIsTOCNavigation();
		if (isTOCNavigation) {
			console.log("[强力滚动保护] 检测到TOC导航，允许滚动");
			return true;
		}

		const tolerance = 50;
		const allowedY = scrollProtection.allowedY;

		if (Math.abs(y - allowedY) <= tolerance) {
			return true;
		}

		if (y < 100 && allowedY > 100) {
			console.log(
				"[强力滚动保护] 阻止滚动到顶部，目标Y:",
				y,
				"允许Y:",
				allowedY,
			);
			return false;
		}

		return true;
	}

	window.scrollTo = (x, y) => {
		if (typeof x === "object") {
			const options = x;
			x = options.left || 0;
			y = options.top || 0;
		}

		if (isScrollAllowed(x, y)) {
			originalScrollTo.call(window, x, y);
		} else {
			console.log("[强力滚动保护] 阻止 scrollTo:", x, y);
			originalScrollTo.call(window, x, scrollProtection.allowedY);
		}
	};

	window.scrollBy = (x, y) => {
		const currentY = window.scrollY || window.pageYOffset;
		const targetY = currentY + y;

		if (typeof x === "object") {
			const options = x;
			x = options.left || 0;
			y = options.top || 0;
		}

		if (isScrollAllowed(x, targetY)) {
			originalScrollBy.call(window, x, y);
		} else {
			console.log("[强力滚动保护] 阻止 scrollBy:", x, y);
		}
	};

	Element.prototype.scrollIntoView = function (options) {
		if (!scrollProtection.enabled) {
			originalScrollIntoView.call(this, options);
			return;
		}

		const rect = this.getBoundingClientRect();
		const currentY = window.scrollY || window.pageYOffset;
		const targetY = currentY + rect.top;

		if (isScrollAllowed(0, targetY)) {
			originalScrollIntoView.call(this, options);
		} else {
			console.log("[强力滚动保护] 阻止 scrollIntoView");
		}
	};

	document.addEventListener(
		"click",
		(event) => {
			const target = event.target;

			if (
				target.closest("#toc, .table-of-contents") &&
				target.closest('a[href^="#"]')
			) {
				window.tocClickTimestamp = Date.now();
				console.log("[强力滚动保护] 检测到TOC导航点击");
				return;
			}

			if (
				target.closest("#tcomment") ||
				target.matches(
					".tk-action-icon, .tk-submit, .tk-cancel, .tk-preview, .tk-owo, .tk-admin, .tk-edit, .tk-delete, .tk-reply, .tk-expand",
				) ||
				target.closest(
					".tk-action-icon, .tk-submit, .tk-cancel, .tk-preview, .tk-owo, .tk-admin, .tk-edit, .tk-delete, .tk-reply, .tk-expand",
				)
			) {
				enableScrollProtection(4000);
				console.log("[强力滚动保护] 检测到 Twikoo 交互，启动保护");
			}

			if (
				target.matches(
					".tk-admin-panel, .tk-admin-overlay, .tk-modal, .tk-dialog, .tk-admin-close, .tk-close",
				) ||
				target.closest(
					".tk-admin-panel, .tk-admin-overlay, .tk-modal, .tk-dialog, .tk-admin-close, .tk-close",
				) ||
				target.classList.contains("tk-admin") ||
				target.closest(".tk-admin")
			) {
				enableScrollProtection(6000);
				console.log("[强力滚动保护] 检测到 Twikoo 管理面板操作，启动长期保护");
			}

			if (
				target.classList.contains("tk-overlay") ||
				target.classList.contains("tk-mask") ||
				target.matches('[class*="overlay"]') ||
				target.matches('[class*="mask"]') ||
				target.matches('[class*="backdrop"]')
			) {
				const tcommentEl = document.querySelector("#tcomment");
				if (
					tcommentEl &&
					(target.closest("#tcomment") || tcommentEl.contains(target))
				) {
					enableScrollProtection(4000);
					console.log("[强力滚动保护] 检测到 Twikoo 遮罩层点击，启动保护");
				}
			}
		},
		true,
	);
	document.addEventListener(
		"submit",
		(event) => {
			if (event.target.closest("#tcomment")) {
				enableScrollProtection(4000);
				console.log("[强力滚动保护] 检测到 Twikoo 表单提交，启动保护");
			}
		},
		true,
	);

	document.addEventListener(
		"keydown",
		(event) => {
			if (event.key === "Escape" || event.keyCode === 27) {
				const tcommentEl = document.querySelector("#tcomment");
				if (tcommentEl) {
					const adminPanel = tcommentEl.querySelector(
						".tk-admin-panel, .tk-modal, .tk-dialog, [class*='admin'], [class*='modal']",
					);
					if (adminPanel && adminPanel.offsetParent !== null) {
						enableScrollProtection(3000);
						console.log(
							"[强力滚动保护] 检测到 ESC 键关闭 Twikoo 管理面板，启动保护",
						);
					}
				}
			}
		},
		true,
	);
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (mutation.type === "childList" || mutation.type === "attributes") {
				const target = mutation.target;

				if (target.closest && target.closest("#tcomment")) {
					if (
						mutation.removedNodes.length > 0 ||
						(mutation.type === "attributes" &&
							mutation.attributeName === "style")
					) {
						enableScrollProtection(2000);
						console.log(
							"[强力滚动保护] 检测到 Twikoo DOM 变化（可能是面板关闭），启动保护",
						);
					}
				}
			}
		});
	});

	if (document.body) {
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["style", "class"],
		});
	} else {
		document.addEventListener("DOMContentLoaded", () => {
			observer.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["style", "class"],
			});
		});
	}

	window.scrollProtectionManager = {
		enable: enableScrollProtection,
		disable: () => {
			scrollProtection.enabled = false;
			if (scrollProtection.timeout) {
				clearTimeout(scrollProtection.timeout);
			}
			console.log("[强力滚动保护] 手动停止保护");
		},
		isEnabled: () => scrollProtection.enabled,
		getStatus: () => ({ ...scrollProtection }),
		forceProtect: (duration = 10000) => {
			enableScrollProtection(duration);
			console.log(`[强力滚动保护] 强制保护模式启动 ${duration}ms`);
		},
		getCurrentScroll: () => {
			return {
				x: window.scrollX || window.pageXOffset,
				y: window.scrollY || window.pageYOffset,
			};
		},
		checkTwikooStatus: () => {
			const tcomment = document.querySelector("#tcomment");
			if (!tcomment) return { exists: false };

			const adminPanels = tcomment.querySelectorAll(
				".tk-admin-panel, .tk-modal, .tk-dialog, [class*='admin'], [class*='modal']",
			);
			const visiblePanels = Array.from(adminPanels).filter(
				(panel) => panel.offsetParent !== null,
			);

			return {
				exists: true,
				adminPanelsCount: adminPanels.length,
				visiblePanelsCount: visiblePanels.length,
				hasVisiblePanels: visiblePanels.length > 0,
			};
		},
	};

	console.log("[强力滚动保护] 初始化完成");
})();
