import * as utils from '@pixi/utils';
import { Matrix2d } from '../Matrix2d'
import { ObjectRenderer, QuadUv, Shader, Renderer } from '@pixi/core';
import { DRAW_MODES, WRAP_MODES } from '@pixi/constants';
import shaderVert from './tiling-sprite.vert';
import shaderFrag from './tiling-sprite.frag';
import shaderSimpleFrag from './tiling-sprite-simple.frag';

// changed
const tempMat = new Matrix2d();

export class TilingSprite2dRenderer extends ObjectRenderer
{
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

    render(ts: any)
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
        shader.uniforms.uColor = utils.premultiplyTintToRgba(ts.tint, ts.worldAlpha,
            shader.uniforms.uColor, baseTex.premultiplyAlpha);
        shader.uniforms.translationMatrix = ts.transform.worldTransform.toArray(true);
        shader.uniforms.uSampler = tex;

        renderer.shader.bind(shader, false);
        renderer.geometry.bind(quad as any, undefined);// , renderer.shader.getGLShader());

        renderer.state.setBlendMode(utils.correctBlendMode(ts.blendMode, baseTex.premultiplyAlpha));
        renderer.geometry.draw(DRAW_MODES.TRIANGLES, 6, 0);
    }
}

Renderer.registerPlugin('tilingSprite2d', TilingSprite2dRenderer as any);
