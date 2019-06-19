namespace pixi_projection {
	export class Sprite2d extends PIXI.Sprite {
		constructor(texture: PIXI.Texture) {
			super(texture);
			this.proj = new Projection2d(this.transform);
			this.pluginName = 'sprite2d';
			this.vertexData = new Float32Array(12);
		}

		proj: Projection2d;

		_calculateBounds() {
			this.calculateTrimmedVertices();
			this._bounds.addQuad(this.vertexTrimmedData as any);
		}

		calculateVertices() {
			if (this.proj._affine) {
				if (this.vertexData.length != 8) {
					this.vertexData = new Float32Array(8);
				}

				super.calculateVertices();
				return;
			}
			if (this.vertexData.length != 12) {
				this.vertexData = new Float32Array(12);
			}

			const wid = (this.transform as any)._worldID;
			const tuid = (this._texture as any)._updateID;
			if (this._transformID === wid && this._textureID === tuid) {
				return;
			}

			this._transformID = wid;
			this._textureID = tuid;

			const texture = this._texture;
			const wt = this.proj.world.mat3;
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

			vertexData[0] = (wt[0] * w1) + (wt[3] * h1) + wt[6];
			vertexData[1] = (wt[1] * w1) + (wt[4] * h1) + wt[7];
			vertexData[2] = (wt[2] * w1) + (wt[5] * h1) + wt[8];

			vertexData[3] = (wt[0] * w0) + (wt[3] * h1) + wt[6];
			vertexData[4] = (wt[1] * w0) + (wt[4] * h1) + wt[7];
			vertexData[5] = (wt[2] * w0) + (wt[5] * h1) + wt[8];

			vertexData[6] = (wt[0] * w0) + (wt[3] * h0) + wt[6];
			vertexData[7] = (wt[1] * w0) + (wt[4] * h0) + wt[7];
			vertexData[8] = (wt[2] * w0) + (wt[5] * h0) + wt[8];

			vertexData[9] = (wt[0] * w1) + (wt[3] * h0) + wt[6];
			vertexData[10] = (wt[1] * w1) + (wt[4] * h0) + wt[7];
			vertexData[11] = (wt[2] * w1) + (wt[5] * h0) + wt[8];
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

		toLocal<T extends PIXI.IPoint>(position: PIXI.IPoint, from?: PIXI.DisplayObject,
		                                  point?: T, skipUpdate?: boolean,
		                                  step = TRANSFORM_STEP.ALL): T {
			return container2dToLocal.call(this, position, from, point, skipUpdate, step);
		}

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}
	}
}
