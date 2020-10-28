namespace pixi_projection {
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
			const d = -Math.sqrt(x * x + y * y);
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
