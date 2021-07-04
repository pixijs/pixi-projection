import {
    AbstractBatchRenderer,
    ViewableBuffer,
    BatchTextureArray
} from '@pixi/core';
import { Dict, premultiplyBlendMode } from '@pixi/utils';
import { Sprite } from '@pixi/sprite';

export class UniformBatchRenderer extends AbstractBatchRenderer
{
    _iIndex: number;
    _aIndex: number;
    _dcIndex: number;
    _bufferedElements: Array<any>;
    _attributeBuffer: ViewableBuffer;
    _indexBuffer: Uint16Array;
    vertexSize: number;
    forceMaxTextures = 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getUniforms(sprite: Sprite): any
    {
        return this.defUniforms;
    }

    syncUniforms(obj: Dict<any>): void
    {
        if (!obj) return;
        const sh = this._shader;

        for (const key in obj)
        {
            sh.uniforms[key] = obj[key];
        }
    }

    defUniforms = {};

    buildDrawCalls(texArray: BatchTextureArray, start: number, finish: number): void
    {
        const thisAny = this as any;

        const {
            _bufferedElements: elements,
            _attributeBuffer,
            _indexBuffer,
            vertexSize,
        } = this;
        const drawCalls = AbstractBatchRenderer._drawCallPool;

        let dcIndex: number = this._dcIndex;
        let aIndex: number = this._aIndex;
        let iIndex: number = this._iIndex;

        let drawCall = drawCalls[dcIndex] as any;

        drawCall.start = this._iIndex;
        drawCall.texArray = texArray;

        for (let i = start; i < finish; ++i)
        {
            const sprite = elements[i];
            const tex = sprite._texture.baseTexture;
            const spriteBlendMode = premultiplyBlendMode[
                tex.alphaMode ? 1 : 0][sprite.blendMode];
            const uniforms = this.getUniforms(sprite);

            elements[i] = null;

            // here is the difference
            if (start < i && (drawCall.blend !== spriteBlendMode || drawCall.uniforms !== uniforms))
            {
                drawCall.size = iIndex - drawCall.start;
                start = i;
                drawCall = drawCalls[++dcIndex];
                drawCall.texArray = texArray;
                drawCall.start = iIndex;
            }

            this.packInterleavedGeometry(sprite, _attributeBuffer, _indexBuffer, aIndex, iIndex);
            aIndex += sprite.vertexData.length / 2 * vertexSize;
            iIndex += sprite.indices.length;

            drawCall.blend = spriteBlendMode;
            // here is the difference
            drawCall.uniforms = uniforms;
        }

        if (start < finish)
        {
            drawCall.size = iIndex - drawCall.start;
            ++dcIndex;
        }

        thisAny._dcIndex = dcIndex;
        thisAny._aIndex = aIndex;
        thisAny._iIndex = iIndex;
    }

    drawBatches(): void
    {
        const dcCount = this._dcIndex;
        const { gl, state: stateSystem, shader: shaderSystem } = this.renderer;
        const drawCalls = AbstractBatchRenderer._drawCallPool;
        let curUniforms: any = null;
        let curTexArray: BatchTextureArray = null;

        for (let i = 0; i < dcCount; i++)
        {
            const { texArray, type, size, start, blend, uniforms } = drawCalls[i] as any;

            if (curTexArray !== texArray)
            {
                curTexArray = texArray;
                this.bindAndClearTexArray(texArray);
            }
            // here is the difference
            if (curUniforms !== uniforms)
            {
                curUniforms = uniforms;
                this.syncUniforms(uniforms);
                (shaderSystem as any).syncUniformGroup((this._shader as any).uniformGroup);
            }

            this.state.blendMode = blend;
            stateSystem.set(this.state);
            gl.drawElements(type, size, gl.UNSIGNED_SHORT, start * 2);
        }
    }

    contextChange(): void
    {
        if (!this.forceMaxTextures)
        {
            super.contextChange();
            this.syncUniforms(this.defUniforms);

            return;
        }

        // we can override MAX_TEXTURES with this hack

        const thisAny = this as any;

        thisAny.MAX_TEXTURES = this.forceMaxTextures;
        this._shader = thisAny.shaderGenerator.generateShader(this.MAX_TEXTURES);
        this.syncUniforms(this.defUniforms);
        for (let i = 0; i < thisAny._packedGeometryPoolSize; i++)
        {
            /* eslint-disable max-len */
            thisAny._packedGeometries[i] = new (this.geometryClass)();
        }
        this.initFlushBuffers();
    }
}
