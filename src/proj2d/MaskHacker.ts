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
			oldCalculateSpriteMatrix = this.renderer.filterManager.calculateSpriteMatrix;
			this.renderer.filterManager.calculateSpriteMatrix = hackedCalculateSpriteMatrix;
		};

		destroy() {
			this.renderer.off('context', this.onContextChange);
		}
	}

	PIXI.WebGLRenderer.registerPlugin('projections', ProjectionsManager);

	let oldCalculateSpriteMatrix: any;
	let tempMat = new Matrix2d();

 	export function hackedCalculateSpriteMatrix(outputMatrix: any, sprite: any): any {
	    let proj = sprite.proj;
	    if (!proj) {
	    	return oldCalculateSpriteMatrix.call(this, outputMatrix, sprite);
	    }

	    const currentState = this.filterData.stack[this.filterData.index];
	    const filterArea = currentState.sourceFrame;
	    const textureSize = currentState.renderTarget.size;

	    const worldTransform = proj.world.copyTo(tempMat);
	    const texture = sprite._texture.baseTexture;

	    const mappedMatrix = outputMatrix.identity();

	    // scale..
	    const ratio = textureSize.height / textureSize.width;

	    mappedMatrix.translate(filterArea.x / textureSize.width, filterArea.y / textureSize.height);

	    mappedMatrix.scale(1, ratio);

	    const translateScaleX = (textureSize.width / texture.width);
	    const translateScaleY = (textureSize.height / texture.height);

	    worldTransform.tx /= texture.width * translateScaleX;

	    // this...?  free beer for anyone who can explain why this makes sense!
	    worldTransform.ty /= texture.width * translateScaleX;
	    // worldTransform.ty /= texture.height * translateScaleY;

	    worldTransform.invert();
	    mappedMatrix.prepend(worldTransform);

		// return filterTransforms.calculateSpriteMatrix(
		// 	outputMatrix,
		// 	currentState.sourceFrame,
		// 	currentState.renderTarget.size,
		// 	sprite
		// );

		//this is hack for masks
		// onContextChange() {
		// super.onContextChange();
		// this.renderer.filterManager.calculateSpriteMatrix = hackedCalculateSpriteMatrix;
	}


}
