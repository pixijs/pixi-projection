declare namespace PIXI {
	export interface Transform {
		proj?: PIXI.projection.AbstractProjection;
	}

	export interface ObservablePoint {
		_x?: number;
		_y?: number;
	}
}

module PIXI.projection {
	export class AbstractProjection {

		constructor(legacy: PIXI.Transform, enable: boolean = true) {
			this.legacy = legacy;

			if (enable) {
				this.enabled = true;
			}

			// sorry for hidden class, it would be good to have special projection field in official pixi
			this.legacy.proj = this;
		}

		legacy: PIXI.Transform;

		_enabled: boolean = false;

		get enabled() {
			return this._enabled;
		}

		set enabled(value: boolean) {
			this._enabled = value;
		}

		clear() {
		}
	}

	export enum TRANSFORM_STEP {
		NONE = 0,
		// POS = 1,
		// ROT = 2,
		// SCALE = 3,
		// PIVOT = 4,
		BEFORE_PROJ = 4,
		PROJ = 5,
		// POS_2 = 6,
		// ROT_2 = 7,
		// SCALE_2 = 8,
		// PIVOT_2 = 9,
		ALL = 9
	}
}
module PIXI.projection {
	function transformHack(this: PIXI.Transform, parentTransform: PIXI.Transform) {
		// implementation here
		const proj = this.proj as LinearProjection<any>;
		const ta = this as any;
		const pwid = (parentTransform as any)._worldID;

		const lt = ta.localTransform;
		const scaleAfterAffine = proj.scaleAfterAffine && proj.affine >= 2;

		//this part is copied from
		if (ta._localID !== ta._currentLocalID) {
			// get the matrix values of the displayobject based on its transform properties..
			if (scaleAfterAffine) {
				lt.a = ta._cx;
				lt.b = ta._sx;
				lt.c = ta._cy;
				lt.d = ta._sy;

				lt.tx = ta.position._x;
				lt.ty = ta.position._y;
			} else {
				lt.a = ta._cx * ta.scale._x;
				lt.b = ta._sx * ta.scale._x;
				lt.c = ta._cy * ta.scale._y;
				lt.d = ta._sy * ta.scale._y;

				lt.tx = ta.position._x - ((ta.pivot._x * lt.a) + (ta.pivot._y * lt.c));
				lt.ty = ta.position._y - ((ta.pivot._x * lt.b) + (ta.pivot._y * lt.d));
			}

			ta._currentLocalID = ta._localID;

			// force an update..
			proj._currentProjID = -1;
		}

		const _matrixID = proj._projID;
		if (proj._currentProjID !== _matrixID) {
			proj._currentProjID = _matrixID;
			proj.updateLocalTransform(lt);
			ta._parentID = -1;
		}

		if (ta._parentID !== pwid) {
			const pp = parentTransform.proj as Projection2d;
			if (pp && !pp._affine) {
				proj.world.setToMult(pp.world, proj.local);
			} else {
				proj.world.setToMultLegacy(parentTransform.worldTransform, proj.local);
			}

			let wa = ta.worldTransform;

			proj.world.copyTo(wa, proj._affine, proj.affinePreserveOrientation);

			if (scaleAfterAffine) {
				wa.a *= ta.scale._x;
				wa.b *= ta.scale._x;
				wa.c *= ta.scale._y;
				wa.d *= ta.scale._y;

				wa.tx -= ((ta.pivot._x * wa.a) + (ta.pivot._y * wa.c));
				wa.ty -= ((ta.pivot._x * wa.b) + (ta.pivot._y * wa.d));
			}
			ta._parentID = pwid;
			ta._worldID++;
		}
	}

	export class LinearProjection<T> extends AbstractProjection {
		updateLocalTransform(lt: PIXI.Matrix) {

		}

		_projID = 0;
		_currentProjID = -1;
		_affine = AFFINE.NONE;
		affinePreserveOrientation = false;
		scaleAfterAffine = true;

		set affine(value: AFFINE) {
			if (this._affine == value) return;
			this._affine = value;
			this._currentProjID = -1;
			// this is because scaleAfterAffine
			(this.legacy as any)._currentLocalID = -1;
		}

		get affine() {
			return this._affine;
		}

		local: T;
		world: T;

		set enabled(value: boolean) {
			if (value === this._enabled) {
				return;
			}
			this._enabled = value;
			if (value) {
				this.legacy.updateTransform = transformHack;
				(this.legacy as any)._parentID = -1;
			} else {
				this.legacy.updateTransform = PIXI.Transform.prototype.updateTransform;
				(this.legacy as any)._parentID = -1;
			}
		}

		clear() {
			this._currentProjID = -1;
			this._projID = 0;
		}
	}
}
module PIXI.projection {
	import TYPES = PIXI.TYPES;
	import premultiplyTint = PIXI.utils.premultiplyTint;

	const shaderVert =
		`precision highp float;
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec4 aColor;
attribute float aTextureId;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;

void main(void){
	gl_Position.xyw = projectionMatrix * aVertexPosition;
	gl_Position.z = 0.0;

	vTextureCoord = aTextureCoord;
	vTextureId = aTextureId;
	vColor = aColor;
}
`;
	const shaderFrag = `
varying vec2 vTextureCoord;
varying vec4 vColor;
varying float vTextureId;
uniform sampler2D uSamplers[%count%];

void main(void){
vec4 color;
%forloop%
gl_FragColor = color * vColor;
}`;

	export class Batch3dGeometry extends PIXI.Geometry
	{
		_buffer: PIXI.Buffer;
		_indexBuffer : PIXI.Buffer;

		constructor(_static = false)
		{
			super();

			this._buffer = new PIXI.Buffer(null, _static, false);

			this._indexBuffer = new PIXI.Buffer(null, _static, true);

			this.addAttribute('aVertexPosition', this._buffer, 3, false, TYPES.FLOAT)
				.addAttribute('aTextureCoord', this._buffer, 2, false, TYPES.FLOAT)
				.addAttribute('aColor', this._buffer, 4, true, TYPES.UNSIGNED_BYTE)
				.addAttribute('aTextureId', this._buffer, 1, true, TYPES.FLOAT)
				.addIndex(this._indexBuffer);
		}
	}

	export class Batch2dPluginFactory {
		static create(options: any): any
		{
			const { vertex, fragment, vertexSize, geometryClass } = (Object as any).assign({
				vertex: shaderVert,
				fragment: shaderFrag,
				geometryClass: Batch3dGeometry,
				vertexSize: 7,
			}, options);

			return class BatchPlugin extends PIXI.AbstractBatchRenderer
			{
				constructor(renderer: PIXI.Renderer)
				{
					super(renderer);

					this.shaderGenerator = new PIXI.BatchShaderGenerator(vertex, fragment);
					this.geometryClass = geometryClass;
					this.vertexSize = vertexSize;
				}

				vertexSize: number;

				packInterleavedGeometry(element: any, attributeBuffer: PIXI.ViewableBuffer, indexBuffer: Uint16Array, aIndex: number, iIndex: number)
				{
					const {
						uint32View,
						float32View,
					} = attributeBuffer;

					const p = aIndex / this.vertexSize;// float32View.length / 6 / 2;
					const uvs = element.uvs;
					const indices = element.indices;// geometry.getIndex().data;// indicies;
					const vertexData = element.vertexData;
					const vertexData2d = element.vertexData2d;
					const textureId = element._texture.baseTexture._batchLocation;

					const alpha = Math.min(element.worldAlpha, 1.0);

					const argb = alpha < 1.0 && element._texture.baseTexture.alphaMode ? premultiplyTint(element._tintRGB, alpha)
						: element._tintRGB + (alpha * 255 << 24);

					if (vertexData2d) {
						let j = 0;
						for (let i = 0; i < vertexData2d.length; i += 3, j += 2)
						{
							float32View[aIndex++] = vertexData2d[i];
							float32View[aIndex++] = vertexData2d[i + 1];
							float32View[aIndex++] = vertexData2d[i + 2];
							float32View[aIndex++] = uvs[j];
							float32View[aIndex++] = uvs[j + 1];
							uint32View[aIndex++] = argb;
							float32View[aIndex++] = textureId;
						}
					} else {
						for (let i = 0; i < vertexData.length; i += 2)
						{
							float32View[aIndex++] = vertexData[i];
							float32View[aIndex++] = vertexData[i + 1];
							float32View[aIndex++] = 1.0;
							float32View[aIndex++] = uvs[i];
							float32View[aIndex++] = uvs[i + 1];
							uint32View[aIndex++] = argb;
							float32View[aIndex++] = textureId;
						}
					}

					for (let i = 0; i < indices.length; i++)
					{
						indexBuffer[iIndex++] = p + indices[i];
					}
				}
			};
		}
	}

	PIXI.Renderer.registerPlugin('batch2d', Batch2dPluginFactory.create({}));
}
module PIXI.projection {
	import AbstractBatchRenderer = PIXI.AbstractBatchRenderer;
	import premultiplyBlendMode = PIXI.utils.premultiplyBlendMode;

	export class UniformBatchRenderer extends AbstractBatchRenderer {
		_iIndex: number;
		_aIndex: number;
		_dcIndex: number;
		_bufferedElements: Array<any>;
		_attributeBuffer: PIXI.ViewableBuffer;
		_indexBuffer: Uint16Array;
		vertexSize: number;
		forceMaxTextures = 0;

		getUniforms(sprite: PIXI.Sprite): any {
			return this.defUniforms;
		}

		syncUniforms(obj: any) {
			if (!obj) return;
			let sh = this._shader;
			for (let key in obj) {
				sh.uniforms[key] = obj[key];
			}
		}

		defUniforms = {};

		buildDrawCalls(texArray: PIXI.BatchTextureArray, start: number, finish: number)
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

		drawBatches() {
			const dcCount = this._dcIndex;
			const {gl, state: stateSystem, shader: shaderSystem} = this.renderer;
			const drawCalls = AbstractBatchRenderer._drawCallPool;
			let curUniforms: any = null;
			let curTexArray: PIXI.BatchTextureArray = null;

			for (let i = 0; i < dcCount; i++) {
				const {texArray, type, size, start, blend, uniforms} = drawCalls[i] as any;

				if (curTexArray !== texArray) {
					curTexArray = texArray;
					this.bindAndClearTexArray(texArray);
				}
				// here is the difference
				if (curUniforms !== uniforms) {
					curUniforms = uniforms;
					this.syncUniforms(uniforms);
					(shaderSystem as any).syncUniformGroup((this._shader as any).uniformGroup);
				}

				this.state.blendMode = blend;
				stateSystem.set(this.state);
				gl.drawElements(type, size, gl.UNSIGNED_SHORT, start * 2);
			}
		}

		contextChange()
		{
			if (!this.forceMaxTextures) {
				super.contextChange();
				this.syncUniforms(this.defUniforms);
				return;
			}

			// we can override MAX_TEXTURES with this hack

			const gl = this.renderer.gl;
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
}
module PIXI.projection {
	import IPointData = PIXI.IPointData;

	const p = [new PIXI.Point(), new PIXI.Point(), new PIXI.Point(), new PIXI.Point()];
	const a = [0, 0, 0, 0];

	export abstract class Surface implements IWorldTransform {
		surfaceID = "default";

		_updateID: number = 0;

		vertexSrc: string = "";
		fragmentSrc: string = "";

		fillUniforms(uniforms: any) {

		}

		clear() {

		}

		/**
		 * made for bilinear, other things will need adjustments, like test if (0) is inside
		 * @param {ArrayLike<number>} v
		 * @param out
		 * @param {PIXI.Matrix} after
		 */
		boundsQuad(v: ArrayLike<number>, out: any, after?: PIXI.Matrix) {
			let minX = out[0], minY = out[1];
			let maxX = out[0], maxY = out[1];
			for (let i = 2; i < 8; i += 2) {
				if (minX > out[i]) minX = out[i];
				if (maxX < out[i]) maxX = out[i];
				if (minY > out[i + 1]) minY = out[i + 1];
				if (maxY < out[i + 1]) maxY = out[i + 1];
			}

			p[0].set(minX, minY);
			this.apply(p[0], p[0]);
			p[1].set(maxX, minY);
			this.apply(p[1], p[1]);
			p[2].set(maxX, maxY);
			this.apply(p[2], p[2]);
			p[3].set(minX, maxY);
			this.apply(p[3], p[3]);

			if (after) {
				after.apply(p[0], p[0]);
				after.apply(p[1], p[1]);
				after.apply(p[2], p[2]);
				after.apply(p[3], p[3]);
				out[0] = p[0].x;
				out[1] = p[0].y;
				out[2] = p[1].x;
				out[3] = p[1].y;
				out[4] = p[2].x;
				out[5] = p[2].y;
				out[6] = p[3].x;
				out[7] = p[3].y;
			} else {
				for (let i = 1; i <= 3; i++) {
					if (p[i].y < p[0].y || p[i].y == p[0].y && p[i].x < p[0].x) {
						let t = p[0];
						p[0] = p[i];
						p[i] = t;
					}
				}

				for (let i = 1; i <= 3; i++) {
					a[i] = Math.atan2(p[i].y - p[0].y, p[i].x - p[0].x);
				}
				for (let i = 1; i <= 3; i++) {
					for (let j = i + 1; j <= 3; j++) {
						if (a[i] > a[j]) {
							let t = p[i];
							p[i] = p[j];
							p[j] = t;
							let t2 = a[i];
							a[i] = a[j];
							a[j] = t2;
						}
					}
				}

				out[0] = p[0].x;
				out[1] = p[0].y;
				out[2] = p[1].x;
				out[3] = p[1].y;
				out[4] = p[2].x;
				out[5] = p[2].y;
				out[6] = p[3].x;
				out[7] = p[3].y;

				if ((p[3].x - p[2].x) * (p[1].y - p[2].y) - (p[1].x - p[2].x) * (p[3].y - p[2].y) < 0) {
					//triangle!!!
					out[4] = p[3].x;
					out[5] = p[3].y;
					return;
				}
			}
		}

		abstract apply(pos: IPointData, newPos: IPointData): IPointData;

		//TODO: remove props
		abstract applyInverse(pos: IPointData, newPos: IPointData): IPointData;
	}
}
module PIXI.projection {
	import IPointData = PIXI.IPointData;
	import IPoint = PIXI.IPoint;

	const tempMat = new PIXI.Matrix();
	const tempRect = new PIXI.Rectangle();
	const tempPoint = new PIXI.Point();

	export class BilinearSurface extends Surface {
		distortion = new PIXI.Point();

		constructor() {
			super();
		}

		clear() {
			this.distortion.set(0, 0);
		}

		apply(pos: IPointData, newPos?: IPointData): IPointData {
			newPos = newPos || new PIXI.Point();
			const d = this.distortion;
			const m = pos.x * pos.y;
			newPos.x = pos.x + d.x * m;
			newPos.y = pos.y + d.y * m;
			return newPos;
		}

		applyInverse(pos: IPointData, newPos: IPoint): IPointData {
			newPos = newPos || new PIXI.Point();
			const vx = pos.x, vy = pos.y;
			const dx = this.distortion.x, dy = this.distortion.y;

			if (dx == 0.0) {
				newPos.x = vx;
				newPos.y = vy / (1.0 + dy * vx);
			} else
			if (dy == 0.0) {
				newPos.y = vy;
				newPos.x = vx/ (1.0 + dx * vy);
			} else {
				const b = (vy * dx - vx * dy + 1.0) * 0.5 / dy;
				const d = b * b + vx / dy;

				if (d <= 0.00001) {
					newPos.set(NaN, NaN);
					return newPos;
				}
				if (dy > 0.0) {
					newPos.x = - b + Math.sqrt(d);
				} else {
					newPos.x = - b - Math.sqrt(d);
				}
				newPos.y = (vx / newPos.x - 1.0) / dx;
			}
			return newPos;
		}

		mapSprite(sprite: PIXI.Sprite, quad: Array<IPointData>, outTransform?: PIXI.Transform) {
			const tex = sprite.texture;

			tempRect.x = -sprite.anchor.x * tex.orig.width;
			tempRect.y = -sprite.anchor.y * tex.orig.height;
			tempRect.width = tex.orig.width;
			tempRect.height = tex.orig.height;

			return this.mapQuad(tempRect, quad, outTransform || sprite.transform as PIXI.Transform);
		}

