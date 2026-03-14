// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/markdown.ts
// ❯ @desc Markdown action handlers.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ EVENT HANDLERS
// ❯ @doc Initializes click handlers for markdown actions.
export function initMarkdownActions() {
	if (typeof document === "undefined") return;
	document.addEventListener("click", (e: MouseEvent) => {
		const target = e.target as Element | null;
		if (!target) return;
		if (target.classList.contains("copy-btn") || target.closest(".copy-btn")) {
			const btn = target.classList.contains("copy-btn")
				? target
				: target.closest(".copy-btn");
			if (!btn) return;

			const codeEle = btn.parentElement?.querySelector("code");
			let code = "";
			if (codeEle) {
				const lineElements = codeEle.querySelectorAll("span.line");
				if (lineElements.length > 0) {
					const lines: string[] = [];
					for (let i = 0; i < lineElements.length; i++) {
						const lineElement = lineElements[i];
						const lineText = lineElement.textContent || "";
						lines.push(lineText);
					}
					code = lines.join("\n");
				} else {
					const codeElements = codeEle.querySelectorAll(".code:not(summary *)");
					if (codeElements.length > 0) {
						const lines: string[] = [];
						for (let i = 0; i < codeElements.length; i++) {
							const el = codeElements[i];
							const lineText = el.textContent || "";
							lines.push(lineText);
						}
						code = lines.join("\n");
					} else {
						code = codeEle.textContent || "";
					}
				}
			}
			code = code.replace(/\n\n\n+/g, (match) => {
				const newlineCount = match.length;
				const emptyLineCount = newlineCount - 1;
				let resultEmptyLines: number;
				if (emptyLineCount % 2 === 0) {
					resultEmptyLines = emptyLineCount / 2;
				} else {
					resultEmptyLines = Math.floor((emptyLineCount + 1) / 2);
				}
				if (resultEmptyLines < 1) resultEmptyLines = 1;
				return "\n".repeat(resultEmptyLines + 1);
			});
			const copyToClipboard = async (text: string) => {
				try {
					await navigator.clipboard.writeText(text);
				} catch (clipboardErr) {
					console.warn("Clipboard API 失败，尝试备用方案:", clipboardErr);
					const textArea = document.createElement("textarea");
					textArea.value = text;
					textArea.style.position = "fixed";
					textArea.style.left = "-999999px";
					textArea.style.top = "-999999px";
					document.body.appendChild(textArea);
					textArea.focus();
					textArea.select();
					try {
						document.execCommand("copy");
					} catch (execErr) {
						console.error("execCommand 也失败了:", execErr);
						throw new Error("所有复制方法都失败了");
					} finally {
						document.body.removeChild(textArea);
					}
				}
			};
			copyToClipboard(code)
				.then(() => {
					const timeoutId = btn.getAttribute("data-timeout-id");
					if (timeoutId) {
						clearTimeout(Number.parseInt(timeoutId));
					}
					btn.classList.add("success");
					const newTimeoutId = setTimeout(() => {
						btn.classList.remove("success");
					}, 1000);
					btn.setAttribute("data-timeout-id", newTimeoutId.toString());
				})
				.catch((err) => {
					console.error("复制失败:", err);
				});
		}
		if (
			target.classList.contains("collapse-btn") ||
			target.closest(".collapse-btn")
		) {
			const btn = target.classList.contains("collapse-btn")
				? target
				: target.closest(".collapse-btn");
			const codeBlock = btn?.closest(".expressive-code");
			if (codeBlock) {
				codeBlock.classList.toggle("collapsed");
				codeBlock.classList.toggle("expanded");
			}
		}
	});
}
