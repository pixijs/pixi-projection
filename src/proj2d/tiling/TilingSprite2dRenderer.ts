import { Matrix2d } from '../Matrix2d';
import { ExtensionMetadata, ExtensionType, ObjectRenderer, QuadUv, Renderer, Shader } from '@pixi/core';
import { DRAW_MODES, WRAP_MODES } from '@pixi/constants';
import { correctBlendMode, premultiplyTintToRgba } from '@pixi/utils';

const shaderVert
    = `attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTransform;

varying vec3 vTextureCoord;

void main(void)
{
gl_Position.xyw = projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0);

vTextureCoord = uTransform * vec3(aTextureCoord, 1.0);
}
`;
const shaderFrag = `
varying vec3 vTextureCoord;

uniform sampler2D uSampler;
uniform vec4 uColor;
uniform mat3 uMapCoord;
uniform vec4 uClampFrame;
uniform vec2 uClampOffset;

void main(void)
{
vec2 coord = mod(vTextureCoord.xy / vTextureCoord.z - uClampOffset, vec2(1.0, 1.0)) + uClampOffset;
coord = (uMapCoord * vec3(coord, 1.0)).xy;
coord = clamp(coord, uClampFrame.xy, uClampFrame.zw);

vec4 sample = texture2D(uSampler, coord);
gl_FragColor = sample * uColor;
}
`;
const shaderSimpleFrag = `
varying vec3 vTextureCoord;

uniform sampler2D uSampler;
uniform vec4 uColor;

void main(void)
{
vec4 sample = texture2D(uSampler, vTextureCoord.xy / vTextureCoord.z);
gl_FragColor = sample * uColor;
}
`;

// changed
const tempMat = new Matrix2d();

export class TilingSprite2dRenderer extends ObjectRenderer
{
    static extension: ExtensionMetadata = {
        name: 'tilingSprite2d',
        type: ExtensionType.RendererPlugin,
    };

    constructor(renderer: Renderer)
    {
        super(renderer);

        const uniforms = { globals: this.renderer.globalUniforms };

        this.shader = Shader.from(shaderVert, shaderFrag, uniforms);

        this.simpleShader = Shader.from(shaderVert, shaderSimpleFrag, uniforms);
    }

    shader: Shader;
    simpleShader: Shader;
    quad = new QuadUv();

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    render(ts: any): void
    {
        const renderer = this.renderer;
        const quad = this.quad;

        let vertices = quad.vertices;

        vertices[0] = vertices[6] = (ts._width) * -ts.anchor.x;
        vertices[1] = vertices[3] = ts._height * -ts.anchor.y;

        vertices[2] = vertices[4] = (ts._width) * (1.0 - ts.anchor.x);
        vertices[5] = vertices[7] = ts._height * (1.0 - ts.anchor.y);

        if (ts.uvRespectAnchor)
        {
            vertices = quad.uvs;

            vertices[0] = vertices[6] = -ts.anchor.x;
            vertices[1] = vertices[3] = -ts.anchor.y;

            vertices[2] = vertices[4] = 1.0 - ts.anchor.x;
            vertices[5] = vertices[7] = 1.0 - ts.anchor.y;
        }

        quad.invalidate();

        const tex = ts._texture;
        const baseTex = tex.baseTexture;
        const lt = ts.tileProj.world;
        const uv = ts.uvMatrix;
        let isSimple = baseTex.isPowerOfTwo
            && tex.frame.width === baseTex.width && tex.frame.height === baseTex.height;

        // auto, force repeat wrapMode for big tiling textures
        if (isSimple)
        {
            if (!baseTex._glTextures[(renderer as any).CONTEXT_UID])
            {
                if (baseTex.wrapMode === WRAP_MODES.CLAMP)
                {
                    baseTex.wrapMode = WRAP_MODES.REPEAT;
                }
            }
            else
            {
                isSimple = baseTex.wrapMode !== WRAP_MODES.CLAMP;
            }
        }

        const shader = isSimple ? this.simpleShader : this.shader;

        // changed
        tempMat.identity();
        tempMat.scale(tex.width, tex.height);
        tempMat.prepend(lt);
        tempMat.scale(1.0 / ts._width, 1.0 / ts._height);

        tempMat.invert();
        if (isSimple)
        {
            tempMat.prepend(uv.mapCoord);
        }
        else
        {
            shader.uniforms.uMapCoord = uv.mapCoord.toArray(true);
            shader.uniforms.uClampFrame = uv.uClampFrame;
            shader.uniforms.uClampOffset = uv.uClampOffset;
        }

        shader.uniforms.uTransform = tempMat.toArray(true);
        shader.uniforms.uColor = premultiplyTintToRgba(ts.tint, ts.worldAlpha,
            shader.uniforms.uColor, baseTex.premultiplyAlpha);
        shader.uniforms.translationMatrix = ts.worldTransform.toArray(true);
        shader.uniforms.uSampler = tex;

        renderer.shader.bind(shader, false);
        renderer.geometry.bind(quad as any, undefined);// , renderer.shader.getGLShader());

        renderer.state.setBlendMode(correctBlendMode(ts.blendMode, baseTex.premultiplyAlpha));
        renderer.geometry.draw(DRAW_MODES.TRIANGLES, 6, 0);
    }
}
