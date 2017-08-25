namespace pixi_projection {
	export class Sprite2s extends PIXI.Sprite {
		constructor(texture: PIXI.Texture) {
			super(texture);
			this.proj = new ProjectionSurface(this.transform);
			this.pluginName = 'sprite_bilinear';
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

			if (!texture.transform) {
				texture.transform = new PIXI.extras.TextureTransform(texture);
			}
			texture.transform.update();

			const aTrans = this.aTrans;
			aTrans.set(orig.width, 0, 0, orig.height, w1, h1);
			if (this.proj._surface === null) {
				aTrans.prepend(this.transform.worldTransform);
			}
			aTrans.invert();
			aTrans.prepend(texture.transform.mapCoord);
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
