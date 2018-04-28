namespace pixi_projection {
	import PointLike = PIXI.PointLike;

	const t0 = new PIXI.Point();
	const tt = [new PIXI.Point(), new PIXI.Point(), new PIXI.Point(), new PIXI.Point()];
	const tempRect = new PIXI.Rectangle();
	const tempMat = new Matrix3d();

	export class Projection3d extends LinearProjection<Matrix3d> {

		constructor(legacy: PIXI.TransformBase, enable?: boolean) {
			super(legacy, enable);
			this.local = new Matrix3d();
			this.world = new Matrix3d();

			this.position._z = 0;
			this.scale._z = 1;
			this.pivot._z = 0;
		}

		cameraMatrix: Matrix3d = null;
		cameraMode = false;

		position = new PIXI.ObservablePoint(this.onChange, this, 0, 0);
		scale = new PIXI.ObservablePoint(this.onChange, this, 0, 0);
		euler = new ObservableEuler(this.onChange, this, 0, 0,0);
		pivot = new PIXI.ObservablePoint(this.onChange, this, 0, 0);

		onChange() {
			this._projID++;
		}

		clear() {
			super.clear();
			if (this.cameraMatrix) {
				this.cameraMatrix.identity();
			}
			this.pivot.set(0, 0);
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
				matrix.setToRotationTranslation(euler.quaternion, pos._x, pos._y, pos._z);
				matrix.scaleAndTranslate(scale._x, scale._y, scale._z, pivot.x, pivot.y, pivot.z);
				return;
			}

			// Camera mode is difficult


		}
	}
}
