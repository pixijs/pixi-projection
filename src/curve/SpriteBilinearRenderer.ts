/// <reference path="../types.d.ts" />

import { BatchShaderGenerator, Buffer, Geometry, Renderer, ViewableBuffer } from '@pixi/core';
import { Matrix } from '@pixi/math';
import { Sprite } from '@pixi/sprite';
import { Sprite2s } from './sprites/Sprite2s';
import { TYPES } from '@pixi/constants';
import { UniformBatchRenderer } from '../base/webgl/UniformBatchRenderer';
import { premultiplyTint } from '@pixi/utils';
import shaderVert from './sprite-bilinear.vert';
import shaderFrag from './sprite-bilinear.frag';

export class BatchBilineardGeometry extends Geometry
{
	_buffer: Buffer;
	_indexBuffer : Buffer;

	constructor(_static = false)
	{
		super();

		this._buffer = new Buffer(null, _static, false);

		this._indexBuffer = new Buffer(null, _static, true);

		this.addAttribute('aVertexPosition', this._buffer, 2, false, TYPES.FLOAT)
			.addAttribute('aTrans1', this._buffer, 3, false, TYPES.FLOAT)
			.addAttribute('aTrans2', this._buffer, 3, false, TYPES.FLOAT)
			.addAttribute('aSamplerSize', this._buffer, 2, false, TYPES.FLOAT)
			.addAttribute('aFrame', this._buffer, 4, false, TYPES.FLOAT)
			.addAttribute('aColor', this._buffer, 4, true, TYPES.UNSIGNED_BYTE)
			.addAttribute('aTextureId', this._buffer, 1, true, TYPES.FLOAT)
			.addIndex(this._indexBuffer);
	}
}

export class BatchBilinearPluginFactory {
	static create(options: any): any
	{
		const { vertex, fragment, vertexSize, geometryClass } = (Object as any).assign({
			vertex: shaderVert,
			fragment: shaderFrag,
			geometryClass: BatchBilineardGeometry,
			vertexSize: 16,
		}, options);

		return class BatchPlugin extends UniformBatchRenderer
		{
			constructor(renderer: Renderer)
			{
				super(renderer);

				this.shaderGenerator = new BatchShaderGenerator(vertex, fragment);
				this.geometryClass = geometryClass;
				this.vertexSize = vertexSize;
			}

			defUniforms = {
				translationMatrix: new Matrix(),
				distortion: new Float32Array([0, 0, Infinity, Infinity])
			};
			size = 1000;
			forceMaxTextures = 1;

			getUniforms(sprite: Sprite) {
				let  { proj } = sprite as Sprite2s;
				if (proj.surface !== null) {
					return proj.uniforms;
				}
				if (proj._activeProjection !== null) {
					return proj._activeProjection.uniforms;
				}
				return this.defUniforms;
			}

			packInterleavedGeometry(element: any, attributeBuffer: ViewableBuffer, indexBuffer: Uint16Array, aIndex: number, iIndex: number)
			{
				const {
					uint32View,
					float32View,
				} = attributeBuffer;
				const p = aIndex / this.vertexSize;
				const indices = element.indices;
				const vertexData = element.vertexData;
				const tex = element._texture;
				const frame = tex._frame;
				const aTrans = element.aTrans;
				const { _batchLocation, realWidth, realHeight, resolution } = element._texture.baseTexture;

				const alpha = Math.min(element.worldAlpha, 1.0);

				const argb = alpha < 1.0 && element._texture.baseTexture.alphaMode ? premultiplyTint(element._tintRGB, alpha)
					: element._tintRGB + (alpha * 255 << 24);

				for (let i = 0; i < vertexData.length; i += 2)
				{
					float32View[aIndex] = vertexData[i];
					float32View[aIndex + 1] = vertexData[i + 1];

					float32View[aIndex + 2] = aTrans.a;
					float32View[aIndex + 3] = aTrans.c;
					float32View[aIndex + 4] = aTrans.tx;
					float32View[aIndex + 5] = aTrans.b;
					float32View[aIndex + 6] = aTrans.d;
					float32View[aIndex + 7] = aTrans.ty;

					float32View[aIndex + 8] = realWidth;
					float32View[aIndex + 9] = realHeight;
					float32View[aIndex + 10] = frame.x * resolution;
					float32View[aIndex + 11] = frame.y * resolution;
					float32View[aIndex + 12] = (frame.x + frame.width) * resolution;
					float32View[aIndex + 13] = (frame.y + frame.height) * resolution;

					uint32View[aIndex + 14] = argb;
					float32View[aIndex + 15] = _batchLocation;
					aIndex += 16;
				}

				for (let i = 0; i < indices.length; i++)
				{
					indexBuffer[iIndex++] = p + indices[i];
				}
			}
		};
	}
}

Renderer.registerPlugin('batch_bilinear', BatchBilinearPluginFactory.create({}));
