import { Sprite } from '@pixi/sprite';
import { Matrix2d } from '../Matrix2d';
import { Filter, FilterSystem, RenderTexture, TextureMatrix } from '@pixi/core';
import { Projection2d } from '../Projection2d';

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
uniform sampler2D mask;
uniform float alpha;
uniform vec4 maskClamp;

void main(void)
{
vec2 uv = vMaskCoord.xy / vMaskCoord.z;

float clip = step(3.5,
    step(maskClamp.x, uv.x) +
    step(maskClamp.y, uv.y) +
    step(uv.x, maskClamp.z) +
    step(uv.y, maskClamp.w));

vec4 original = texture2D(uSampler, vTextureCoord);
vec4 masky = texture2D(mask, uv);

original *= (masky.r * masky.a * alpha * clip);

gl_FragColor = original;
}
`;

const tempMat = new Matrix2d();

export class SpriteMaskFilter2d extends Filter
{
    constructor(sprite: Sprite)
    {
        super(spriteMaskVert, spriteMaskFrag);

        sprite.renderable = false;

        this.maskSprite = sprite;
    }

    maskSprite: Sprite;
    maskMatrix = new Matrix2d();

    apply(filterManager: FilterSystem, input: RenderTexture, output: RenderTexture,
        clearMode?: number): void
    {
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

    static calculateSpriteMatrix(input: RenderTexture, mappedMatrix: Matrix2d, sprite: Sprite): Matrix2d
    {
        const proj = (sprite as any).proj as Projection2d;

        const filterArea = (input as any).filterFrame;

        // eslint-disable-next-line max-len
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
