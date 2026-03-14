// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/commands.ts
// ❯ @desc Command mode engine for the search overlay.
//        Handles `> command` prefix parsing, config-driven command matching,
//        Unix easter egg detection, and help output generation.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// ❯ IMPORTS
import type { SearchCommand } from "@/types/config";

// ❯ TYPES
export interface CommandMatch {
	command: SearchCommand;
	score: number;
}

export interface EasterEggResult {
	kind: "easter";
	input: string;
	response: string;
}

// ❯ EASTER EGGS
// ❯ @doc Known Unix/system commands that trigger joke responses.
const UNIX_COMMANDS = new Set([
	"ls", "ll", "la", "l", "dir",
	"pwd", "cd", "mkdir", "rmdir", "rm", "mv", "cp", "touch",
	"cat", "head", "tail", "less", "more", "nano", "vim", "vi",
	"grep", "find", "locate", "which", "whereis",
	"chmod", "chown", "chgrp", "sudo", "su",
	"ps", "top", "htop", "kill", "pkill",
	"echo", "printf", "read",
	"bash", "sh", "zsh", "fish", "dash",
	"curl", "wget", "ping", "ssh", "scp", "rsync",
	"apt", "apt-get", "pacman", "yum", "dnf", "brew", "pip", "npm", "yarn", "pnpm",
	"git", "docker", "kubectl",
	"uname", "whoami", "hostname", "df", "du", "free",
	"export", "source", "env", "set", "unset",
	"reboot", "shutdown", "poweroff", "halt",
	"mount", "umount", "fdisk",
	"man", "info", "help",
	"date", "cal", "uptime",
	"tar", "zip", "unzip", "gzip", "gunzip",
	"awk", "sed", "sort", "uniq", "wc", "cut", "tr",
	"cron", "crontab", "systemctl", "service",
]);

// ❯ @doc Pool of joke responses for Unix command easter eggs.
const EASTER_EGG_RESPONSES = [
	"Nice try 😄 This is a website, not a terminal. Try `> help` to see what I can actually do.",
	"Access denied. This isn't a shell. Type `> help` for real commands.",
	"404: /bin/sh not found here. But `> help` might work!",
	"Kernel panic? No, just a blog. Type `> help` to see available commands.",
	"Permission denied. sudo won't save you here. Try `> help`.",
] as const;

// ❯ @doc Returns a deterministic joke response based on the input string.
function getEasterEggResponse(input: string): string {
	const idx =
		input.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
		EASTER_EGG_RESPONSES.length;
	return EASTER_EGG_RESPONSES[idx];
}

// ❯ COMMAND PARSING
// ❯ @doc Strips the `>` prefix and normalizes whitespace from command input.
export function parseCommandInput(raw: string): string {
	return raw.startsWith(">") ? raw.slice(1).trim().toLowerCase() : raw.trim().toLowerCase();
}

// ❯ @doc Returns true if the input is a known Unix/system command (easter egg trigger).
export function isUnixEasterEgg(input: string): boolean {
	const base = input.split(/\s+/)[0] ?? "";
	return UNIX_COMMANDS.has(base.toLowerCase());
}

// ❯ @doc Builds the easter egg result object for a Unix command input.
export function buildEasterEgg(input: string): EasterEggResult {
	return {
		kind: "easter",
		input,
		response: getEasterEggResponse(input),
	};
}

// ❯ COMMAND MATCHING
// ❯ @doc Matches query against config-defined commands. Returns sorted matches.
export function matchCommands(
	query: string,
	commands: SearchCommand[],
): CommandMatch[] {
	if (!query) return [];
	const q = query.toLowerCase();

	return commands
		.map((command) => {
			let score = 0;
			for (const trigger of command.triggers) {
				const tl = trigger.toLowerCase();
				if (tl === q) {
					score = Math.max(score, 100);
				} else if (tl.startsWith(q) || q.startsWith(tl)) {
					score = Math.max(score, 70);
				} else if (tl.includes(q)) {
					score = Math.max(score, 40);
				}
			}
			return { command, score };
		})
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score);
}

// ❯ HELP OUTPUT
// ❯ @doc Generates a structured help listing from the command registry.
export function buildHelpLines(commands: SearchCommand[]): string[] {
	return [
		"Available commands:",
		...commands.map(
			(cmd) => `  > ${cmd.triggers[0].padEnd(14)} — ${cmd.label}`,
		),
		"",
		"Tip: Start typing without `>` to search content.",
	];
}

// ❯ ACTION EXECUTION
// ❯ @doc Executes a command action string. Supports theme:*, navigate:*, url:* protocols.
export function executeCommandAction(action: string): void {
	if (!action) return;

	if (action.startsWith("theme:")) {
		const theme = action.slice("theme:".length);
		import("@utils/theme").then(({ setTheme }) => {
			setTheme(theme as "light" | "dark" | "system");
		});
		return;
	}

	if (action.startsWith("navigate:")) {
		const path = action.slice("navigate:".length);
		import("@utils/navigation").then(({ navigateToPage }) => {
			navigateToPage(path);
		});
		return;
	}

	if (action.startsWith("url:")) {
		const url = action.slice("url:".length);
		window.open(url, "_blank", "noopener,noreferrer");
		return;
	}

	console.warn("[commands] Unknown action protocol:", action);
}