		mapQuad(rect: PIXI.Rectangle, quad: Array<IPointData>, outTransform: PIXI.Transform) {
			const ax = -rect.x / rect.width;
			const ay = -rect.y / rect.height;

			const ax2 = (1.0 - rect.x) / rect.width;
			const ay2 = (1.0 - rect.y) / rect.height;

			const up1x = (quad[0].x * (1.0 - ax) + quad[1].x * ax);
			const up1y = (quad[0].y * (1.0 - ax) + quad[1].y * ax);
			const up2x = (quad[0].x * (1.0 - ax2) + quad[1].x * ax2);
			const up2y = (quad[0].y * (1.0 - ax2) + quad[1].y * ax2);

			const down1x = (quad[3].x * (1.0 - ax) + quad[2].x * ax);
			const down1y = (quad[3].y * (1.0 - ax) + quad[2].y * ax);
			const down2x = (quad[3].x * (1.0 - ax2) + quad[2].x * ax2);
			const down2y = (quad[3].y * (1.0 - ax2) + quad[2].y * ax2);

			const x00 = up1x * (1.0 - ay) + down1x * ay;
			const y00 = up1y * (1.0 - ay) + down1y * ay;

			const x10 = up2x * (1.0 - ay) + down2x * ay;
			const y10 = up2y * (1.0 - ay) + down2y * ay;

			const x01 = up1x * (1.0 - ay2) + down1x * ay2;
			const y01 = up1y * (1.0 - ay2) + down1y * ay2;

			const x11 = up2x * (1.0 - ay2) + down2x * ay2;
			const y11 = up2y * (1.0 - ay2) + down2y * ay2;

			const mat = tempMat;
			mat.tx = x00;
			mat.ty = y00;
			mat.a = x10 - x00;
			mat.b = y10 - y00;
			mat.c = x01 - x00;
			mat.d = y01 - y00;
			tempPoint.set(x11, y11);
			mat.applyInverse(tempPoint, tempPoint);
			this.distortion.set(tempPoint.x - 1, tempPoint.y - 1);

			outTransform.setFromMatrix(mat);

			return this;
		}

		fillUniforms(uniforms: any) {
			uniforms.distortion = uniforms.distortion || new Float32Array([0, 0, 0, 0]);
			const ax = Math.abs(this.distortion.x);
			const ay = Math.abs(this.distortion.y);

			uniforms.distortion[0] = ax * 10000 <= ay ? 0 : this.distortion.x;
			uniforms.distortion[1] = ay * 10000 <= ax ? 0 : this.distortion.y;
			uniforms.distortion[2] = 1.0 / uniforms.distortion[0];
			uniforms.distortion[3] = 1.0 / uniforms.distortion[1];
		}
	}
}
module PIXI.projection {
	export class Container2s extends PIXI.Container {
		constructor() {
			super();
			this.proj = new ProjectionSurface(this.transform);
		}

		proj: ProjectionSurface;

		get worldTransform() {
			return this.proj as any;
		}
	}
}
declare namespace PIXI {
	interface Matrix extends PIXI.projection.IWorldTransform {
		apply(pos: IPointData, newPos?: IPointData): IPointData;

		applyInverse(pos: IPointData, newPos?: IPointData): IPointData;
	}
}

module PIXI.projection {
	import IPointData = PIXI.IPointData;

	const fun = PIXI.Transform.prototype.updateTransform;

	export interface IWorldTransform {
		apply(pos: IPointData, newPos: IPointData): IPointData;

		//TODO: remove props
		applyInverse(pos: IPointData, newPos: IPointData): IPointData;
	}

	function transformHack(this: PIXI.Transform, parentTransform: PIXI.Transform): IWorldTransform {
		const proj = this.proj as ProjectionSurface;

		const pp = parentTransform.proj as ProjectionSurface;
		const ta = this as any;

		if (!pp) {
			fun.call(this, parentTransform);
			proj._activeProjection = null;
			return;
		}

		if (pp._surface) {
			proj._activeProjection = pp;
			this.updateLocalTransform();
			this.localTransform.copyTo(this.worldTransform);
			if (ta._parentID < 0) {
				++ta._worldID;
			}
			return;
		}

		fun.call(this, parentTransform);
		proj._activeProjection = pp._activeProjection;
	}

	export class ProjectionSurface extends AbstractProjection {
		constructor(legacy: PIXI.Transform, enable?: boolean) {
			super(legacy, enable);
		}

		_surface: Surface = null;
		_activeProjection: ProjectionSurface = null;

		set enabled(value: boolean) {
			if (value === this._enabled) {
				return;
			}
			this._enabled = value;
			if (value) {
				this.legacy.updateTransform = transformHack;
				(this.legacy as any)._parentID = -1;
			} else {
				this.legacy.updateTransform = PIXI.Transform.prototype.updateTransform;
				(this.legacy as any)._parentID = -1;
			}
		}

		get surface() {
			return this._surface;
		}

		set surface(value: Surface) {
			if (this._surface == value) {
				return;
			}
			this._surface = value || null;
			(this.legacy as any)._parentID = -1;
		}

		applyPartial(pos: IPointData, newPos?: IPointData): IPointData {
			if (this._activeProjection !== null) {
				newPos = this.legacy.worldTransform.apply(pos, newPos);
				return this._activeProjection.surface.apply(newPos, newPos);
			}
			if (this._surface !== null) {
				return this.surface.apply(pos, newPos);
			}
			return this.legacy.worldTransform.apply(pos, newPos);
		}

		apply(pos: IPointData, newPos?: IPointData): IPointData {
			if (this._activeProjection !== null) {
				newPos = this.legacy.worldTransform.apply(pos, newPos);
				this._activeProjection.surface.apply(newPos, newPos);
				return this._activeProjection.legacy.worldTransform.apply(newPos, newPos);
			}
			if (this._surface !== null) {
				newPos = this.surface.apply(pos, newPos);
				return this.legacy.worldTransform.apply(newPos, newPos);
			}
			return this.legacy.worldTransform.apply(pos, newPos);
		}

		applyInverse(pos: IPointData, newPos: IPointData) {
			if (this._activeProjection !== null) {
				newPos = this._activeProjection.legacy.worldTransform.applyInverse(pos, newPos);
				this._activeProjection._surface.applyInverse(newPos, newPos);
				return this.legacy.worldTransform.applyInverse(newPos, newPos);
			}
			if (this._surface !== null) {
				newPos = this.legacy.worldTransform.applyInverse(pos, newPos);
				return this._surface.applyInverse(newPos, newPos);
			}
			return this.legacy.worldTransform.applyInverse(pos, newPos);
		}

		mapBilinearSprite(sprite: PIXI.Sprite, quad: Array<IPointData>) {
			if (!(this._surface instanceof BilinearSurface)) {
				this.surface = new BilinearSurface();
			}
			(this.surface as BilinearSurface).mapSprite(sprite, quad, this.legacy);
		}

		_currentSurfaceID = -1;
		_currentLegacyID = -1;
		_lastUniforms : any = null;

		clear() {
			if (this.surface) {
				this.surface.clear();
			}
		}

		get uniforms(): any {
			if (this._currentLegacyID === (this.legacy as any)._worldID &&
				this._currentSurfaceID === this.surface._updateID) {

				return this._lastUniforms;
			}

			this._lastUniforms = this._lastUniforms || {};
			this._lastUniforms.translationMatrix = this.legacy.worldTransform;
			this._surface.fillUniforms(this._lastUniforms);
			return this._lastUniforms;
		}
	}
}
module PIXI.projection {
	import TYPES = PIXI.TYPES;
	import premultiplyTint = PIXI.utils.premultiplyTint;

	//TODO: Work in progress

	const shaderVert = `precision highp float;
attribute vec2 aVertexPosition;
attribute vec3 aTrans1;
attribute vec3 aTrans2;
attribute vec2 aSamplerSize;
attribute vec4 aFrame;
attribute vec4 aColor;
attribute float aTextureId;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;

varying vec2 vertexPosition;
varying vec3 vTrans1;
varying vec3 vTrans2;
varying vec2 vSamplerSize;
varying vec4 vFrame;
varying vec4 vColor;
varying float vTextureId;

void main(void){
	gl_Position.xyw = projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0);
	gl_Position.z = 0.0;

	vertexPosition = aVertexPosition;
	vTrans1 = aTrans1;
	vTrans2 = aTrans2;
	vTextureId = aTextureId;
	vColor = aColor;
	vSamplerSize = aSamplerSize;
	vFrame = aFrame;
}
`;

	const shaderFrag = `precision highp float;
varying vec2 vertexPosition;
varying vec3 vTrans1;
varying vec3 vTrans2;
varying vec2 vSamplerSize;
varying vec4 vFrame;
varying vec4 vColor;
varying float vTextureId;

uniform sampler2D uSamplers[%count%];
uniform vec4 distortion;

void main(void){
vec2 surface;
vec2 surface2;

float vx = vertexPosition.x;
float vy = vertexPosition.y;
float dx = distortion.x;
float dy = distortion.y;
float revx = distortion.z;
float revy = distortion.w;

if (distortion.x == 0.0) {
	surface.x = vx;
	surface.y = vy / (1.0 + dy * vx);
	surface2 = surface;
} else
if (distortion.y == 0.0) {
	surface.y = vy;
	surface.x = vx / (1.0 + dx * vy);
	surface2 = surface;
} else {
	float c = vy * dx - vx * dy;
	float b = (c + 1.0) * 0.5;
	float b2 = (-c + 1.0) * 0.5;
	float d = b * b + vx * dy;
	if (d < -0.00001) {
	    discard;
	}
	d = sqrt(max(d, 0.0));
	surface.x = (- b + d) * revy;
	surface2.x = (- b - d) * revy;
	surface.y = (- b2 + d) * revx;
	surface2.y = (- b2 - d) * revx;
}

vec2 uv;
uv.x = vTrans1.x * surface.x + vTrans1.y * surface.y + vTrans1.z;
uv.y = vTrans2.x * surface.x + vTrans2.y * surface.y + vTrans2.z;

vec2 pixels = uv * vSamplerSize;

if (pixels.x < vFrame.x || pixels.x > vFrame.z ||
	pixels.y < vFrame.y || pixels.y > vFrame.w) {
	uv.x = vTrans1.x * surface2.x + vTrans1.y * surface2.y + vTrans1.z;
	uv.y = vTrans2.x * surface2.x + vTrans2.y * surface2.y + vTrans2.z;
	pixels = uv * vSamplerSize;

   if (pixels.x < vFrame.x || pixels.x > vFrame.z ||
       pixels.y < vFrame.y || pixels.y > vFrame.w) {
       discard;
   }
}

vec4 edge;
edge.xy = clamp(pixels - vFrame.xy + 0.5, vec2(0.0, 0.0), vec2(1.0, 1.0));
edge.zw = clamp(vFrame.zw - pixels + 0.5, vec2(0.0, 0.0), vec2(1.0, 1.0));

float alpha = 1.0; //edge.x * edge.y * edge.z * edge.w;
vec4 rColor = vColor * alpha;

float textureId = floor(vTextureId+0.5);
vec2 vTextureCoord = uv;
vec4 color;
%forloop%
gl_FragColor = color * rColor;
}`;

	export class BatchBilineardGeometry extends PIXI.Geometry
	{
		_buffer: PIXI.Buffer;
		_indexBuffer : PIXI.Buffer;

		constructor(_static = false)
		{
			super();

			this._buffer = new PIXI.Buffer(null, _static, false);

			this._indexBuffer = new PIXI.Buffer(null, _static, true);

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
				constructor(renderer: PIXI.Renderer)
				{
					super(renderer);

					this.shaderGenerator = new PIXI.BatchShaderGenerator(vertex, fragment);
					this.geometryClass = geometryClass;
					this.vertexSize = vertexSize;
				}

				defUniforms = {
					translationMatrix: new PIXI.Matrix(),
					distortion: new Float32Array([0, 0, Infinity, Infinity])
				};
				size = 1000;
				forceMaxTextures = 1;

				getUniforms(sprite: PIXI.Sprite) {
					let  { proj } = sprite as Sprite2s;
					if (proj.surface !== null) {
						return proj.uniforms;
					}
					if (proj._activeProjection !== null) {
						return proj._activeProjection.uniforms;
					}
					return this.defUniforms;
				}

				packInterleavedGeometry(element: any, attributeBuffer: PIXI.ViewableBuffer, indexBuffer: Uint16Array, aIndex: number, iIndex: number)
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

	PIXI.Renderer.registerPlugin('batch_bilinear', BatchBilinearPluginFactory.create({}));
}
declare module PIXI {
	interface Sprite {
		convertTo2s(): void;
	}

	interface Container {
		convertTo2s(): void;

		convertSubtreeTo2s(): void;
	}
}

module PIXI.projection {
	(PIXI as any).Sprite.prototype.convertTo2s = function () {
		if (this.proj) return;
		//cointainer
		this.pluginName = 'sprite_bilinear';
		this.aTrans = new PIXI.Matrix();
		this.calculateVertices = Sprite2s.prototype.calculateVertices;
		this.calculateTrimmedVertices = Sprite2s.prototype.calculateTrimmedVertices;
		this._calculateBounds = Sprite2s.prototype._calculateBounds;
		PIXI.Container.prototype.convertTo2s.call(this);
	};

	(PIXI as any).Container.prototype.convertTo2s = function () {
		if (this.proj) return;
		this.proj = new Projection2d(this.transform);
		Object.defineProperty(this, "worldTransform", {
			get: function () {
				return this.proj;
			},
			enumerable: true,
			configurable: true
		});
	};

	(PIXI as any).Container.prototype.convertSubtreeTo2s = function () {
		this.convertTo2s();
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].convertSubtreeTo2s();
		}
	};
}
module PIXI.projection {
	export class Sprite2s extends PIXI.Sprite {
		constructor(texture: PIXI.Texture) {
			super(texture);
			this.proj = new ProjectionSurface(this.transform);
			this.pluginName = 'batch_bilinear';
		}

		proj: ProjectionSurface;
		aTrans = new PIXI.Matrix();

		_calculateBounds() {
			this.calculateTrimmedVertices();
			this._bounds.addQuad(this.vertexTrimmedData as any);
		}

		calculateVertices() {
			const wid = (this.transform as any)._worldID;
			const tuid = (this._texture as any)._updateID;
			if (this._transformID === wid && this._textureID === tuid) {
				return;
			}

			this._transformID = wid;
			this._textureID = tuid;

			const texture = this._texture;
			const vertexData = this.vertexData;
			const trim = texture.trim;
			const orig = texture.orig;
			const anchor = this._anchor;

			let w0 = 0;
			let w1 = 0;
			let h0 = 0;
			let h1 = 0;

			if (trim) {
				w1 = trim.x - (anchor._x * orig.width);
				w0 = w1 + trim.width;

				h1 = trim.y - (anchor._y * orig.height);
				h0 = h1 + trim.height;
			}
			else {
				w1 = -anchor._x * orig.width;
				w0 = w1 + orig.width;

				h1 = -anchor._y * orig.height;
				h0 = h1 + orig.height;
			}

			if (this.proj._surface) {
				vertexData[0] = w1;
				vertexData[1] = h1;
				vertexData[2] = w0;
				vertexData[3] = h1;
				vertexData[4] = w0;
				vertexData[5] = h0;
				vertexData[6] = w1;
				vertexData[7] = h0;
				this.proj._surface.boundsQuad(vertexData, vertexData);
			} else {
				const wt = this.transform.worldTransform;
				const a = wt.a;
				const b = wt.b;
				const c = wt.c;
				const d = wt.d;
				const tx = wt.tx;
				const ty = wt.ty;
				vertexData[0] = (a * w1) + (c * h1) + tx;
				vertexData[1] = (d * h1) + (b * w1) + ty;
				vertexData[2] = (a * w0) + (c * h1) + tx;
				vertexData[3] = (d * h1) + (b * w0) + ty;
				vertexData[4] = (a * w0) + (c * h0) + tx;
				vertexData[5] = (d * h0) + (b * w0) + ty;
				vertexData[6] = (a * w1) + (c * h0) + tx;
				vertexData[7] = (d * h0) + (b * w1) + ty;
				if (this.proj._activeProjection) {
					this.proj._activeProjection.surface.boundsQuad(vertexData, vertexData);
				}
			}

			if (!texture.uvMatrix) {
				texture.uvMatrix = new PIXI.TextureMatrix(texture);
			}
			texture.uvMatrix.update();

			const aTrans = this.aTrans;
			aTrans.set(orig.width, 0, 0, orig.height, w1, h1);
			if (this.proj._surface === null) {
				aTrans.prepend(this.transform.worldTransform);
			}
			aTrans.invert();
			aTrans.prepend((texture.uvMatrix as any).mapCoord);
		}

