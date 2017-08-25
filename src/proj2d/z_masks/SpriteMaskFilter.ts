namespace pixi_projection {
	const spriteMaskVert = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 otherMatrix;

varying vec3 vMaskCoord;
varying vec2 vTextureCoord;

void main(void)
{
	gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

	vTextureCoord = aTextureCoord;
	vMaskCoord = otherMatrix * vec3( aTextureCoord, 1.0);
}
`;
	const spriteMaskFrag = `
varying vec3 vMaskCoord;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform float alpha;
uniform sampler2D mask;

void main(void)
{
    vec2 uv = vMaskCoord.xy / vMaskCoord.z;
    
    vec2 text = abs( uv - 0.5 );
    text = step(0.5, text);

    float clip = 1.0 - max(text.y, text.x);
    vec4 original = texture2D(uSampler, vTextureCoord);
    vec4 masky = texture2D(mask, uv);

    original *= (masky.r * masky.a * alpha * clip);

    gl_FragColor = original;
}
`;

	const tempMat = new Matrix2d();

	export class SpriteMaskFilter2d extends PIXI.Filter {
		constructor(sprite) {
			super(spriteMaskVert, spriteMaskFrag);

			sprite.renderable = false;

			this.maskSprite = sprite;
		}

		maskSprite: PIXI.Sprite;
		maskMatrix = new Matrix2d();

		apply(filterManager: PIXI.FilterManager, input: PIXI.RenderTarget, output: PIXI.RenderTarget,
		      clear?: boolean, currentState?: any) {
			const maskSprite = this.maskSprite;

			this.uniforms.mask = maskSprite.texture;
			this.uniforms.otherMatrix = SpriteMaskFilter2d.calculateSpriteMatrix(currentState, this.maskMatrix, maskSprite);
			this.uniforms.alpha = maskSprite.worldAlpha;

			filterManager.applyFilter(this, input, output);
		}

		static calculateSpriteMatrix(currentState: any, mappedMatrix: Matrix2d, sprite: PIXI.Sprite) {
			let proj = (sprite as any).proj as Projection2d;

			const filterArea = currentState.sourceFrame;
			const textureSize = currentState.renderTarget.size;

			const worldTransform = proj && !proj._affine ? proj.world.copyTo(tempMat) : tempMat.copyFrom(sprite.transform.worldTransform);
			const texture = sprite.texture.orig;

			mappedMatrix.set(textureSize.width, 0, 0, textureSize.height, filterArea.x, filterArea.y);
			worldTransform.invert();
			mappedMatrix.setToMult2d(worldTransform, mappedMatrix);
			mappedMatrix.scaleAndTranslate(1.0 / texture.width, 1.0 / texture.height,
				sprite.anchor.x, sprite.anchor.y);

			return mappedMatrix;
		}
	}
}