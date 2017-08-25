namespace pixi_projection {
	export class ProjectionsManager {
		/**
		 * A reference to the current renderer
		 *
		 * @member {PIXI.WebGLRenderer}
		 */
		renderer: PIXI.WebGLRenderer;

		/**
		 * The current WebGL rendering context
		 *
		 * @member {WebGLRenderingContext}
		 */
		gl: WebGLRenderingContext;

		constructor(renderer: PIXI.WebGLRenderer) {
			this.renderer = renderer;

			renderer.on('context', this.onContextChange);
		}

		onContextChange = (gl: WebGLRenderingContext) => {
			this.gl = gl;

			this.renderer.maskManager.pushSpriteMask = pushSpriteMask;
		};

		destroy() {
			this.renderer.off('context', this.onContextChange);
		}
	}

	function pushSpriteMask(target: any, maskData: PIXI.Sprite): void {
		let alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex];

		if (!alphaMaskFilter) {
			alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex] = [new SpriteMaskFilter2d(maskData)];
		}

		alphaMaskFilter[0].resolution = this.renderer.resolution;
		alphaMaskFilter[0].maskSprite = maskData;

		// TODO - may cause issues!
		target.filterArea = maskData.getBounds(true);

		this.renderer.filterManager.pushFilter(target, alphaMaskFilter);

		this.alphaMaskIndex++;
	}

	PIXI.WebGLRenderer.registerPlugin('projections', ProjectionsManager);
}
