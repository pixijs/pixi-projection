import { Filter, RenderTexture, TextureMatrix, systems } from '@pixi/core';
import { Matrix2d } from '../Matrix2d';
import spriteMaskVert from './sprite-mask.vert';
import spriteMaskFrag from './sprite-mask.frag';

import type { Projection2d } from '../Projection2d';
import type { Sprite } from '@pixi/sprite';

const tempMat = new Matrix2d();

export class SpriteMaskFilter2d extends Filter {
	constructor(sprite: Sprite) {
		super(spriteMaskVert, spriteMaskFrag);

		sprite.renderable = false;

		this.maskSprite = sprite;
	}

	maskSprite: Sprite;
	maskMatrix = new Matrix2d();

	apply(filterManager: systems.FilterSystem, input: RenderTexture, output: RenderTexture,
			clearMode?: boolean) {
		const maskSprite = this.maskSprite;
		const tex = this.maskSprite.texture;

		if (!tex.valid)
		{
			return;
		}
		if (!tex.uvMatrix)
		{
			// margin = 0.0, let it bleed a bit, shader code becomes easier
			// assuming that atlas textures were made with 1-pixel padding
			tex.uvMatrix = new TextureMatrix(tex, 0.0);
		}
		tex.uvMatrix.update();

		this.uniforms.npmAlpha = tex.baseTexture.alphaMode ? 0.0 : 1.0;
		this.uniforms.mask = maskSprite.texture;
		this.uniforms.otherMatrix = SpriteMaskFilter2d.calculateSpriteMatrix(input, this.maskMatrix, maskSprite)
			.prepend(tex.uvMatrix.mapCoord);
		this.uniforms.alpha = maskSprite.worldAlpha;
		this.uniforms.maskClamp = tex.uvMatrix.uClampFrame;

		filterManager.applyFilter(this, input, output, clearMode);
	}

	static calculateSpriteMatrix(input: RenderTexture, mappedMatrix: Matrix2d, sprite: Sprite) {
		let proj = (sprite as any).proj as Projection2d;

		const filterArea = (input as any).filterFrame;

		const worldTransform = proj && !proj._affine ? proj.world.copyTo2dOr3d(tempMat) : tempMat.copyFrom(sprite.transform.worldTransform);
		const texture = sprite.texture.orig;

		mappedMatrix.set(input.width, 0, 0, input.height, filterArea.x, filterArea.y);
		worldTransform.invert();
		mappedMatrix.setToMult(worldTransform, mappedMatrix);
		mappedMatrix.scaleAndTranslate(1.0 / texture.width, 1.0 / texture.height,
			sprite.anchor.x, sprite.anchor.y);

		return mappedMatrix;
	}
}
