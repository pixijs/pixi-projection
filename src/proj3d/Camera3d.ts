///<reference path="./Container3d.ts"/>
namespace pixi_projection {
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
