// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ❯ @status OK!
// ❯ @path ./src/utils/particle.ts
// ❯ @desc Particle animation system.
// ❯ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

import { particleConfig } from "@/config";
// ❯ IMPORTS
import type { ParticleConfig } from "@/types/config";

// ❯ CONSTANTS
const BOUNDARY_OFFSET = 100;

// ❯ PARTICLE CLASS
class Particle {
	x: number;
	y: number;
	s: number;
	r: number;
	a: number;
	fn: {
		x: (x: number, y: number) => number;
		y: (x: number, y: number) => number;
		r: (r: number) => number;
		a: (a: number) => number;
	};
	idx: number;
	img: HTMLImageElement;
	limitArray: number[];
	config: ParticleConfig;
	constructor(
		x: number,
		y: number,
		s: number,
		r: number,
		a: number,
		fn: {
			x: (x: number, y: number) => number;
			y: (x: number, y: number) => number;
			r: (r: number) => number;
			a: (a: number) => number;
		},
		idx: number,
		img: HTMLImageElement,
		limitArray: number[],
		config: ParticleConfig,
	) {
		this.x = x;
		this.y = y;
		this.s = s;
		this.r = r;
		this.a = a;
		this.fn = fn;
		this.idx = idx;
		this.img = img;
		this.limitArray = limitArray;
		this.config = config;
	}
	draw(cxt: CanvasRenderingContext2D) {
		cxt.save();
		cxt.translate(this.x, this.y);
		cxt.rotate(this.r);
		cxt.globalAlpha = this.a;
		cxt.drawImage(this.img, 0, 0, 40 * this.s, 40 * this.s);
		cxt.restore();
	}
	update() {
		this.x = this.fn.x(this.x, this.y);
		this.y = this.fn.y(this.y, this.y);
		this.r = this.fn.r(this.r);
		this.a = this.fn.a(this.a);
		if (
			this.x > window.innerWidth ||
			this.x < 0 ||
			this.y > window.innerHeight + BOUNDARY_OFFSET ||
			this.y < -BOUNDARY_OFFSET ||
			this.a <= 0
		) {
			if (this.limitArray[this.idx] === -1) {
				this.resetPosition();
			} else {
				if (this.limitArray[this.idx] > 0) {
					this.resetPosition();
					this.limitArray[this.idx]--;
				}
			}
		}
	}
	private resetPosition() {
		this.r = getRandom("fnr", this.config);
		if (Math.random() > 0.4) {
			this.x = getRandom("x", this.config);
			this.y = window.innerHeight + Math.random() * BOUNDARY_OFFSET; // 从屏幕底部开始
			this.s = getRandom("s", this.config);
			this.r = getRandom("r", this.config);
			this.a = getRandom("a", this.config);
		} else {
			this.x = window.innerWidth;
			this.y = getRandom("y", this.config);
			this.s = getRandom("s", this.config);
			this.r = getRandom("r", this.config);
			this.a = getRandom("a", this.config);
		}
	}
}

// ❯ PARTICLE LIST
class ParticleList {
	list: Particle[];
	constructor() {
		this.list = [];
	}
	push(particle: Particle) {
		this.list.push(particle);
	}
	update() {
		for (let i = 0, len = this.list.length; i < len; i++) {
			this.list[i].update();
		}
	}
	draw(cxt: CanvasRenderingContext2D) {
		for (let i = 0, len = this.list.length; i < len; i++) {
			this.list[i].draw(cxt);
		}
	}
	get(i: number) {
		return this.list[i];
	}
	size() {
		return this.list.length;
	}
}

// ❯ UTILITIES
// ❯ @doc Generates random values for particle properties.
function getRandom(option: string, config: ParticleConfig): any {
	let ret: any;
	let random: number;
	switch (option) {
		case "x":
			ret = Math.random() * window.innerWidth;
			break;
		case "y":
			ret = window.innerHeight + Math.random() * BOUNDARY_OFFSET;
			break;
		case "s":
			ret =
				config.size.min + Math.random() * (config.size.max - config.size.min);
			break;
		case "r":
			ret = Math.random() * 6;
			break;
		case "a":
			ret =
				config.opacity.min +
				Math.random() * (config.opacity.max - config.opacity.min);
			break;
		case "fnx":
			random =
				config.speed.horizontal.min +
				Math.random() *
					(config.speed.horizontal.max - config.speed.horizontal.min);
			ret = (x: number, y: number) => x + random;
			break;
		case "fny":
			random = -(
				config.speed.vertical.min +
				Math.random() * (config.speed.vertical.max - config.speed.vertical.min)
			);
			ret = (x: number, y: number) => y + random;
			break;
		case "fnr":
			ret = (r: number) => r + config.speed.rotation * 0.1;
			break;
		case "fna":
			ret = (alpha: number) => alpha - config.speed.fadeSpeed * 0.01;
			break;
	}
	return ret;
}

