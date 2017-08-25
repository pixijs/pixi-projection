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

			if (this.renderer.filterManager) {
				oldCalculateSpriteMatrix = this.renderer.filterManager.calculateSpriteMatrix;
				this.renderer.filterManager.calculateSpriteMatrix = hackedCalculateSpriteMatrix;
			} else {
				let flag = false;

				//pixi 4.5.4 has a bug with filterManager
				oldSpriteMaskApply = PIXI.SpriteMaskFilter.prototype.apply;
				PIXI.SpriteMaskFilter.prototype.apply = function (filterManager: any, input: any, output: any) {
					if (!flag) {
						oldCalculateSpriteMatrix = filterManager.calculateSpriteMatrix;
						filterManager.calculateSpriteMatrix = hackedCalculateSpriteMatrix;
					}
					oldSpriteMaskApply.call(this, filterManager, input, output);
				};
			}
		};

		destroy() {
			this.renderer.off('context', this.onContextChange);
		}
	}

	PIXI.WebGLRenderer.registerPlugin('projections', ProjectionsManager);

	let oldSpriteMaskApply: any;
	let oldCalculateSpriteMatrix: any;

	let tempMat = new Matrix2d();
	let tempMat2 = new Matrix2d();

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

		outputMatrix.identity();
		tempMat2.mat3 = outputMatrix.toArray(true);
		const mappedMatrix = tempMat2;

		// scale..
		const ratio = textureSize.height / textureSize.width;

		mappedMatrix.translate(filterArea.x / textureSize.width, filterArea.y / textureSize.height);

		mappedMatrix.scale(1, ratio);

		const translateScaleX = (textureSize.width / texture.width);
		const translateScaleY = (textureSize.height / texture.height);

		worldTransform.tx /= texture.width * translateScaleX;
		worldTransform.ty /= texture.width * translateScaleX;

		worldTransform.invert();
		mappedMatrix.setToMult2d(worldTransform, mappedMatrix);

		mappedMatrix.scale(1, 1 / ratio);

		mappedMatrix.scale(translateScaleX, translateScaleY);

		mappedMatrix.translate(sprite.anchor.x, sprite.anchor.y);

		return tempMat2.mat3;
	}
}
