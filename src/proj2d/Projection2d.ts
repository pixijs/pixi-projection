namespace pixi_projection {
	import PointLike = PIXI.PointLike;

	function transformHack(this: PIXI.TransformStatic, parentTransform: PIXI.TransformBase) {
		// implementation here
		const proj = this.proj as Projection2d;
		const ta = this as any;
		const pwid = (parentTransform as any)._worldID;

		const lt = ta.localTransform;

		//this part is copied from
		if (ta._localID !== ta._currentLocalID) {
			// get the matrix values of the displayobject based on its transform properties..
			lt.a = ta._cx * ta.scale._x;
			lt.b = ta._sx * ta.scale._x;
			lt.c = ta._cy * ta.scale._y;
			lt.d = ta._sy * ta.scale._y;

			//TODO: do something about pivot, it has to be applied after the projections
			//TODO: add special pivot mode that user request for 2 years already

			lt.tx = ta.position._x - ((ta.pivot._x * lt.a) + (ta.pivot._y * lt.c));
			lt.ty = ta.position._y - ((ta.pivot._x * lt.b) + (ta.pivot._y * lt.d));
			ta._currentLocalID = ta._localID;

			// force an update..
			proj._currentProjID = -1;
		}

		const _matrixID = proj._projID;
		if (proj._currentProjID !== _matrixID) {
			proj._currentProjID = _matrixID;
			if (_matrixID !== 0) {
				proj.local.setToMultLegacy(lt, proj.matrix);
			} else {
				proj.local.copyFrom(lt);
			}
			ta._parentID = -1;
		}

		if (ta._parentID !== pwid) {
			const pp = parentTransform.proj as Projection2d;
			if (pp) {
				proj.world.setToMult2d(pp.world, proj.local);
			} else {
				proj.world.setToMultLegacy(parentTransform.worldTransform, proj.local);
			}
			proj.world.copy(ta.worldTransform);
			ta._parentID = pwid;
			ta._worldID++;
		}
	}

	const t0 = new PIXI.Point();
	const tt = [new PIXI.Point(), new PIXI.Point(), new PIXI.Point(), new PIXI.Point()];
	const tempRect = new PIXI.Rectangle();
	const tempMat = new Matrix2d();

	export class Projection2d extends Projection {

		constructor(legacy: PIXI.TransformBase, enable?: boolean) {
			super(legacy, enable);
		}

		matrix = new Matrix2d();
		local = new Matrix2d();
		world = new Matrix2d();

		_projID = 0;
		_currentProjID = -1;

		set enabled(value: boolean) {
			if (value === this._enabled) {
				return;
			}
			this._enabled = value;
			if (value) {
				this.legacy.updateTransform = transformHack;
				(this.legacy as any)._parentID = -1;
			} else {
				this.legacy.updateTransform = PIXI.TransformStatic.prototype.updateTransform;
				(this.legacy as any)._parentID = -1;
			}
		}

		setAxisX(p: PointLike, factor: number = 1): void {
			const x = p.x, y = p.y;
			const d = Math.sqrt(x * x + y * y);
			const mat3 = this.matrix.mat3;
			mat3[0] = x / d;
			mat3[1] = y / d;
			mat3[2] = factor / d;
			this._projID++;
		}

		setAxisY(p: PointLike, factor: number = 1) {
			const x = p.x, y = p.y;
			const d = Math.sqrt(x * x + y * y);
			const mat3 = this.matrix.mat3;
			mat3[3] = x / d;
			mat3[4] = y / d;
			mat3[5] = factor / d;
			this._projID++;
		}

		mapSprite(sprite: PIXI.Sprite, quad: Array<PointLike>) {
			const tex = sprite.texture;

			tempRect.x = -sprite.anchor.x * tex.orig.width;
			tempRect.y = -sprite.anchor.y * tex.orig.height;
			tempRect.width = tex.orig.width;
			tempRect.height = tex.orig.height;

			return this.mapQuad(tempRect, quad);
		}

		mapQuad(rect: PIXI.Rectangle, p: Array<PointLike>) {
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

			this.matrix.setToMult2d(tempMat, this.matrix);
			this._projID++;
		}

		clear() {
			this._currentProjID = -1;
			this._projID = 0;
			this.matrix.identity();
		}
	}
}