// ❯ PARTICLE MANAGER
export class ParticleManager {
	private config: ParticleConfig;
	private canvas: HTMLCanvasElement | null = null;
	private ctx: CanvasRenderingContext2D | null = null;
	private particleList: ParticleList | null = null;
	private animationId: number | null = null;
	private img: HTMLImageElement | null = null;
	private isRunning = false;
	constructor(config: ParticleConfig) {
		this.config = config;
	}
	async init(): Promise<void> {
		if (
			typeof document === "undefined" ||
			!this.config.enable ||
			this.isRunning
		) {
			return;
		}
		this.img = new Image();
		this.img.src = "/assets/images/particle.webp";
		await new Promise<void>((resolve, reject) => {
			if (this.img) {
				this.img.onload = () => resolve();
				this.img.onerror = () =>
					reject(new Error("Failed to load particle image"));
			}
		});
		this.createCanvas();
		this.createParticleList();
		this.startAnimation();
		this.isRunning = true;
	}
	private createCanvas(): void {
		if (typeof document === "undefined") return;
		this.canvas = document.createElement("canvas");
		this.canvas.height = window.innerHeight;
		this.canvas.width = window.innerWidth;
		this.canvas.setAttribute(
			"style",
			`position: fixed; left: 0; top: 0; pointer-events: none; z-index: ${this.config.zIndex};`,
		);
		this.canvas.setAttribute("id", "canvas_particle");
		document.body.appendChild(this.canvas);
		this.ctx = this.canvas.getContext("2d");
		if (typeof window !== "undefined") {
			window.addEventListener("resize", this.handleResize.bind(this));
		}
	}
	private createParticleList(): void {
		if (!this.img || !this.ctx) return;
		this.particleList = new ParticleList();
		const limitArray = new Array(this.config.particleNum).fill(
			this.config.limitTimes,
		);
		for (let i = 0; i < this.config.particleNum; i++) {
			const randomX = getRandom("x", this.config);
			const randomY = getRandom("y", this.config);
			const randomS = getRandom("s", this.config);
			const randomR = getRandom("r", this.config);
			const randomA = getRandom("a", this.config);
			const randomFnx = getRandom("fnx", this.config);
			const randomFny = getRandom("fny", this.config);
			const randomFnR = getRandom("fnr", this.config);
			const randomFnA = getRandom("fna", this.config);
			const particle = new Particle(
				randomX,
				randomY,
				randomS,
				randomR,
				randomA,
				{
					x: randomFnx,
					y: randomFny,
					r: randomFnR,
					a: randomFnA,
				},
				i,
				this.img,
				limitArray,
				this.config,
			);
			particle.draw(this.ctx);
			this.particleList.push(particle);
		}
	}
	private startAnimation(): void {
		if (!this.ctx || !this.canvas || !this.particleList) return;
		const animate = () => {
			if (!this.ctx || !this.canvas || !this.particleList) return;
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.particleList.update();
			this.particleList.draw(this.ctx);
			this.animationId = requestAnimationFrame(animate);
		};
		this.animationId = requestAnimationFrame(animate);
	}
	private handleResize(): void {
		if (this.canvas) {
			this.canvas.width = window.innerWidth;
			this.canvas.height = window.innerHeight;
		}
	}
	stop(): void {
		if (this.animationId && typeof window !== "undefined") {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
		if (this.canvas && typeof document !== "undefined") {
			document.body.removeChild(this.canvas);
			this.canvas = null;
		}
		if (typeof window !== "undefined") {
			window.removeEventListener("resize", this.handleResize.bind(this));
		}
		this.isRunning = false;
	}
	toggle(): void {
		if (this.isRunning) {
			this.stop();
		} else {
			this.init();
		}
	}
	updateConfig(newConfig: ParticleConfig): void {
		const wasRunning = this.isRunning;
		if (wasRunning) {
			this.stop();
		}
		this.config = newConfig;
		if (wasRunning && newConfig.enable) {
			this.init();
		}
	}
	getIsRunning(): boolean {
		return this.isRunning;
	}
}

// ❯ GLOBAL MANAGER
let globalParticleManager: ParticleManager | null = null;

// ❯ PUBLIC API
// ❯ @doc Initializes particle system with config.
export function initParticle(config: ParticleConfig): void {
	if (globalParticleManager) {
		globalParticleManager.updateConfig(config);
	} else {
		globalParticleManager = new ParticleManager(config);
		if (config.enable) {
			globalParticleManager.init();
		}
	}
}

// ❯ @doc Toggles particle animation on/off.
export function toggleParticle(): void {
	if (globalParticleManager) {
		globalParticleManager.toggle();
	}
}

// ❯ @doc Stops and destroys particle system.
export function stopParticle(): void {
	if (globalParticleManager) {
		globalParticleManager.stop();
		globalParticleManager = null;
	}
}

// ❯ @doc Returns current particle animation status.
export function getParticleStatus(): boolean {
	return globalParticleManager ? globalParticleManager.getIsRunning() : false;
}

// ❯ @doc Sets up particle effects on page load.
export function setupParticleEffects(): void {
	if (typeof window === "undefined") return;
	const init = () => {
		if (!particleConfig || !particleConfig.enable) return;
		if ((window as any).particleInitialized) return;
		initParticle(particleConfig);
		(window as any).particleInitialized = true;
	};
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
}
