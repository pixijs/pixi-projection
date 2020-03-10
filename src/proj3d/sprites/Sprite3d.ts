namespace pixi_projection {
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

		containsPoint(point: PIXI.IPoint) {
			if (this.culledByFrustrum) {
				return false;
			}

			return super.containsPoint(point as any);
		}

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}

		toLocal<T extends PIXI.IPoint>(position: PIXI.IPoint, from?: PIXI.DisplayObject,
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

		get position3d(): PIXI.IPoint {
			return this.proj.position;
		}

		get scale3d(): PIXI.IPoint {
			return this.proj.scale;
		}

		get euler(): Euler {
			return this.proj.euler;
		}

		get pivot3d(): PIXI.IPoint {
			return this.proj.pivot;
		}

		set position3d(value: PIXI.IPoint) {
			this.proj.position.copyFrom(value);
		}

		set scale3d(value: PIXI.IPoint) {
			this.proj.scale.copyFrom(value);
		}

		set euler(value: Euler) {
			this.proj.euler.copyFrom(value);
		}

		set pivot3d(value: PIXI.IPoint) {
			this.proj.pivot.copyFrom(value);
		}
	}
}