		calculateTrimmedVertices() {
			const wid = (this.transform as any)._worldID;
			const tuid = (this._texture as any)._updateID;
			if (!this.vertexTrimmedData) {
				this.vertexTrimmedData = new Float32Array(8);
			}
			else if (this._transformTrimmedID === wid && this._textureTrimmedID === tuid) {
				return;
			}

			this._transformTrimmedID = wid;
			this._textureTrimmedID = tuid;

			// lets do some special trim code!
			const texture = this._texture;
			const vertexData = this.vertexTrimmedData;
			const orig = texture.orig;
			const anchor = this._anchor;

			// lets calculate the new untrimmed bounds..

			const w1 = -anchor._x * orig.width;
			const w0 = w1 + orig.width;

			const h1 = -anchor._y * orig.height;
			const h0 = h1 + orig.height;

			//TODO: take rotations into account! form temporary bounds

			if (this.proj._surface) {
				vertexData[0] = w1;
				vertexData[1] = h1;
				vertexData[2] = w0;
				vertexData[3] = h1;
				vertexData[4] = w0;
				vertexData[5] = h0;
				vertexData[6] = w1;
				vertexData[7] = h0;
				this.proj._surface.boundsQuad(vertexData, vertexData, this.transform.worldTransform);
			} else {
				let wt = this.transform.worldTransform;
				let a = wt.a;
				let b = wt.b;
				let c = wt.c;
				let d = wt.d;
				let tx = wt.tx;
				let ty = wt.ty;
				vertexData[0] = (a * w1) + (c * h1) + tx;
				vertexData[1] = (d * h1) + (b * w1) + ty;
				vertexData[2] = (a * w0) + (c * h1) + tx;
				vertexData[3] = (d * h1) + (b * w0) + ty;
				vertexData[4] = (a * w0) + (c * h0) + tx;
				vertexData[5] = (d * h0) + (b * w0) + ty;
				vertexData[6] = (a * w1) + (c * h0) + tx;
				vertexData[7] = (d * h0) + (b * w1) + ty;
				if (this.proj._activeProjection) {
					this.proj._activeProjection.surface.boundsQuad(vertexData, vertexData,
						this.proj._activeProjection.legacy.worldTransform);
				}
			}
		}

		get worldTransform() {
			return this.proj as any;
		}
	}
}
module PIXI.projection {
	export class Text2s extends PIXI.Text {
		constructor(text?: string, style?: PIXI.TextStyle, canvas?: HTMLCanvasElement) {
			super(text, style, canvas);
			this.proj = new ProjectionSurface(this.transform);
			this.pluginName = 'batch_bilinear';
		}

		proj: ProjectionSurface;

		aTrans = new PIXI.Matrix();

		get worldTransform() {
			return this.proj as any;
		}
	}

	(Text2s.prototype as any).calculateVertices = Sprite2s.prototype.calculateVertices;
	(Text2s.prototype as any).calculateTrimmedVertices = Sprite2s.prototype.calculateTrimmedVertices;
	(Text2s.prototype as any)._calculateBounds = Sprite2s.prototype._calculateBounds;
}
module PIXI.projection {
	export function container2dWorldTransform() {
		return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
	}

	export class Container2d extends PIXI.Container {
		constructor() {
			super();
			this.proj = new Projection2d(this.transform);
		}

		proj: Projection2d;

		toLocal<T extends PIXI.Point>(position: PIXI.IPointData, from?: PIXI.DisplayObject,
				point?: T, skipUpdate?: boolean,
				step = TRANSFORM_STEP.ALL): T {

			if (from)
			{
				position = from.toGlobal(position, point, skipUpdate);
			}

			if (!skipUpdate)
			{
				this._recursivePostUpdateTransform();
			}

			if (step >= TRANSFORM_STEP.PROJ) {
				if (!skipUpdate) {
					this.displayObjectUpdateTransform();
				}
				if (this.proj.affine) {
					return this.transform.worldTransform.applyInverse(position, point) as any;
				}
				return this.proj.world.applyInverse(position, point) as any;
			}

			if (this.parent) {
				point  = this.parent.worldTransform.applyInverse(position, point) as any;
			} else {
				point.copyFrom(position);
			}
			if (step === TRANSFORM_STEP.NONE) {
				return point;
			}

			return this.transform.localTransform.applyInverse(point, point) as any;
		}

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}
	}

	export let container2dToLocal = Container2d.prototype.toLocal;
}
// according to https://jsperf.com/obj-vs-array-view-access/1 , Float64Array is the best here

module PIXI.projection {
	import Point = PIXI.Point;
	import IPointData = PIXI.IPointData;

	const mat3id = [1, 0, 0, 0, 1, 0, 0, 0, 1];

	export enum AFFINE {
		NONE = 0,
		FREE = 1,
		AXIS_X = 2,
		AXIS_Y = 3,
		POINT = 4,
		AXIS_XR = 5

	}

	export class Matrix2d {
		/**
		 * A default (identity) matrix
		 *
		 * @static
		 * @const
		 */
		static readonly IDENTITY = new Matrix2d();

		/**
		 * A temp matrix
		 *
		 * @static
		 * @const
		 */
		static readonly TEMP_MATRIX = new Matrix2d();

		/**
		 * mat3 implementation through array of 9 elements
		 */
		mat3: Float64Array;

		floatArray: Float32Array = null;

		constructor(backingArray?: ArrayLike<number>) {
			this.mat3 = new Float64Array(backingArray || mat3id);
		}

		get a() {
			return this.mat3[0] / this.mat3[8];
		}

		get b() {
			return this.mat3[1] / this.mat3[8];
		}

		get c() {
			return this.mat3[3] / this.mat3[8];
		}

		get d() {
			return this.mat3[4] / this.mat3[8];
		}

		get tx() {
			return this.mat3[6] / this.mat3[8];
		}

		get ty() {
			return this.mat3[7] / this.mat3[8];
		}

		set a(value: number) {
			this.mat3[0] = value * this.mat3[8];
		}

		set b(value: number) {
			this.mat3[1] = value * this.mat3[8];
		}

		set c(value: number) {
			this.mat3[3] = value * this.mat3[8];
		}

		set d(value: number) {
			this.mat3[4] = value * this.mat3[8];
		}

		set tx(value: number) {
			this.mat3[6] = value * this.mat3[8];
		}

		set ty(value: number) {
			this.mat3[7] = value * this.mat3[8];
		}

		set(a: number, b: number, c: number, d: number, tx: number, ty: number) {
			let mat3 = this.mat3;
			mat3[0] = a;
			mat3[1] = b;
			mat3[2] = 0;
			mat3[3] = c;
			mat3[4] = d;
			mat3[5] = 0;
			mat3[6] = tx;
			mat3[7] = ty;
			mat3[8] = 1;
			return this;
		}

		toArray(transpose?: boolean, out?: Float32Array): Float32Array {
			if (!this.floatArray) {
				this.floatArray = new Float32Array(9);
			}

			const array = out || this.floatArray;
			const mat3 = this.mat3;

			if (transpose) {
				array[0] = mat3[0];
				array[1] = mat3[1];
				array[2] = mat3[2];
				array[3] = mat3[3];
				array[4] = mat3[4];
				array[5] = mat3[5];
				array[6] = mat3[6];
				array[7] = mat3[7];
				array[8] = mat3[8];
			} else {
				//this branch is NEVER USED in pixi
				array[0] = mat3[0];
				array[1] = mat3[3];
				array[2] = mat3[6];
				array[3] = mat3[1];
				array[4] = mat3[4];
				array[5] = mat3[7];
				array[6] = mat3[2];
				array[7] = mat3[5];
				array[8] = mat3[8];
			}

			return array;
		}

		//TODO: remove props
		apply(pos: IPointData, newPos: IPointData): IPointData {
			newPos = newPos || new PIXI.Point();

			const mat3 = this.mat3;
			const x = pos.x;
			const y = pos.y;

			let z = 1.0 / (mat3[2] * x + mat3[5] * y + mat3[8]);
			newPos.x = z * (mat3[0] * x + mat3[3] * y + mat3[6]);
			newPos.y = z * (mat3[1] * x + mat3[4] * y + mat3[7]);

			return newPos;
		}

		translate(tx: number, ty: number) {
			const mat3 = this.mat3;
			mat3[0] += tx * mat3[2];
			mat3[1] += ty * mat3[2];
			mat3[3] += tx * mat3[5];
			mat3[4] += ty * mat3[5];
			mat3[6] += tx * mat3[8];
			mat3[7] += ty * mat3[8];
			return this;
		}

		scale(x: number, y: number) {
			const mat3 = this.mat3;
			mat3[0] *= x;
			mat3[1] *= y;
			mat3[3] *= x;
			mat3[4] *= y;
			mat3[6] *= x;
			mat3[7] *= y;
			return this;
		}

		scaleAndTranslate(scaleX: number, scaleY: number, tx: number, ty: number) {
			const mat3 = this.mat3;
			mat3[0] = scaleX * mat3[0] + tx * mat3[2];
			mat3[1] = scaleY * mat3[1] + ty * mat3[2];
			mat3[3] = scaleX * mat3[3] + tx * mat3[5];
			mat3[4] = scaleY * mat3[4] + ty * mat3[5];
			mat3[6] = scaleX * mat3[6] + tx * mat3[8];
			mat3[7] = scaleY * mat3[7] + ty * mat3[8];
		}

		//TODO: remove props
		applyInverse(pos: IPointData, newPos: IPointData): IPointData {
			newPos = newPos || new Point();

			const a = this.mat3;
			const x = pos.x;
			const y = pos.y;

			const a00 = a[0], a01 = a[3], a02 = a[6],
				a10 = a[1], a11 = a[4], a12 = a[7],
				a20 = a[2], a21 = a[5], a22 = a[8];

			let newX = (a22 * a11 - a12 * a21) * x + (-a22 * a01 + a02 * a21) * y + (a12 * a01 - a02 * a11);
			let newY = (-a22 * a10 + a12 * a20) * x + (a22 * a00 - a02 * a20) * y + (-a12 * a00 + a02 * a10);
			let newZ = (a21 * a10 - a11 * a20) * x + (-a21 * a00 + a01 * a20) * y + (a11 * a00 - a01 * a10);

			newPos.x = newX / newZ;
			newPos.y = newY / newZ;

			return newPos;
		}

		invert(): Matrix2d {
			const a = this.mat3;

			const a00 = a[0], a01 = a[1], a02 = a[2],
				a10 = a[3], a11 = a[4], a12 = a[5],
				a20 = a[6], a21 = a[7], a22 = a[8],

				b01 = a22 * a11 - a12 * a21,
				b11 = -a22 * a10 + a12 * a20,
				b21 = a21 * a10 - a11 * a20;

			// Calculate the determinant
			let det = a00 * b01 + a01 * b11 + a02 * b21;
			if (!det) {
				return this;
			}
			det = 1.0 / det;

			a[0] = b01 * det;
			a[1] = (-a22 * a01 + a02 * a21) * det;
			a[2] = (a12 * a01 - a02 * a11) * det;
			a[3] = b11 * det;
			a[4] = (a22 * a00 - a02 * a20) * det;
			a[5] = (-a12 * a00 + a02 * a10) * det;
			a[6] = b21 * det;
			a[7] = (-a21 * a00 + a01 * a20) * det;
			a[8] = (a11 * a00 - a01 * a10) * det;

			return this;
		}

		identity(): Matrix2d {
			const mat3 = this.mat3;
			mat3[0] = 1;
			mat3[1] = 0;
			mat3[2] = 0;
			mat3[3] = 0;
			mat3[4] = 1;
			mat3[5] = 0;
			mat3[6] = 0;
			mat3[7] = 0;
			mat3[8] = 1;
			return this;
		}

		clone() {
			return new Matrix2d(this.mat3);
		}

		copyTo2dOr3d(matrix: Matrix2d) {
			const mat3 = this.mat3;
			const ar2 = matrix.mat3;
			ar2[0] = mat3[0];
			ar2[1] = mat3[1];
			ar2[2] = mat3[2];
			ar2[3] = mat3[3];
			ar2[4] = mat3[4];
			ar2[5] = mat3[5];
			ar2[6] = mat3[6];
			ar2[7] = mat3[7];
			ar2[8] = mat3[8];
			return matrix;
		}

		/**
		 * legacy method, change the values of given pixi matrix
		 * @param matrix
		 * @return matrix
		 */
		copyTo(matrix: PIXI.Matrix, affine?: AFFINE, preserveOrientation?: boolean) {
			const mat3 = this.mat3;
			const d = 1.0 / mat3[8];
			const tx = mat3[6] * d, ty = mat3[7] * d;
			matrix.a = (mat3[0] - mat3[2] * tx) * d;
			matrix.b = (mat3[1] - mat3[2] * ty) * d;
			matrix.c = (mat3[3] - mat3[5] * tx) * d;
			matrix.d = (mat3[4] - mat3[5] * ty) * d;
			matrix.tx = tx;
			matrix.ty = ty;

			if (affine >= 2) {
				let D = matrix.a * matrix.d - matrix.b * matrix.c;
				if (!preserveOrientation) {
					D = Math.abs(D);
				}
				if (affine === AFFINE.POINT) {
					if (D > 0) {
						D = 1;
					} else D = -1;
					matrix.a = D;
					matrix.b = 0;
					matrix.c = 0;
					matrix.d = D;
				} else if (affine === AFFINE.AXIS_X) {
					D /= Math.sqrt(matrix.b * matrix.b + matrix.d * matrix.d);
					matrix.c = 0;
					matrix.d = D;
				} else if (affine === AFFINE.AXIS_Y) {
					D /= Math.sqrt(matrix.a * matrix.a + matrix.c * matrix.c);
					matrix.a = D;
					matrix.c = 0;
				}
				else if (affine === AFFINE.AXIS_XR) {
					matrix.a =  matrix.d * D;
					matrix.c = -matrix.b * D;
				}
			}
			return matrix;
		}

		/**
		 * legacy method, change the values of given pixi matrix
		 * @param matrix
		 * @return
		 */
		copyFrom(matrix: PIXI.Matrix) {
			const mat3 = this.mat3;
			mat3[0] = matrix.a;
			mat3[1] = matrix.b;
			mat3[2] = 0;
			mat3[3] = matrix.c;
			mat3[4] = matrix.d;
			mat3[5] = 0;
			mat3[6] = matrix.tx;
			mat3[7] = matrix.ty;
			mat3[8] = 1.0;
			return this;
		}

		setToMultLegacy(pt: PIXI.Matrix, lt: Matrix2d) {
			const out = this.mat3;
			const b = lt.mat3;

			const a00 = pt.a, a01 = pt.b,
				a10 = pt.c, a11 = pt.d,
				a20 = pt.tx, a21 = pt.ty,

				b00 = b[0], b01 = b[1], b02 = b[2],
				b10 = b[3], b11 = b[4], b12 = b[5],
				b20 = b[6], b21 = b[7], b22 = b[8];


			out[0] = b00 * a00 + b01 * a10 + b02 * a20;
			out[1] = b00 * a01 + b01 * a11 + b02 * a21;
			out[2] = b02;

			out[3] = b10 * a00 + b11 * a10 + b12 * a20;
			out[4] = b10 * a01 + b11 * a11 + b12 * a21;
			out[5] = b12;

			out[6] = b20 * a00 + b21 * a10 + b22 * a20;
			out[7] = b20 * a01 + b21 * a11 + b22 * a21;
			out[8] = b22;

			return this;
		}

		setToMultLegacy2(pt: Matrix2d, lt: PIXI.Matrix) {
			const out = this.mat3;
			const a = pt.mat3;

			const a00 = a[0], a01 = a[1], a02 = a[2],
				a10 = a[3], a11 = a[4], a12 = a[5],
				a20 = a[6], a21 = a[7], a22 = a[8],

				b00 = lt.a, b01 = lt.b,
				b10 = lt.c, b11 = lt.d,
				b20 = lt.tx, b21 = lt.ty;


			out[0] = b00 * a00 + b01 * a10;
			out[1] = b00 * a01 + b01 * a11;
			out[2] = b00 * a02 + b01 * a12;

			out[3] = b10 * a00 + b11 * a10;
			out[4] = b10 * a01 + b11 * a11;
			out[5] = b10 * a02 + b11 * a12;

			out[6] = b20 * a00 + b21 * a10 + a20;
			out[7] = b20 * a01 + b21 * a11 + a21;
			out[8] = b20 * a02 + b21 * a12 + a22;

			return this;
		}

		// that's transform multiplication we use
		setToMult(pt: Matrix2d, lt: Matrix2d) {
			const out = this.mat3;
			const a = pt.mat3, b = lt.mat3;

			const a00 = a[0], a01 = a[1], a02 = a[2],
				a10 = a[3], a11 = a[4], a12 = a[5],
				a20 = a[6], a21 = a[7], a22 = a[8],

				b00 = b[0], b01 = b[1], b02 = b[2],
				b10 = b[3], b11 = b[4], b12 = b[5],
				b20 = b[6], b21 = b[7], b22 = b[8];

			out[0] = b00 * a00 + b01 * a10 + b02 * a20;
			out[1] = b00 * a01 + b01 * a11 + b02 * a21;
			out[2] = b00 * a02 + b01 * a12 + b02 * a22;

			out[3] = b10 * a00 + b11 * a10 + b12 * a20;
			out[4] = b10 * a01 + b11 * a11 + b12 * a21;
			out[5] = b10 * a02 + b11 * a12 + b12 * a22;

			out[6] = b20 * a00 + b21 * a10 + b22 * a20;
			out[7] = b20 * a01 + b21 * a11 + b22 * a21;
			out[8] = b20 * a02 + b21 * a12 + b22 * a22;

			return this;
		}

		prepend(lt: any) {
			if (lt.mat3) {
				return this.setToMult(lt, this);
			} else {
				return this.setToMultLegacy(lt, this);
			}
		}
	}
}
module PIXI.projection {
	export class Mesh2d extends PIXI.Mesh {
		static defaultVertexShader =
			`precision highp float;
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTextureMatrix;

varying vec2 vTextureCoord;

void main(void)
{
	gl_Position.xyw = projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0);
	gl_Position.z = 0.0;

	vTextureCoord = (uTextureMatrix * vec3(aTextureCoord, 1.0)).xy;
}
`;
		static defaultFragmentShader = `
varying vec2 vTextureCoord;
uniform vec4 uColor;

uniform sampler2D uSampler;

void main(void)
{
	gl_FragColor = texture2D(uSampler, vTextureCoord) * uColor;
}`;
		constructor(geometry: PIXI.Geometry, shader: PIXI.MeshMaterial, state: PIXI.State, drawMode?: number)
		{
			super(geometry, shader, state, drawMode);
			this.proj = new Projection2d(this.transform);
		}

		vertexData2d: Float32Array = null;
		proj: Projection2d;

		calculateVertices()
		{
			if (this.proj._affine) {
				this.vertexData2d = null;
				super.calculateVertices();
				return;
			}

			const geometry = this.geometry as any;
			const vertices = geometry.buffers[0].data;
			const thisAny = this as any;

			if (geometry.vertexDirtyId === thisAny.vertexDirty && thisAny._transformID === thisAny.transform._worldID)
			{
				return;
			}

			thisAny._transformID = thisAny.transform._worldID;

			if (thisAny.vertexData.length !== vertices.length)
			{
				thisAny.vertexData = new Float32Array(vertices.length);
			}

			if (!this.vertexData2d || this.vertexData2d.length !== vertices.length * 3 / 2)
			{
				this.vertexData2d = new Float32Array(vertices.length * 3);
			}

			const wt = this.proj.world.mat3;

			const vertexData2d = this.vertexData2d;
			const vertexData = thisAny.vertexData;

			for (let i = 0; i < vertexData.length / 2; i++)
			{
				const x = vertices[(i * 2)];
				const y = vertices[(i * 2) + 1];

				const xx = (wt[0] * x) + (wt[3] * y) + wt[6];
				const yy = (wt[1] * x) + (wt[4] * y) + wt[7];
				const ww = (wt[2] * x) + (wt[5] * y) + wt[8];

				vertexData2d[i * 3] = xx;
				vertexData2d[i * 3 + 1] = yy;
				vertexData2d[i * 3 + 2] = ww;

				vertexData[(i * 2)] = xx / ww;
				vertexData[(i * 2) + 1] = yy / ww;
			}

			thisAny.vertexDirty = geometry.vertexDirtyId;
		}

		_renderDefault(renderer: PIXI.Renderer) {
			const shader = this.shader as PIXI.MeshMaterial;

			shader.alpha = this.worldAlpha;
			if (shader.update)
			{
				shader.update();
			}

			renderer.batch.flush();

			if ((shader as any).program.uniformData.translationMatrix)
			{
				shader.uniforms.translationMatrix = this.worldTransform.toArray(true);
			}

			// bind and sync uniforms..
			renderer.shader.bind(shader, false);

			// set state..
			renderer.state.set(this.state);

			// bind the geometry...
			renderer.geometry.bind(this.geometry, shader);

			// then render it
			renderer.geometry.draw(this.drawMode, this.size, this.start, (this.geometry as any).instanceCount);
		}

		toLocal<T extends PIXI.IPointData>(position: PIXI.IPointData, from?: PIXI.DisplayObject,
									   point?: T, skipUpdate?: boolean,
									   step = TRANSFORM_STEP.ALL): T {
			return container2dToLocal.call(this, position, from, point, skipUpdate, step);
		}

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}
	}

	export class SimpleMesh2d extends Mesh2d {
		constructor(texture: PIXI.Texture, vertices?: Float32Array, uvs?: Float32Array,
					indices?: Uint16Array, drawMode?: number) {
			super(new PIXI.MeshGeometry(vertices, uvs, indices),
				new PIXI.MeshMaterial(texture, {
					program: PIXI.Program.from(Mesh2d.defaultVertexShader, Mesh2d.defaultFragmentShader),
					pluginName: 'batch2d'
				}),
				null,
				drawMode);

			(this.geometry.getBuffer('aVertexPosition') as any).static = false;
		}

		autoUpdate = true;

		get vertices()
		{
			return this.geometry.getBuffer('aVertexPosition').data as Float32Array;
		}
		set vertices(value)
		{
			this.geometry.getBuffer('aVertexPosition').data = value;
		}

		protected _render(renderer?: PIXI.Renderer)
		{
			if (this.autoUpdate)
			{
				this.geometry.getBuffer('aVertexPosition').update();
			}

			(super._render as any)(renderer);
		}
	}
}
module PIXI.projection {
	import IPointData = PIXI.IPointData;

	const t0 = new PIXI.Point();
	const tt = [new PIXI.Point(), new PIXI.Point(), new PIXI.Point(), new PIXI.Point()];
	const tempRect = new PIXI.Rectangle();
	const tempMat = new Matrix2d();

	export class Projection2d extends LinearProjection<Matrix2d> {

		constructor(legacy: PIXI.Transform, enable?: boolean) {
			super(legacy, enable);
			this.local = new Matrix2d();
			this.world = new Matrix2d();
		}

		matrix = new Matrix2d();
		pivot = new PIXI.ObservablePoint(this.onChange, this, 0, 0);

		reverseLocalOrder = false;

		onChange() {
			const pivot = this.pivot;
			const mat3 = this.matrix.mat3;

			mat3[6] = -(pivot._x * mat3[0] + pivot._y * mat3[3]);
			mat3[7] = -(pivot._x * mat3[1] + pivot._y * mat3[4]);

			this._projID++;
		}

		setAxisX(p: IPointData, factor: number = 1): void {
			const x = p.x, y = p.y;
			const d = Math.sqrt(x * x + y * y);
			const mat3 = this.matrix.mat3;
			mat3[0] = x / d;
			mat3[1] = y / d;
			mat3[2] = factor / d;

			this.onChange();
		}

		setAxisY(p: IPointData, factor: number = 1) {
			const x = p.x, y = p.y;
			const d = Math.sqrt(x * x + y * y);
			const mat3 = this.matrix.mat3;
			mat3[3] = x / d;
			mat3[4] = y / d;
			mat3[5] = factor / d;
			this.onChange();
		}

		mapSprite(sprite: PIXI.Sprite, quad: Array<IPointData>) {
			const tex = sprite.texture;

			tempRect.x = -sprite.anchor.x * tex.orig.width;
			tempRect.y = -sprite.anchor.y * tex.orig.height;
			tempRect.width = tex.orig.width;
			tempRect.height = tex.orig.height;

			return this.mapQuad(tempRect, quad);
		}

		mapQuad(rect: PIXI.Rectangle, p: Array<IPointData>) {
			// utils.getPositionFromQuad(p, anchor, t0);
			tt[0].set(rect.x, rect.y);
			tt[1].set(rect.x + rect.width, rect.y);
			tt[2].set(rect.x + rect.width, rect.y + rect.height);
			tt[3].set(rect.x, rect.y + rect.height);

			let k1 = 1, k2 = 2, k3 = 3;
			let f = utils.getIntersectionFactor(p[0], p[2], p[1], p[3], t0);
			if (f !== 0) {
				k1 = 1;
				k2 = 3;
				k3 = 2;
			} else {
				return;
				/*f = utils.getIntersectionFactor(p[0], p[1], p[2], p[3], t0);
				if (f > 0) {
					k1 = 2;
					k2 = 3;
					k3 = 1;
				} else {
					f = utils.getIntersectionFactor(p[0], p[3], p[1], p[2], t0);
					if (f > 0) {
						// cant find it :(
						k1 = 1;
						k2 = 2;
						k3 = 3;
					} else {
						return;
					}
				}*/
			}
			let d0 = Math.sqrt((p[0].x - t0.x) * (p[0].x - t0.x) + (p[0].y - t0.y) * (p[0].y - t0.y));
			let d1 = Math.sqrt((p[k1].x - t0.x) * (p[k1].x - t0.x) + (p[k1].y - t0.y) * (p[k1].y - t0.y));
			let d2 = Math.sqrt((p[k2].x - t0.x) * (p[k2].x - t0.x) + (p[k2].y - t0.y) * (p[k2].y - t0.y));
			let d3 = Math.sqrt((p[k3].x - t0.x) * (p[k3].x - t0.x) + (p[k3].y - t0.y) * (p[k3].y - t0.y));

			let q0 = (d0 + d3) / d3;
			let q1 = (d1 + d2) / d2;
			let q2 = (d1 + d2) / d1;

			let mat3 = this.matrix.mat3;
			mat3[0] = tt[0].x * q0;
			mat3[1] = tt[0].y * q0;
			mat3[2] = q0;
			mat3[3] = tt[k1].x * q1;
			mat3[4] = tt[k1].y * q1;
			mat3[5] = q1;
			mat3[6] = tt[k2].x * q2;
			mat3[7] = tt[k2].y * q2;
			mat3[8] = q2;
			this.matrix.invert();

			mat3 = tempMat.mat3;
			mat3[0] = p[0].x;
			mat3[1] = p[0].y;
			mat3[2] = 1;
			mat3[3] = p[k1].x;
			mat3[4] = p[k1].y;
			mat3[5] = 1;
			mat3[6] = p[k2].x;
			mat3[7] = p[k2].y;
			mat3[8] = 1;

			this.matrix.setToMult(tempMat, this.matrix);
			this._projID++;
		}

		updateLocalTransform(lt: PIXI.Matrix) {
			if (this._projID !== 0) {
				if (this.reverseLocalOrder) {
					// tilingSprite inside order
					this.local.setToMultLegacy2(this.matrix, lt);
				}
				else {
					// good order
					this.local.setToMultLegacy(lt, this.matrix);
				}
			} else {
				this.local.copyFrom(lt);
			}
		}

		clear() {
			super.clear();
			this.matrix.identity();
			this.pivot.set(0, 0);
		}
	}
}
declare module PIXI {
	interface Sprite {
		_texture: PIXI.Texture;
		vertexData: Float32Array;
		vertexTrimmedData: Float32Array;
		_transformID?: number;
		_textureID?: number;
		_transformTrimmedID?: number;
		_textureTrimmedID?: number;
		_anchor?: ObservablePoint;
		convertTo2d?(): void;
	}

	interface Container {
		convertTo2d?(): void;

		convertSubtreeTo2d?(): void;
	}

	interface SimpleMesh {
		convertTo2d?(): void;
	}

	interface Graphics {
		convertTo2d?(): void;
	}
}

module PIXI.projection {

	function convertTo2d() {
		if (this.proj) return;
		this.proj = new Projection2d(this.transform);
		this.toLocal = Container2d.prototype.toLocal;
		Object.defineProperty(this, "worldTransform", {
			get: container2dWorldTransform,
			enumerable: true,
			configurable: true
		});
	}


	(PIXI as any).Container.prototype.convertTo2d = convertTo2d;

	(PIXI as any).Sprite.prototype.convertTo2d = function () {
		if (this.proj) return;
		this.calculateVertices = Sprite2d.prototype.calculateVertices;
		this.calculateTrimmedVertices = Sprite2d.prototype.calculateTrimmedVertices;
		this._calculateBounds = Sprite2d.prototype._calculateBounds;
		this.pluginName = 'batch2d';
		convertTo2d.call(this);
	};

	(PIXI as any).Container.prototype.convertSubtreeTo2d = function () {
		this.convertTo2d();
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].convertSubtreeTo2d();
		}
	};

	if (PIXI.SimpleMesh) {
		(PIXI as any).SimpleMesh.prototype.convertTo2d =
			(PIXI as any).SimpleRope.prototype.convertTo2d =
				function () {
					if (this.proj) return;
					this.calculateVertices = Mesh2d.prototype.calculateVertices;
					this._renderDefault = Mesh2d.prototype._renderDefault;
					if (this.material.pluginName !== 'batch2d') {
						this.material = new PIXI.MeshMaterial(this.material.texture, {
							program: PIXI.Program.from(Mesh2d.defaultVertexShader, Mesh2d.defaultFragmentShader),
							pluginName: 'batch2d'
						});
					}
					convertTo2d.call(this);
				};
	}

}
module PIXI.projection {
	export class Sprite2d extends PIXI.Sprite {
		constructor(texture: PIXI.Texture) {
			super(texture);
			this.proj = new Projection2d(this.transform);
			this.pluginName = 'batch2d';
		}

		vertexData2d: Float32Array = null;
		proj: Projection2d;

		_calculateBounds() {
			this.calculateTrimmedVertices();
			this._bounds.addQuad(this.vertexTrimmedData as any);
		}

		calculateVertices() {
			const texture = this._texture;

			if (this.proj._affine) {
				this.vertexData2d = null;
				super.calculateVertices();
				return;
			}
			if (!this.vertexData2d) {
				this.vertexData2d = new Float32Array(12);
			}

			const wid = (this.transform as any)._worldID;
			const tuid = (texture as any)._updateID;
			if (this._transformID === wid && this._textureID === tuid) {
				return;
			}
			// update texture UV here, because base texture can be changed without calling `_onTextureUpdate`
			if (this._textureID !== tuid) {
				(this as any).uvs = (texture as any)._uvs.uvsFloat32;
			}

			this._transformID = wid;
			this._textureID = tuid;

			const wt = this.proj.world.mat3;
			const vertexData2d = this.vertexData2d;
			const vertexData = this.vertexData;
			const trim = texture.trim;
			const orig = texture.orig;
			const anchor = this._anchor;

			let w0 = 0;
			let w1 = 0;
			let h0 = 0;
			let h1 = 0;

			if (trim) {
				w1 = trim.x - (anchor._x * orig.width);
				w0 = w1 + trim.width;

				h1 = trim.y - (anchor._y * orig.height);
				h0 = h1 + trim.height;
			} else {
				w1 = -anchor._x * orig.width;
				w0 = w1 + orig.width;

				h1 = -anchor._y * orig.height;
				h0 = h1 + orig.height;
			}

			vertexData2d[0] = (wt[0] * w1) + (wt[3] * h1) + wt[6];
			vertexData2d[1] = (wt[1] * w1) + (wt[4] * h1) + wt[7];
			vertexData2d[2] = (wt[2] * w1) + (wt[5] * h1) + wt[8];

			vertexData2d[3] = (wt[0] * w0) + (wt[3] * h1) + wt[6];
			vertexData2d[4] = (wt[1] * w0) + (wt[4] * h1) + wt[7];
			vertexData2d[5] = (wt[2] * w0) + (wt[5] * h1) + wt[8];

			vertexData2d[6] = (wt[0] * w0) + (wt[3] * h0) + wt[6];
			vertexData2d[7] = (wt[1] * w0) + (wt[4] * h0) + wt[7];
			vertexData2d[8] = (wt[2] * w0) + (wt[5] * h0) + wt[8];

			vertexData2d[9] = (wt[0] * w1) + (wt[3] * h0) + wt[6];
			vertexData2d[10] = (wt[1] * w1) + (wt[4] * h0) + wt[7];
			vertexData2d[11] = (wt[2] * w1) + (wt[5] * h0) + wt[8];

			vertexData[0] = vertexData2d[0] / vertexData2d[2];
			vertexData[1] = vertexData2d[1] / vertexData2d[2];

			vertexData[2] = vertexData2d[3] / vertexData2d[5];
			vertexData[3] = vertexData2d[4] / vertexData2d[5];

			vertexData[4] = vertexData2d[6] / vertexData2d[8];
			vertexData[5] = vertexData2d[7] / vertexData2d[8];

			vertexData[6] = vertexData2d[9] / vertexData2d[11];
			vertexData[7] = vertexData2d[10] / vertexData2d[11];
		}

		calculateTrimmedVertices() {
			if (this.proj._affine) {
				super.calculateTrimmedVertices();
				return;
			}

			const wid = (this.transform as any)._worldID;
			const tuid = (this._texture as any)._updateID;
			if (!this.vertexTrimmedData) {
				this.vertexTrimmedData = new Float32Array(8);
			} else if (this._transformTrimmedID === wid && this._textureTrimmedID === tuid) {
				return;
			}

			this._transformTrimmedID = wid;
			this._textureTrimmedID = tuid;

			// lets do some special trim code!
			const texture = this._texture;
			const vertexData = this.vertexTrimmedData;
			const orig = texture.orig;
			const anchor = this._anchor;

			// lets calculate the new untrimmed bounds..
			const wt = this.proj.world.mat3;

			const w1 = -anchor._x * orig.width;
			const w0 = w1 + orig.width;

			const h1 = -anchor._y * orig.height;
			const h0 = h1 + orig.height;

			let z = 1.0 / (wt[2] * w1 + wt[5] * h1 + wt[8]);
			vertexData[0] = z * ((wt[0] * w1) + (wt[3] * h1) + wt[6]);
			vertexData[1] = z * ((wt[1] * w1) + (wt[4] * h1) + wt[7]);

			z = 1.0 / (wt[2] * w0 + wt[5] * h1 + wt[8]);
			vertexData[2] = z * ((wt[0] * w0) + (wt[3] * h1) + wt[6]);
			vertexData[3] = z * ((wt[1] * w0) + (wt[4] * h1) + wt[7]);

			z = 1.0 / (wt[2] * w0 + wt[5] * h0 + wt[8]);
			vertexData[4] = z * ((wt[0] * w0) + (wt[3] * h0) + wt[6]);
			vertexData[5] = z * ((wt[1] * w0) + (wt[4] * h0) + wt[7]);

			z = 1.0 / (wt[2] * w1 + wt[5] * h0 + wt[8]);
			vertexData[6] = z * ((wt[0] * w1) + (wt[3] * h0) + wt[6]);
			vertexData[7] = z * ((wt[1] * w1) + (wt[4] * h0) + wt[7]);
		}

		toLocal<T extends PIXI.IPointData>(position: PIXI.IPointData, from?: PIXI.DisplayObject,
									   point?: T, skipUpdate?: boolean,
									   step = TRANSFORM_STEP.ALL): T {
			return container2dToLocal.call(this, position, from, point, skipUpdate, step);
		}

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}
	}
}
module PIXI.projection {
	export class Text2d extends PIXI.Text {
		constructor(text?: string, style?: PIXI.TextStyle, canvas?: HTMLCanvasElement) {
			super(text, style, canvas);
			this.proj = new Projection2d(this.transform);
			this.pluginName = 'batch2d';
		}

		proj: Projection2d;
		vertexData2d: Float32Array = null;

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}
	}

	Text2d.prototype.calculateVertices = Sprite2d.prototype.calculateVertices;
	(Text2d.prototype as any).calculateTrimmedVertices = Sprite2d.prototype.calculateTrimmedVertices;
	(Text2d.prototype as any)._calculateBounds = Sprite2d.prototype._calculateBounds;
}
module PIXI.projection {
	const tempTransform = new PIXI.Transform();

	export class TilingSprite2d extends PIXI.TilingSprite {
		constructor(texture: PIXI.Texture, width: number, height: number) {
			super(texture, width, height);

			this.tileProj = new Projection2d(this.tileTransform);
			this.tileProj.reverseLocalOrder = true;
			this.proj = new Projection2d(this.transform);

			this.pluginName = 'tilingSprite2d';
			this.uvRespectAnchor = true;
		}

		tileProj: Projection2d;
		proj: Projection2d;

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}

		toLocal<T extends PIXI.IPointData>(position: PIXI.IPointData, from?: PIXI.DisplayObject,
										  point?: T, skipUpdate?: boolean,
										  step = TRANSFORM_STEP.ALL): T {
			return container2dToLocal.call(this, position, from, point, skipUpdate, step);
		}

		_render(renderer: PIXI.Renderer)
		{
			// tweak our texture temporarily..
			const texture = this._texture;

			if (!texture || !texture.valid)
			{
				return;
			}

			// changed
			this.tileTransform.updateTransform(tempTransform);
			this.uvMatrix.update();

			renderer.batch.setObjectRenderer((renderer.plugins as any)[this.pluginName]);
			(renderer.plugins as any)[this.pluginName].render(this);
		}
	}
}
module PIXI.projection {
	let shaderVert =
		`attribute vec2 aVertexPosition;
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
	let shaderFrag = `
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
	let shaderSimpleFrag = `
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

	import WRAP_MODES = PIXI.WRAP_MODES;
	import utils = PIXI.utils;

    export class TilingSprite2dRenderer extends PIXI.ObjectRenderer
    {
        constructor(renderer: PIXI.Renderer)
        {
            super(renderer);

            const uniforms = { globals: this.renderer.globalUniforms };

            this.shader = PIXI.Shader.from(shaderVert, shaderFrag, uniforms);

            this.simpleShader = PIXI.Shader.from(shaderVert, shaderSimpleFrag, uniforms);
        }

        shader: PIXI.Shader;
        simpleShader: PIXI.Shader;
        quad = new PIXI.QuadUv();

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
            renderer.geometry.draw(PIXI.DRAW_MODES.TRIANGLES, 6, 0);
        }
    }

	PIXI.Renderer.registerPlugin('tilingSprite2d', TilingSprite2dRenderer as any);
}
module PIXI.projection {
    PIXI.systems.MaskSystem.prototype.pushSpriteMask =  function(maskData: PIXI.MaskData): void {
        const { maskObject } = maskData;
        const target = (maskData as any)._target;

		let alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex];

		if (!alphaMaskFilter) {
			alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex] = [new SpriteMaskFilter2d(maskObject as PIXI.Sprite)];
		}

		alphaMaskFilter[0].resolution = this.renderer.resolution;
		alphaMaskFilter[0].maskSprite = maskObject;

        const stashFilterArea = target.filterArea;

        target.filterArea = maskObject.getBounds(true);
        this.renderer.filter.push(target, alphaMaskFilter);
        target.filterArea = stashFilterArea;

		this.alphaMaskIndex++;
	}
}
module PIXI.projection {
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

	export class SpriteMaskFilter2d extends PIXI.Filter {
		constructor(sprite: PIXI.Sprite) {
			super(spriteMaskVert, spriteMaskFrag);

			sprite.renderable = false;

			this.maskSprite = sprite;
		}

		maskSprite: PIXI.Sprite;
		maskMatrix = new Matrix2d();

		apply(filterManager: PIXI.systems.FilterSystem, input: PIXI.RenderTexture, output: PIXI.RenderTexture,
              clearMode?: number) {
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
				tex.uvMatrix = new PIXI.TextureMatrix(tex, 0.0);
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

		static calculateSpriteMatrix(input: PIXI.RenderTexture, mappedMatrix: Matrix2d, sprite: PIXI.Sprite) {
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
}
///<reference path="./Container3d.ts"/>
module PIXI.projection {
	export class Camera3d extends Container3d {
		constructor() {
			super();
			this.proj.cameraMode = true;
			this.setPlanes(400, 10, 10000, false);
		}

		_far: number = 0;
		_near: number = 0;
		_focus: number = 0;
		_orthographic: boolean = false;

		get far() {
			return this._far;
		}

		get near() {
			return this._near;
		}

		get focus() {
			return this._focus;
		}

		get ortographic() {
			return this._orthographic;
		}

		setPlanes(focus: number, near: number = 10, far: number = 10000, orthographic: boolean = false) {
			this._focus = focus;
			this._near = near;
			this._far = far;
			this._orthographic = orthographic;

			const proj = this.proj;
			const mat4 = proj.cameraMatrix.mat4;

			proj._projID++;

			mat4[10] = 1.0 / (far - near);
			mat4[14] = (focus - near) / (far - near);
			if (this._orthographic) {
				mat4[11] = 0;
			} else {
				mat4[11] = 1.0 / focus;
			}
		}
	}
}
module PIXI.projection {
	export function container3dWorldTransform() {
		return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
	}

	export class Container3d extends PIXI.Container {
		constructor() {
			super();
			this.proj = new Projection3d(this.transform);
		}

		proj: Projection3d;

		isFrontFace(forceUpdate: boolean = false) {
			if (forceUpdate) {
				this._recursivePostUpdateTransform();
				this.displayObjectUpdateTransform();
			}

			const mat = this.proj.world.mat4;
			const dx1 = mat[0] * mat[15] - mat[3] * mat[12];
			const dy1 = mat[1] * mat[15] - mat[3] * mat[13];
			const dx2 = mat[4] * mat[15] - mat[7] * mat[12];
			const dy2 = mat[5] * mat[15] - mat[7] * mat[13];

			return dx1 * dy2 - dx2 * dy1 > 0;
		}

		/**
		 * returns depth from 0 to 1
		 *
		 * @param {boolean} forceUpdate whether to force matrix updates
		 * @returns {number} depth
		 */
		getDepth(forceUpdate: boolean = false) {
			if (forceUpdate) {
				this._recursivePostUpdateTransform();
				this.displayObjectUpdateTransform();
			}

			const mat4 = this.proj.world.mat4;
			return mat4[14] / mat4[15];
		}


		toLocal<T extends PIXI.Point>(position: PIXI.IPointData, from?: PIXI.DisplayObject,
				point?: T, skipUpdate?: boolean,
				step = TRANSFORM_STEP.ALL): T {

			if (from)
			{
				position = from.toGlobal(position, point, skipUpdate);
			}

			if (!skipUpdate)
			{
				this._recursivePostUpdateTransform();
			}

			if (step === TRANSFORM_STEP.ALL) {
				if (!skipUpdate) {
					this.displayObjectUpdateTransform();
				}
				if (this.proj.affine) {
					return this.transform.worldTransform.applyInverse(position, point) as any;
				}
				return this.proj.world.applyInverse(position, point) as any;
			}

			if (this.parent) {
				point  = this.parent.worldTransform.applyInverse(position, point) as any;
			} else {
				point.copyFrom(position);
			}
			if (step === TRANSFORM_STEP.NONE) {
				return point;
			}

			point = this.transform.localTransform.applyInverse(point, point) as any;
			if (step === TRANSFORM_STEP.PROJ && this.proj.cameraMode) {
				point = this.proj.cameraMatrix.applyInverse(point, point) as any;
			}
			return point;
		}

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}

		get position3d(): PIXI.IPointData {
			return this.proj.position;
		}
		get scale3d(): PIXI.IPointData {
			return this.proj.scale;
		}
		get euler(): IEuler {
			return this.proj.euler;
		}
		get pivot3d(): PIXI.IPointData {
			return this.proj.pivot;
		}
		set position3d(value: PIXI.IPointData) {
			this.proj.position.copyFrom(value);
		}
		set scale3d(value: PIXI.IPointData) {
			this.proj.scale.copyFrom(value);
		}
		set euler(value: IEuler) {
			this.proj.euler.copyFrom(value);
		}
		set pivot3d(value: PIXI.IPointData) {
			this.proj.pivot.copyFrom(value);
		}
	}

	export let container3dToLocal = Container3d.prototype.toLocal;
	export let container3dGetDepth = Container3d.prototype.getDepth;
	export let container3dIsFrontFace = Container3d.prototype.isFrontFace;
}
module PIXI.projection {
	/**
	 * The Euler angles, order is YZX. Except for projections (camera.lookEuler), its reversed XZY
	 * @class
	 * @namespace PIXI.projection
	 * @param x pitch
	 * @param y yaw
	 * @param z roll
	 * @constructor
	 */

	export class Euler {
		constructor(x?: number, y?: number, z?: number) {
			/**
			 * @member {number}
			 * @default 0
			 */
			this._x = x || 0;

			/**
			 * @member {number}
			 * @default 0
			 */
			this._y = y || 0;

			/**
			 * @member {number}
			 * @default 0
			 */
			this._z = z || 0;

			this.quaternion = new Float64Array(4);
			this.quaternion[3] = 1;

			this.update();
		}

		_quatUpdateId = -1;
		_quatDirtyId = 0;

		quaternion: Float64Array;

		_x: number;
		_y: number;
		_z: number;
		_sign: number = 1;

		get x() {
			return this._x;
		}

		set x(value: number) {
			if (this._x !== value) {
				this._x = value;
				this._quatDirtyId++;
			}
		}

		get y() {
			return this._y;
		}

		set y(value: number) {
			if (this._y !== value) {
				this._y = value;
				this._quatDirtyId++;
			}
		}

		get z() {
			return this._z;
		}

		set z(value: number) {
			if (this._z !== value) {
				this._z = value;
				this._quatDirtyId++;
			}
		}

		get pitch() {
			return this._x;
		}

		set pitch(value: number) {
			if (this._x !== value) {
				this._x = value;
				this._quatDirtyId++;
			}
		}

		get yaw() {
			return this._y;
		}

		set yaw(value: number) {
			if (this._y !== value) {
				this._y = value;
				this._quatDirtyId++;
			}
		}

		get roll() {
			return this._z;
		}

		set roll(value: number) {
			if (this._z !== value) {
				this._z = value;
				this._quatDirtyId++;
			}
		}

		set(x?: number, y?: number, z?: number) {
			const _x = x || 0;
			const _y = y || 0;
			const _z = z || 0;
			if (this._x !== _x || this._y !== _y || this._z !== _z) {
				this._x = _x;
				this._y = _y;
				this._z = _z;
				this._quatDirtyId++;
			}
		};

		copyFrom(euler: IEuler) {
			const _x = euler.x;
			const _y = euler.y;
			const _z = euler.z;
			if (this._x !== _x || this._y !== _y || this._z !== _z) {
				this._x = _x;
				this._y = _y;
				this._z = _z;
				this._quatDirtyId++;
			}
		}

		copyTo(p: IEuler) {
			p.set(this._x, this._y, this._z);
			return p;
		}

		equals(euler: IEuler) {
			return this._x === euler.x
				&& this._y === euler.y
				&& this._z === euler.z;
		}

		clone() {
			return new Euler(this._x, this._y, this._z);
		}

		update() {
			if (this._quatUpdateId === this._quatDirtyId) {
				return false;
			}
			this._quatUpdateId = this._quatDirtyId;

			const c1 = Math.cos(this._x / 2);
			const c2 = Math.cos(this._y / 2);
			const c3 = Math.cos(this._z / 2);

			const s = this._sign;
			const s1 = s * Math.sin(this._x / 2);
			const s2 = s * Math.sin(this._y / 2);
			const s3 = s * Math.sin(this._z / 2);

			const q = this.quaternion;

			q[0] = s1 * c2 * c3 + c1 * s2 * s3;
			q[1] = c1 * s2 * c3 - s1 * c2 * s3;
			q[2] = c1 * c2 * s3 + s1 * s2 * c3;
			q[3] = c1 * c2 * c3 - s1 * s2 * s3;

			return true;
		}
	}
}
// according to https://jsperf.com/obj-vs-array-view-access/1 , Float64Array is the best here

module PIXI.projection {
	import IPointData = PIXI.IPointData;
	import IPoint = PIXI.IPoint;

	const mat4id = [1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1];


	export class Matrix3d {
		/**
		 * A default (identity) matrix
		 *
		 * @static
		 * @const
		 */
		static readonly IDENTITY = new Matrix3d();

		/**
		 * A temp matrix
		 *
		 * @static
		 * @const
		 */
		static readonly TEMP_MATRIX = new Matrix3d();

		/**
		 * mat4 implementation through array of 16 elements
		 */
		mat4: Float64Array;

		floatArray: Float32Array = null;

		_dirtyId: number = 0;
		_updateId: number = -1;
		_mat4inv: Float64Array = null;
		cacheInverse: boolean = false;

		constructor(backingArray?: ArrayLike<number>) {
			this.mat4 = new Float64Array(backingArray || mat4id);
		}

		get a() {
			return this.mat4[0] / this.mat4[15];
		}

		get b() {
			return this.mat4[1] / this.mat4[15];
		}

		get c() {
			return this.mat4[4] / this.mat4[15];
		}

		get d() {
			return this.mat4[5] / this.mat4[15];
		}

		get tx() {
			return this.mat4[12] / this.mat4[15];
		}

		get ty() {
			return this.mat4[13] / this.mat4[15];
		}

		set a(value: number) {
			this.mat4[0] = value * this.mat4[15];
		}

		set b(value: number) {
			this.mat4[1] = value * this.mat4[15];
		}

		set c(value: number) {
			this.mat4[4] = value * this.mat4[15];
		}

		set d(value: number) {
			this.mat4[5] = value * this.mat4[15];
		}

		set tx(value: number) {
			this.mat4[12] = value * this.mat4[15];
		}

		set ty(value: number) {
			this.mat4[13] = value * this.mat4[15];
		}

		set(a: number, b: number, c: number, d: number, tx: number, ty: number) {
			let mat4 = this.mat4;
			mat4[0] = a;
			mat4[1] = b;
			mat4[2] = 0;
			mat4[3] = 0;
			mat4[4] = c;
			mat4[5] = d;
			mat4[6] = 0;
			mat4[7] = 0;
			mat4[8] = 0;
			mat4[9] = 0;
			mat4[10] = 1;
			mat4[11] = 0;
			mat4[12] = tx;
			mat4[13] = ty;
			mat4[14] = 0;
			mat4[15] = 1;
			return this;
		}

		toArray(transpose?: boolean, out?: Float32Array): Float32Array {
			if (!this.floatArray) {
				this.floatArray = new Float32Array(9);
			}

			const array = out || this.floatArray;
			const mat3 = this.mat4;

			if (transpose) {
				array[0] = mat3[0];
				array[1] = mat3[1];
				array[2] = mat3[3];
				array[3] = mat3[4];
				array[4] = mat3[5];
				array[5] = mat3[7];
				array[6] = mat3[12];
				array[7] = mat3[13];
				array[8] = mat3[15];
			}
			else {
				//this branch is NEVER USED in pixi
				array[0] = mat3[0];
				array[1] = mat3[4];
				array[2] = mat3[12];
				array[3] = mat3[2];
				array[4] = mat3[6];
				array[5] = mat3[13];
				array[6] = mat3[3];
				array[7] = mat3[7];
				array[8] = mat3[15];
			}

			return array;
		}

		setToTranslation(tx: number, ty: number, tz: number) {
			const mat4 = this.mat4;

			mat4[0] = 1;
			mat4[1] = 0;
			mat4[2] = 0;
			mat4[3] = 0;

			mat4[4] = 0;
			mat4[5] = 1;
			mat4[6] = 0;
			mat4[7] = 0;

			mat4[8] = 0;
			mat4[9] = 0;
			mat4[10] = 1;
			mat4[11] = 0;

			mat4[12] = tx;
			mat4[13] = ty;
			mat4[14] = tz;
			mat4[15] = 1;
		}

		setToRotationTranslationScale(quat: Float64Array, tx: number, ty: number, tz: number, sx: number, sy: number, sz: number) {
			const out = this.mat4;

			let x = quat[0], y = quat[1], z = quat[2], w = quat[3];
			let x2 = x + x;
			let y2 = y + y;
			let z2 = z + z;

			let xx = x * x2;
			let xy = x * y2;
			let xz = x * z2;
			let yy = y * y2;
			let yz = y * z2;
			let zz = z * z2;
			let wx = w * x2;
			let wy = w * y2;
			let wz = w * z2;

			out[0] = (1 - (yy + zz)) * sx;
			out[1] = (xy + wz) * sx;
			out[2] = (xz - wy) * sx;
			out[3] = 0;
			out[4] = (xy - wz) * sy;
			out[5] = (1 - (xx + zz)) * sy;
			out[6] = (yz + wx) * sy;
			out[7] = 0;
			out[8] = (xz + wy) * sz;
			out[9] = (yz - wx) * sz;
			out[10] = (1 - (xx + yy)) * sz;
			out[11] = 0;
			out[12] = tx;
			out[13] = ty;
			out[14] = tz;
			out[15] = 1;

			return out;
		}

		apply(pos: IPointData, newPos: IPointData): IPointData {
			newPos = newPos || new Point3d();

			const mat4 = this.mat4;
			const x = pos.x;
			const y = pos.y;
			const z = pos.z || 0;

			//TODO: apply for 2d point

			let w = 1.0 / (mat4[3] * x + mat4[7] * y + mat4[11] * z + mat4[15]);
			newPos.x = w * (mat4[0] * x + mat4[4] * y + mat4[8] * z + mat4[12]);
			newPos.y = w * (mat4[1] * x + mat4[5] * y + mat4[9] * z + mat4[13]);
			newPos.z = w * (mat4[2] * x + mat4[6] * y + mat4[10] * z + mat4[14]);

			return newPos;
		}

		translate(tx: number, ty: number, tz: number) {
			const a = this.mat4;

			a[12] = a[0] * tx + a[4] * ty + a[8] * tz + a[12];
			a[13] = a[1] * tx + a[5] * ty + a[9] * tz + a[13];
			a[14] = a[2] * tx + a[6] * ty + a[10] * tz + a[14];
			a[15] = a[3] * tx + a[7] * ty + a[11] * tz + a[15];

			return this;
		}

		scale(x: number, y: number, z?: number) {
			const mat4 = this.mat4;
			mat4[0] *= x;
			mat4[1] *= x;
			mat4[2] *= x;
			mat4[3] *= x;

			mat4[4] *= y;
			mat4[5] *= y;
			mat4[6] *= y;
			mat4[7] *= y;

			if (z !== undefined) {
				mat4[8] *= z;
				mat4[9] *= z;
				mat4[10] *= z;
				mat4[11] *= z;
			}

			return this;
		}

		scaleAndTranslate(scaleX: number, scaleY: number, scaleZ: number, tx: number, ty: number, tz: number) {
			const mat4 = this.mat4;
			mat4[0] = scaleX * mat4[0] + tx * mat4[3];
			mat4[1] = scaleY * mat4[1] + ty * mat4[3];
			mat4[2] = scaleZ * mat4[2] + tz * mat4[3];

			mat4[4] = scaleX * mat4[4] + tx * mat4[7];
			mat4[5] = scaleY * mat4[5] + ty * mat4[7];
			mat4[6] = scaleZ * mat4[6] + tz * mat4[7];

			mat4[8] = scaleX * mat4[8] + tx * mat4[11];
			mat4[9] = scaleY * mat4[9] + ty * mat4[11];
			mat4[10] = scaleZ * mat4[10] + tz * mat4[11];

			mat4[12] = scaleX * mat4[12] + tx * mat4[15];
			mat4[13] = scaleY * mat4[13] + ty * mat4[15];
			mat4[14] = scaleZ * mat4[14] + tz * mat4[15];
		}

		//TODO: remove props
		applyInverse(pos: IPointData, newPos: IPoint): IPointData {
			newPos = newPos || new Point3d();
			if (!this._mat4inv) {
				this._mat4inv = new Float64Array(16);
			}

			const mat4 = this._mat4inv;
			const a = this.mat4;
			const x = pos.x;
			const y = pos.y;
			let z = pos.z || 0;

			if (!this.cacheInverse || this._updateId !== this._dirtyId) {
				this._updateId = this._dirtyId;
				Matrix3d.glMatrixMat4Invert(mat4, a);
			}

			let w1 = 1.0 / (mat4[3] * x + mat4[7] * y + mat4[11] * z + mat4[15]);
			const x1 = w1 * (mat4[0] * x + mat4[4] * y + mat4[8] * z + mat4[12]);
			const y1 = w1 * (mat4[1] * x + mat4[5] * y + mat4[9] * z + mat4[13]);
			const z1 = w1 * (mat4[2] * x + mat4[6] * y + mat4[10] * z + mat4[14]);

			z += 1.0;

			let w2 = 1.0 / (mat4[3] * x + mat4[7] * y + mat4[11] * z + mat4[15]);
			const x2 = w2 * (mat4[0] * x + mat4[4] * y + mat4[8] * z + mat4[12]);
			const y2 = w2 * (mat4[1] * x + mat4[5] * y + mat4[9] * z + mat4[13]);
			const z2 = w2 * (mat4[2] * x + mat4[6] * y + mat4[10] * z + mat4[14]);

			if (Math.abs(z1-z2)<1e-10) {
				newPos.set(NaN, NaN, 0);
			}

			const alpha = (0-z1) / (z2-z1);
			newPos.set( (x2-x1)*alpha + x1, (y2-y1)*alpha + y1, 0.0);
			return newPos;
		}

		invert(): Matrix3d {
			Matrix3d.glMatrixMat4Invert(this.mat4, this.mat4);
			return this;
		}

		invertCopyTo(matrix: Matrix3d) {
			if (!this._mat4inv) {
				this._mat4inv = new Float64Array(16);
			}

			const mat4 = this._mat4inv;
			const a = this.mat4;

			if (!this.cacheInverse || this._updateId !== this._dirtyId) {
				this._updateId = this._dirtyId;
				Matrix3d.glMatrixMat4Invert(mat4, a);
			}

			matrix.mat4.set(mat4);
		}

		identity(): Matrix3d {
			const mat3 = this.mat4;
			mat3[0] = 1;
			mat3[1] = 0;
			mat3[2] = 0;
			mat3[3] = 0;

			mat3[4] = 0;
			mat3[5] = 1;
			mat3[6] = 0;
			mat3[7] = 0;

			mat3[8] = 0;
			mat3[9] = 0;
			mat3[10] = 1;
			mat3[11] = 0;

			mat3[12] = 0;
			mat3[13] = 0;
			mat3[14] = 0;
			mat3[15] = 1;
			return this;
		}

		clone() {
			return new Matrix3d(this.mat4);
		}

		copyTo3d(matrix: Matrix3d) {
			const mat3 = this.mat4;
			const ar2 = matrix.mat4;
			ar2[0] = mat3[0];
			ar2[1] = mat3[1];
			ar2[2] = mat3[2];
			ar2[3] = mat3[3];
			ar2[4] = mat3[4];
			ar2[5] = mat3[5];
			ar2[6] = mat3[6];
			ar2[7] = mat3[7];
			ar2[8] = mat3[8];
			return matrix;
		}

		copyTo2d(matrix: Matrix2d) {
			const mat3 = this.mat4;
			const ar2 = matrix.mat3;
			ar2[0] = mat3[0];
			ar2[1] = mat3[1];
			ar2[2] = mat3[3];
			ar2[3] = mat3[4];
			ar2[4] = mat3[5];
			ar2[5] = mat3[7];
			ar2[6] = mat3[12];
			ar2[7] = mat3[13];
			ar2[8] = mat3[15];
			return matrix;
		}

		copyTo2dOr3d(matrix: Matrix2d | Matrix3d) {
			if (matrix instanceof Matrix2d) {
				return this.copyTo2d(matrix);
			} else {
				return this.copyTo3d(matrix);
			}
		}

		/**
		 * legacy method, change the values of given pixi matrix
		 * @param matrix
		 * @return matrix
		 */
		copyTo(matrix: PIXI.Matrix, affine?: AFFINE, preserveOrientation?: boolean) {
			const mat3 = this.mat4;
			const d = 1.0 / mat3[15];
			const tx = mat3[12] * d, ty = mat3[13] * d;
			matrix.a = (mat3[0] - mat3[3] * tx) * d;
			matrix.b = (mat3[1] - mat3[3] * ty) * d;
			matrix.c = (mat3[4] - mat3[7] * tx) * d;
			matrix.d = (mat3[5] - mat3[7] * ty) * d;
			matrix.tx = tx;
			matrix.ty = ty;

			if (affine >= 2) {
				let D = matrix.a * matrix.d - matrix.b * matrix.c;
				if (!preserveOrientation) {
					D = Math.abs(D);
				}
				if (affine === AFFINE.POINT) {
					if (D > 0) {
						D = 1;
					} else D = -1;
					matrix.a = D;
					matrix.b = 0;
					matrix.c = 0;
					matrix.d = D;
				} else if (affine === AFFINE.AXIS_X) {
					D /= Math.sqrt(matrix.b * matrix.b + matrix.d * matrix.d);
					matrix.c = 0;
					matrix.d = D;
				} else if (affine === AFFINE.AXIS_Y) {
					D /= Math.sqrt(matrix.a * matrix.a + matrix.c * matrix.c);
					matrix.a = D;
					matrix.c = 0;
				}
			}
			return matrix;
		}

		/**
		 * legacy method, change the values of given pixi matrix
		 * @param matrix
		 * @return
		 */
		copyFrom(matrix: PIXI.Matrix) {
			const mat3 = this.mat4;
			mat3[0] = matrix.a;
			mat3[1] = matrix.b;
			mat3[2] = 0;
			mat3[3] = 0;

			mat3[4] = matrix.c;
			mat3[5] = matrix.d;
			mat3[6] = 0;
			mat3[7] = 0;

			mat3[8] = 0;
			mat3[9] = 0;
			mat3[10] = 1;
			mat3[11] = 0;

			mat3[12] = matrix.tx;
			mat3[13] = matrix.ty;
			mat3[14] = 0;
			mat3[15] = 1;

			this._dirtyId++;
			return this;
		}

		setToMultLegacy(pt: PIXI.Matrix, lt: Matrix3d) {
			const out = this.mat4;
			const b = lt.mat4;

			const a00 = pt.a, a01 = pt.b,
				a10 = pt.c, a11 = pt.d,
				a30 = pt.tx, a31 = pt.ty;

			let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];

			out[0] = b0 * a00 + b1 * a10 + b3 * a30;
			out[1] = b0 * a01 + b1 * a11 + b3 * a31;
			out[2] = b2;
			out[3] = b3;

			b0 = b[4];
			b1 = b[5];
			b2 = b[6];
			b3 = b[7];
			out[4] = b0 * a00 + b1 * a10 + b3 * a30;
			out[5] = b0 * a01 + b1 * a11 + b3 * a31;
			out[6] = b2;
			out[7] = b3;

			b0 = b[8];
			b1 = b[9];
			b2 = b[10];
			b3 = b[11];
			out[8] = b0 * a00 + b1 * a10 + b3 * a30;
			out[9] = b0 * a01 + b1 * a11 + b3 * a31;
			out[10] = b2;
			out[11] = b3;

			b0 = b[12];
			b1 = b[13];
			b2 = b[14];
			b3 = b[15];
			out[12] = b0 * a00 + b1 * a10 + b3 * a30;
			out[13] = b0 * a01 + b1 * a11 + b3 * a31;
			out[14] = b2;
			out[15] = b3;

			this._dirtyId++;
			return this;
		}

		setToMultLegacy2(pt: Matrix3d, lt: PIXI.Matrix) {
			const out = this.mat4;
			const a = pt.mat4;

			const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
			const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];

			const b00 = lt.a, b01 = lt.b,
				b10 = lt.c, b11 = lt.d,
				b30 = lt.tx, b31 = lt.ty;

			out[0] = b00 * a00 + b01 * a10;
			out[1] = b00 * a01 + b01 * a11;
			out[2] = b00 * a02 + b01 * a12;
			out[3] = b00 * a03 + b01 * a13;

			out[4] = b10 * a00 + b11 * a10;
			out[5] = b10 * a01 + b11 * a11;
			out[6] = b10 * a02 + b11 * a12;
			out[7] = b10 * a03 + b11 * a13;

			out[8] = a[8];
			out[9] = a[9];
			out[10] = a[10];
			out[11] = a[11];

			out[12] = b30 * a00 + b31 * a10 + a[12];
			out[13] = b30 * a01 + b31 * a11 + a[13];
			out[14] = b30 * a02 + b31 * a12 + a[14];
			out[15] = b30 * a03 + b31 * a13 + a[15];

			this._dirtyId++;
			return this;
		}

		// that's transform multiplication we use
		setToMult(pt: Matrix3d, lt: Matrix3d) {
			Matrix3d.glMatrixMat4Multiply(this.mat4, pt.mat4, lt.mat4);

			this._dirtyId++;
			return this;
		}

		prepend(lt: any) {
			if (lt.mat4) {
				this.setToMult(lt, this);
			} else {
				this.setToMultLegacy(lt, this);
			}
		}

		static glMatrixMat4Invert(out: Float64Array, a: Float64Array) {
			let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
			let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
			let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
			let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

			let b00 = a00 * a11 - a01 * a10;
			let b01 = a00 * a12 - a02 * a10;
			let b02 = a00 * a13 - a03 * a10;
			let b03 = a01 * a12 - a02 * a11;
			let b04 = a01 * a13 - a03 * a11;
			let b05 = a02 * a13 - a03 * a12;
			let b06 = a20 * a31 - a21 * a30;
			let b07 = a20 * a32 - a22 * a30;
			let b08 = a20 * a33 - a23 * a30;
			let b09 = a21 * a32 - a22 * a31;
			let b10 = a21 * a33 - a23 * a31;
			let b11 = a22 * a33 - a23 * a32;

			// Calculate the determinant
			let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

			if (!det) {
				return null;
			}
			det = 1.0 / det;

			out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
			out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
			out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
			out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
			out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
			out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
			out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
			out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
			out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
			out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
			out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
			out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
			out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
			out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
			out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
			out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

			return out;
		}

		static glMatrixMat4Multiply(out: Float64Array, a: Float64Array, b: Float64Array) {
			let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
			let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
			let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
			let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

			// Cache only the current line of the second matrix
			let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
			out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
			out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
			out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
			out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

			b0 = b[4];
			b1 = b[5];
			b2 = b[6];
			b3 = b[7];
			out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
			out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
			out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
			out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

			b0 = b[8];
			b1 = b[9];
			b2 = b[10];
			b3 = b[11];
			out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
			out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
			out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
			out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

			b0 = b[12];
			b1 = b[13];
			b2 = b[14];
			b3 = b[15];
			out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
			out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
			out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
			out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
			return out;
		}
	}
}
module PIXI.projection {
	export class Mesh3d2d extends PIXI.Mesh {
		constructor(geometry: PIXI.Geometry, shader: PIXI.MeshMaterial, state: PIXI.State, drawMode?: number)
		{
			super(geometry, shader, state, drawMode);
			this.proj = new Projection3d(this.transform);
		}

		vertexData2d: Float32Array = null;
		proj: Projection3d;

		calculateVertices()
		{
			if (this.proj._affine) {
				this.vertexData2d = null;
				super.calculateVertices();
				return;
			}

			const geometry = this.geometry as any;
			const vertices = geometry.buffers[0].data;
			const thisAny = this as any;

			if (geometry.vertexDirtyId === thisAny.vertexDirty && thisAny._transformID === thisAny.transform._worldID)
			{
				return;
			}

			thisAny._transformID = thisAny.transform._worldID;

			if (thisAny.vertexData.length !== vertices.length)
			{
				thisAny.vertexData = new Float32Array(vertices.length);
			}
			if (!this.vertexData2d || this.vertexData2d.length  !== vertices.length * 3 / 2)
			{
				this.vertexData2d = new Float32Array(vertices.length * 3);
			}

			const wt = this.proj.world.mat4;

			const vertexData2d = this.vertexData2d;
			const vertexData = thisAny.vertexData;

			for (let i = 0; i < vertexData.length / 2; i++)
			{
				const x = vertices[(i * 2)];
				const y = vertices[(i * 2) + 1];

				const xx = (wt[0] * x) + (wt[4] * y) + wt[12];
				const yy = (wt[1] * x) + (wt[5] * y) + wt[13];
				const ww = (wt[3] * x) + (wt[7] * y) + wt[15];

				vertexData2d[i * 3] = xx;
				vertexData2d[i * 3 + 1] = yy;
				vertexData2d[i * 3 + 2] = ww;

				vertexData[(i * 2)] = xx / ww;
				vertexData[(i * 2) + 1] = yy / ww;
			}

			thisAny.vertexDirty = geometry.vertexDirtyId;
		}

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}

		toLocal<T extends PIXI.IPointData>(position: PIXI.IPointData, from?: PIXI.DisplayObject,
									   point?: T, skipUpdate?: boolean,
									   step = TRANSFORM_STEP.ALL): T {
			return container3dToLocal.call(this, position, from, point, skipUpdate, step);
		}

		isFrontFace(forceUpdate?: boolean) {
			return container3dIsFrontFace.call(this, forceUpdate);
		}

		getDepth(forceUpdate?: boolean) {
			return container3dGetDepth.call(this, forceUpdate);
		}

		get position3d(): PIXI.IPointData {
			return this.proj.position;
		}
		get scale3d(): PIXI.IPointData {
			return this.proj.scale;
		}
		get euler(): Euler {
			return this.proj.euler;
		}
		get pivot3d(): PIXI.IPointData {
			return this.proj.pivot;
		}
		set position3d(value: PIXI.IPointData) {
			this.proj.position.copyFrom(value);
		}
		set scale3d(value: PIXI.IPointData) {
			this.proj.scale.copyFrom(value);
		}
		set euler(value: Euler) {
			this.proj.euler.copyFrom(value);
		}
		set pivot3d(value: PIXI.IPointData) {
			this.proj.pivot.copyFrom(value);
		}
	}

	(Mesh3d2d.prototype as any)._renderDefault = Mesh2d.prototype._renderDefault;

	export class SimpleMesh3d2d extends Mesh3d2d {
		constructor(texture: PIXI.Texture, vertices?: Float32Array, uvs?: Float32Array,
					indices?: Uint16Array, drawMode?: number) {
			super(new PIXI.MeshGeometry(vertices, uvs, indices),
				new PIXI.MeshMaterial(texture, {
					program: PIXI.Program.from(Mesh2d.defaultVertexShader, Mesh2d.defaultFragmentShader),
					pluginName: 'batch2d'
				}),
				null,
				drawMode);

			(this.geometry.getBuffer('aVertexPosition') as any).static = false;
		}

		autoUpdate = true;

		get vertices()
		{
			return this.geometry.getBuffer('aVertexPosition').data as Float32Array;
		}
		set vertices(value)
		{
			this.geometry.getBuffer('aVertexPosition').data = value;
		}

		protected _render(renderer?: PIXI.Renderer)
		{
			if (this.autoUpdate)
			{
				this.geometry.getBuffer('aVertexPosition').update();
			}

			(super._render as any)(renderer);
		}
	}
}
module PIXI.projection {
	export type IEuler = Euler | ObservableEuler;

	/**
	 * The Euler angles, order is YZX. Except for projections (camera.lookEuler), its reversed XZY
	 * @class
	 * @namespace PIXI.projection
	 * @param x pitch
	 * @param y yaw
	 * @param z roll
	 * @constructor
	 */

	export class ObservableEuler {
		constructor(public cb: any, public scope: any, x?: number, y?: number, z?: number) {
			/**
			 * @member {number}
			 * @default 0
			 */
			this._x = x || 0;

			/**
			 * @member {number}
			 * @default 0
			 */
			this._y = y || 0;

			/**
			 * @member {number}
			 * @default 0
			 */
			this._z = z || 0;

			this.quaternion = new Float64Array(4);
			this.quaternion[3] = 1;

			this.update();
		}

		_quatUpdateId = -1;
		_quatDirtyId = 0;

		quaternion: Float64Array;

		_x: number;
		_y: number;
		_z: number;
		_sign: number = 1;

		get x() {
			return this._x;
		}

		set x(value: number) {
			if (this._x !== value) {
				this._x = value;
				this._quatDirtyId++;
				this.cb.call(this.scope);
			}
		}

		get y() {
			return this._y;
		}

		set y(value: number) {
			if (this._y !== value) {
				this._y = value;
				this._quatDirtyId++;
				this.cb.call(this.scope);
			}
		}

		get z() {
			return this._z;
		}

		set z(value: number) {
			if (this._z !== value) {
				this._z = value;
				this._quatDirtyId++;
				this.cb.call(this.scope);
			}
		}

		get pitch() {
			return this._x;
		}

		set pitch(value: number) {
			if (this._x !== value) {
				this._x = value;
				this._quatDirtyId++;
				this.cb.call(this.scope);
			}
		}

		get yaw() {
			return this._y;
		}

		set yaw(value: number) {
			if (this._y !== value) {
				this._y = value;
				this._quatDirtyId++;
				this.cb.call(this.scope);
			}
		}

		get roll() {
			return this._z;
		}

		set roll(value: number) {
			if (this._z !== value) {
				this._z = value;
				this._quatDirtyId++;
				this.cb.call(this.scope);
			}
		}

		set(x?: number, y?: number, z?: number) {
			const _x = x || 0;
			const _y = y || 0;
			const _z = z || 0;
			if (this._x !== _x || this._y !== _y || this._z !== _z) {
				this._x = _x;
				this._y = _y;
				this._z = _z;
				this._quatDirtyId++;
				this.cb.call(this.scope);
			}
		};

		copyFrom(euler: IEuler) {
			const _x = euler.x;
			const _y = euler.y;
			const _z = euler.z;
			if (this._x !== _x || this._y !== _y || this._z !== _z) {
				this._x = _x;
				this._y = _y;
				this._z = _z;
				this._quatDirtyId++;
				this.cb.call(this.scope);
			}
		}

		copyTo(p: IEuler) {
			p.set(this._x, this._y, this._z);
			return p;
		}

		equals(euler: IEuler) {
			return this._x === euler.x
				&& this._y === euler.y
				&& this._z === euler.z;
		}

		clone() {
			return new Euler(this._x, this._y, this._z);
		}

		update() {
			if (this._quatUpdateId === this._quatDirtyId) {
				return false;
			}
			this._quatUpdateId = this._quatDirtyId;

			const c1 = Math.cos(this._x / 2);
			const c2 = Math.cos(this._y / 2);
			const c3 = Math.cos(this._z / 2);

			const s = this._sign;
			const s1 = s * Math.sin(this._x / 2);
			const s2 = s * Math.sin(this._y / 2);
			const s3 = s * Math.sin(this._z / 2);

			const q = this.quaternion;

			q[0] = s1 * c2 * c3 + c1 * s2 * s3;
			q[1] = c1 * s2 * c3 - s1 * c2 * s3;
			q[2] = c1 * c2 * s3 + s1 * s2 * c3;
			q[3] = c1 * c2 * c3 - s1 * s2 * s3;

			return true;
		}
	}
}
declare namespace PIXI {
	export interface IPointData {
		z?: number;
	}

	export interface IPoint {
		set(x?: number, y?: number, z?: number): void;
	}


	export interface Point {
		z?: number;
		set(x?: number, y?: number, z?: number): void;
	}

	export interface ObservablePoint {
		_z?: number;
		z: number;
		cb?: any;
		scope?: any;
		set(x?: number, y?: number, z?: number): void;
	}
}

module PIXI.projection {
	export class Point3d extends PIXI.Point {
		constructor(x?: number, y?: number, z?: number) {
			super(x, y);
			this.z = z;
		}

		set(x?: number, y?: number, z?: number) {
			this.x = x || 0;
			this.y = (y === undefined) ? this.x : (y || 0);
			this.z = (y === undefined) ? this.x : (z || 0);
			return this;
		}

		copyFrom(p: PIXI.IPointData) {
			this.set(p.x, p.y, p.z || 0);
			return this;
		}

		copyTo(p: PIXI.IPoint) {
			p.set(this.x, this.y, this.z);
			return p;
		}
	}

	export class ObservablePoint3d extends PIXI.ObservablePoint {
		_z: number = 0;

		get z() {
			return this._z;
		}

		set z(value) {
			if (this._z !== value) {
				this._z = value;
				this.cb.call(this.scope);
			}
		}

		set(x?: number, y?: number, z?: number) {
			const _x = x || 0;
			const _y = (y === undefined) ? _x : (y || 0);
			const _z = (y === undefined) ? _x : (z || 0);

			if (this._x !== _x || this._y !== _y || this._z !== _z) {
				this._x = _x;
				this._y = _y;
				this._z = _z;
				this.cb.call(this.scope);
			}
			return this;
		}

		copyFrom(p: PIXI.IPointData) {
			this.set(p.x, p.y, p.z || 0);
			return this;
		}

		copyTo(p: PIXI.IPoint) {
			p.set(this._x, this._y, this._z);
			return p;
		}
	}
}
module PIXI.projection {
	const tempMat = new Matrix3d();

	export class Projection3d extends LinearProjection<Matrix3d> {

		constructor(legacy: PIXI.Transform, enable?: boolean) {
			super(legacy, enable);
			this.local = new Matrix3d();
			this.world = new Matrix3d();

			this.local.cacheInverse = true;
			this.world.cacheInverse = true;

			this.position._z = 0;
			this.scale._z = 1;
			this.pivot._z = 0;
		}

		cameraMatrix: Matrix3d = null;

		_cameraMode = false;

		get cameraMode() {
			return this._cameraMode;
		}

		set cameraMode(value: boolean) {
			if (this._cameraMode === value) {
				return;
			}
			this._cameraMode = value;

			this.euler._sign = this._cameraMode ? -1 : 1;
			this.euler._quatDirtyId++;

			if (value) {
				this.cameraMatrix = new Matrix3d();
			}
		}

		position = new ObservablePoint3d(this.onChange, this, 0, 0);
		scale = new ObservablePoint3d(this.onChange, this, 1, 1);
		euler = new ObservableEuler(this.onChange, this, 0, 0, 0);
		pivot = new ObservablePoint3d(this.onChange, this, 0, 0);

		onChange() {
			this._projID++;
		}

		clear() {
			if (this.cameraMatrix) {
				this.cameraMatrix.identity();
			}
			this.position.set(0, 0, 0);
			this.scale.set(1, 1, 1);
			this.euler.set(0, 0, 0);
			this.pivot.set(0, 0, 0);
			super.clear();
		}

		updateLocalTransform(lt: PIXI.Matrix) {
			if (this._projID === 0) {
				this.local.copyFrom(lt);
				return;
			}
			const matrix = this.local;
			const euler = this.euler;
			const pos = this.position;
			const scale = this.scale;
			const pivot = this.pivot;

			euler.update();

			if (!this.cameraMode) {
				matrix.setToRotationTranslationScale(euler.quaternion, pos._x, pos._y, pos._z, scale._x, scale._y, scale._z);
				matrix.translate(-pivot._x, -pivot._y, -pivot._z);
				matrix.setToMultLegacy(lt, matrix);
				return;
			}

			matrix.setToMultLegacy(lt, this.cameraMatrix);
			matrix.translate(pivot._x, pivot._y, pivot._z);
			matrix.scale(1.0 / scale._x, 1.0 / scale._y, 1.0 / scale._z);
			tempMat.setToRotationTranslationScale(euler.quaternion, 0, 0, 0, 1, 1, 1);
			matrix.setToMult(matrix, tempMat);
			matrix.translate(-pos._x, -pos._y, -pos._z);

			this.local._dirtyId++;
		}
	}
}
declare module PIXI {
	interface Container {
		convertTo3d(): void;
		convertSubtreeTo3d(): void;
	}
}

module PIXI.projection {

	const containerProps: any = {
		worldTransform: {
			get: container3dWorldTransform,
			enumerable: true,
			configurable: true
		},
		position3d: {
			get: function() { return this.proj.position },
			set: function(value: any) { this.proj.position.copy(value) }
		},
		scale3d: {
			get: function() { return this.proj.scale },
			set: function(value: any) { this.proj.scale.copy(value) }
		},
		pivot3d: {
			get: function() { return this.proj.pivot },
			set: function(value: any) { this.proj.pivot.copy(value) }
		},
		euler: {
			get: function() { return this.proj.euler },
			set: function(value: any) { this.proj.euler.copy(value) }
		}
	};

	function convertTo3d() {
		if (this.proj) return;
		this.proj = new Projection3d(this.transform);
		this.toLocal = Container3d.prototype.toLocal;
		this.isFrontFace = Container3d.prototype.isFrontFace;
		this.getDepth = Container3d.prototype.getDepth;
		Object.defineProperties(this, containerProps);
	}

	(PIXI as any).Container.prototype.convertTo3d = convertTo3d;

	(PIXI as any).Sprite.prototype.convertTo3d = function () {
		if (this.proj) return;
		this.calculateVertices = Sprite3d.prototype.calculateVertices;
		this.calculateTrimmedVertices = Sprite3d.prototype.calculateTrimmedVertices;
		this._calculateBounds = Sprite3d.prototype._calculateBounds;
		this.containsPoint = Sprite3d.prototype.containsPoint;
		this.pluginName = 'batch2d';
		convertTo3d.call(this);
	};

	(PIXI as any).Container.prototype.convertSubtreeTo3d = function () {
		this.convertTo3d();
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].convertSubtreeTo3d();
		}
	};

	if (PIXI.SimpleMesh) {
		(PIXI as any).SimpleMesh.prototype.convertTo3d =
			(PIXI as any).SimpleRope.prototype.convertTo3d =
				function () {
					if (this.proj) return;
					this.calculateVertices = Mesh3d2d.prototype.calculateVertices;
					this._renderDefault = (Mesh3d2d.prototype as any)._renderDefault;
					if (this.material.pluginName !== 'batch2d') {
						this.material = new PIXI.MeshMaterial(this.material.texture, {
							program: PIXI.Program.from(Mesh2d.defaultVertexShader, Mesh2d.defaultFragmentShader),
							pluginName: 'batch2d'
						});
					}
					convertTo3d.call(this);
				};
	}
}
module PIXI.projection {
	/**
	 * Same as Sprite2d, but
	 * 1. uses Matrix3d in proj
	 * 2. does not render if at least one vertex is behind camera
	 */
	export class Sprite3d extends PIXI.Sprite {
		constructor(texture: PIXI.Texture) {
			super(texture);
			this.proj = new Projection3d(this.transform);
			this.pluginName = 'batch2d';
		}

		vertexData2d: Float32Array = null;
		proj: Projection3d;
		culledByFrustrum = false;
		trimmedCulledByFrustrum = false;

		calculateVertices() {
			const texture = this._texture;

			if (this.proj._affine) {
				this.vertexData2d = null;
				super.calculateVertices();
				return;
			}
			if (!this.vertexData2d) {
				this.vertexData2d = new Float32Array(12);
			}

			const wid = (this.transform as any)._worldID;
			const tuid = (texture as any)._updateID;
			if (this._transformID === wid && this._textureID === tuid) {
				return;
			}
			// update texture UV here, because base texture can be changed without calling `_onTextureUpdate`
			if (this._textureID !== tuid) {
				(this as any).uvs = (texture as any)._uvs.uvsFloat32;
			}

			this._transformID = wid;
			this._textureID = tuid;

			const wt = this.proj.world.mat4;
			const vertexData2d = this.vertexData2d;
			const vertexData = this.vertexData;
			const trim = texture.trim;
			const orig = texture.orig;
			const anchor = this._anchor;

			let w0 = 0;
			let w1 = 0;
			let h0 = 0;
			let h1 = 0;

			if (trim) {
				w1 = trim.x - (anchor._x * orig.width);
				w0 = w1 + trim.width;

				h1 = trim.y - (anchor._y * orig.height);
				h0 = h1 + trim.height;
			} else {
				w1 = -anchor._x * orig.width;
				w0 = w1 + orig.width;

				h1 = -anchor._y * orig.height;
				h0 = h1 + orig.height;
			}

			let culled = false;

			let z;

			vertexData2d[0] = (wt[0] * w1) + (wt[4] * h1) + wt[12];
			vertexData2d[1] = (wt[1] * w1) + (wt[5] * h1) + wt[13];
			z = (wt[2] * w1) + (wt[6] * h1) + wt[14];
			vertexData2d[2] = (wt[3] * w1) + (wt[7] * h1) + wt[15];
			culled = culled || z < 0;

			vertexData2d[3] = (wt[0] * w0) + (wt[4] * h1) + wt[12];
			vertexData2d[4] = (wt[1] * w0) + (wt[5] * h1) + wt[13];
			z = (wt[2] * w0) + (wt[6] * h1) + wt[14];
			vertexData2d[5] = (wt[3] * w0) + (wt[7] * h1) + wt[15];
			culled = culled || z < 0;

			vertexData2d[6] = (wt[0] * w0) + (wt[4] * h0) + wt[12];
			vertexData2d[7] = (wt[1] * w0) + (wt[5] * h0) + wt[13];
			z = (wt[2] * w0) + (wt[6] * h0) + wt[14];
			vertexData2d[8] = (wt[3] * w0) + (wt[7] * h0) + wt[15];
			culled = culled || z < 0;

			vertexData2d[9] = (wt[0] * w1) + (wt[4] * h0) + wt[12];
			vertexData2d[10] = (wt[1] * w1) + (wt[5] * h0) + wt[13];
			z = (wt[2] * w1) + (wt[6] * h0) + wt[14];
			vertexData2d[11] = (wt[3] * w1) + (wt[7] * h0) + wt[15];
			culled = culled || z < 0;

			this.culledByFrustrum = culled;

			vertexData[0] = vertexData2d[0] / vertexData2d[2];
			vertexData[1] = vertexData2d[1] / vertexData2d[2];

			vertexData[2] = vertexData2d[3] / vertexData2d[5];
			vertexData[3] = vertexData2d[4] / vertexData2d[5];

			vertexData[4] = vertexData2d[6] / vertexData2d[8];
			vertexData[5] = vertexData2d[7] / vertexData2d[8];

			vertexData[6] = vertexData2d[9] / vertexData2d[11];
			vertexData[7] = vertexData2d[10] / vertexData2d[11];
		}

		calculateTrimmedVertices() {
			if (this.proj._affine) {
				super.calculateTrimmedVertices();
				return;
			}

			const wid = (this.transform as any)._worldID;
			const tuid = (this._texture as any)._updateID;
			if (!this.vertexTrimmedData) {
				this.vertexTrimmedData = new Float32Array(8);
			} else if (this._transformTrimmedID === wid && this._textureTrimmedID === tuid) {
				return;
			}

			this._transformTrimmedID = wid;
			this._textureTrimmedID = tuid;

			// lets do some special trim code!
			const texture = this._texture;
			const vertexData = this.vertexTrimmedData;
			const orig = texture.orig;
			const anchor = this._anchor;

			// lets calculate the new untrimmed bounds..
			const wt = this.proj.world.mat4;

			const w1 = -anchor._x * orig.width;
			const w0 = w1 + orig.width;

			const h1 = -anchor._y * orig.height;
			const h0 = h1 + orig.height;

			let culled = false;

			let z;

			let w = 1.0 / ((wt[3] * w1) + (wt[7] * h1) + wt[15]);
			vertexData[0] = w * ((wt[0] * w1) + (wt[4] * h1) + wt[12]);
			vertexData[1] = w * ((wt[1] * w1) + (wt[5] * h1) + wt[13]);
			z = (wt[2] * w1) + (wt[6] * h1) + wt[14];
			culled = culled || z < 0;

			w = 1.0 / ((wt[3] * w0) + (wt[7] * h1) + wt[15]);
			vertexData[2] = w * ((wt[0] * w0) + (wt[4] * h1) + wt[12]);
			vertexData[3] = w * ((wt[1] * w0) + (wt[5] * h1) + wt[13]);
			z = (wt[2] * w0) + (wt[6] * h1) + wt[14];
			culled = culled || z < 0;

			w = 1.0 / ((wt[3] * w0) + (wt[7] * h0) + wt[15]);
			vertexData[4] = w * ((wt[0] * w0) + (wt[4] * h0) + wt[12]);
			vertexData[5] = w * ((wt[1] * w0) + (wt[5] * h0) + wt[13]);
			z = (wt[2] * w0) + (wt[6] * h0) + wt[14];
			culled = culled || z < 0;

			w = 1.0 / ((wt[3] * w1) + (wt[7] * h0) + wt[15]);
			vertexData[6] = w * ((wt[0] * w1) + (wt[4] * h0) + wt[12]);
			vertexData[7] = w * ((wt[1] * w1) + (wt[5] * h0) + wt[13]);
			z = (wt[2] * w1) + (wt[6] * h0) + wt[14];
			culled = culled || z < 0;

			this.culledByFrustrum = culled;
		}

		_calculateBounds() {
			this.calculateVertices();
			if (this.culledByFrustrum) {
				return;
			}

			const trim = this._texture.trim;
			const orig = this._texture.orig;
			if (!trim || (trim.width === orig.width && trim.height === orig.height))
			{
				// no trim! lets use the usual calculations..
				this._bounds.addQuad(this.vertexData);
				return;
			}

			this.calculateTrimmedVertices();
			if (!this.trimmedCulledByFrustrum) {
				this._bounds.addQuad(this.vertexTrimmedData as any);
			}
		}

		_render(renderer: PIXI.Renderer) {
			this.calculateVertices();

			if (this.culledByFrustrum) {
				return;
			}

			renderer.batch.setObjectRenderer((renderer as any).plugins[this.pluginName]);
			(renderer as any).plugins[this.pluginName].render(this);
		}

		containsPoint(point: PIXI.IPointData) {
			if (this.culledByFrustrum) {
				return false;
			}

			return super.containsPoint(point as any);
		}

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}

		toLocal<T extends PIXI.IPointData>(position: PIXI.IPointData, from?: PIXI.DisplayObject,
									   point?: T, skipUpdate?: boolean,
									   step = TRANSFORM_STEP.ALL): T {
			return container3dToLocal.call(this, position, from, point, skipUpdate, step);
		}

		isFrontFace(forceUpdate?: boolean) {
			return container3dIsFrontFace.call(this, forceUpdate);
		}

		getDepth(forceUpdate?: boolean) {
			return container3dGetDepth.call(this, forceUpdate);
		}

		get position3d(): PIXI.IPointData {
			return this.proj.position;
		}

		get scale3d(): PIXI.IPointData {
			return this.proj.scale;
		}

		get euler(): Euler {
			return this.proj.euler;
		}

		get pivot3d(): PIXI.IPointData {
			return this.proj.pivot;
		}

		set position3d(value: PIXI.IPointData) {
			this.proj.position.copyFrom(value);
		}

		set scale3d(value: PIXI.IPointData) {
			this.proj.scale.copyFrom(value);
		}

		set euler(value: Euler) {
			this.proj.euler.copyFrom(value);
		}

		set pivot3d(value: PIXI.IPointData) {
			this.proj.pivot.copyFrom(value);
		}
	}
}
module PIXI.projection {
	export class Text3d extends PIXI.Text {
		constructor(text?: string, style?: PIXI.TextStyle, canvas?: HTMLCanvasElement) {
			super(text, style, canvas);
			this.proj = new Projection3d(this.transform);
			this.pluginName = 'batch2d';
		}

		proj: Projection3d;
		vertexData2d: Float32Array = null;

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}

		toLocal<T extends PIXI.IPointData>(position: PIXI.IPointData, from?: PIXI.DisplayObject,
										  point?: T, skipUpdate?: boolean,
										  step = TRANSFORM_STEP.ALL): T {
			return container3dToLocal.call(this, position, from, point, skipUpdate, step);
		}

		isFrontFace(forceUpdate?: boolean) {
			return container3dIsFrontFace.call(this, forceUpdate);
		}

		getDepth(forceUpdate?: boolean) {
			return container3dGetDepth.call(this, forceUpdate);
		}

		get position3d(): PIXI.IPointData {
			return this.proj.position;
		}
		get scale3d(): PIXI.IPointData {
			return this.proj.scale;
		}
		get euler(): IEuler {
			return this.proj.euler;
		}
		get pivot3d(): PIXI.IPointData {
			return this.proj.pivot;
		}
		set position3d(value: PIXI.IPointData) {
			this.proj.position.copyFrom(value);
		}
		set scale3d(value: PIXI.IPointData) {
			this.proj.scale.copyFrom(value);
		}
		set euler(value: IEuler) {
			this.proj.euler.copyFrom(value);
		}
		set pivot3d(value: PIXI.IPointData) {
			this.proj.pivot.copyFrom(value);
		}
	}

	Text3d.prototype.calculateVertices = Sprite3d.prototype.calculateVertices;
	(Text3d.prototype as any).calculateTrimmedVertices = Sprite3d.prototype.calculateTrimmedVertices;
	(Text3d.prototype as any)._calculateBounds = Sprite3d.prototype._calculateBounds;
	(Text3d.prototype as any).containsPoint = Sprite3d.prototype.containsPoint;
	(Text3d.prototype as any)._render = Sprite3d.prototype._render;
}
module PIXI.projection.utils {
	import IPointData = PIXI.IPointData;

	export function getIntersectionFactor(p1: IPointData, p2: IPointData, p3: IPointData, p4: IPointData, out: IPointData): number {
		let A1 = p2.x - p1.x, B1 = p3.x - p4.x, C1 = p3.x - p1.x;
		let A2 = p2.y - p1.y, B2 = p3.y - p4.y, C2 = p3.y - p1.y;
		let D = A1 * B2 - A2 * B1;
		if (Math.abs(D) < 1e-7) {
			out.x = A1;
			out.y = A2;
			return 0;
		}
		let T = C1 * B2 - C2 * B1;
		let U = A1 * C2 - A2 * C1;

		let t = T / D, u = U / D;
		if (u < (1e-6) || u - 1 > -1e-6) {
			return -1;
		}

		out.x = p1.x + t * (p2.x - p1.x);
		out.y = p1.y + t * (p2.y - p1.y);

		return 1;
	}

	export function getPositionFromQuad(p: Array<IPointData>, anchor: IPointData, out: IPointData) {
		out = out || new PIXI.Point();
		let a1 = 1.0 - anchor.x, a2 = 1.0 - a1;
		let b1 = 1.0 - anchor.y, b2 = 1.0 - b1;
		out.x = (p[0].x * a1 + p[1].x * a2) * b1 + (p[3].x * a1 + p[2].x * a2) * b2;
		out.y = (p[0].y * a1 + p[1].y * a2) * b1 + (p[3].y * a1 + p[2].y * a2) * b2;
		return out;
	}
}
///<reference types="pixi.js"/>
(PIXI as any).projection = PIXI.projection;
