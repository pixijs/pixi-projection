declare namespace PIXI {
	export interface TransformStatic {
		projection: pixi_projection.Projection2d;
	}
}

namespace pixi_projection {

	function transformHack(this: PIXI.TransformStatic, parentTransform: PIXI.TransformStatic) {
		// implementation here
	}

	export class Projection2d {

		constructor(legacy: PIXI.TransformBase, enable?: boolean) {
			this.legacy = legacy as PIXI.TransformStatic;

			if (enable) {
				this.enabled = true;
			}

			// sorry for hidden class, it would be good to have special projection field in official pixi
			this.legacy.projection = this;
		}

		legacy: PIXI.TransformStatic;

		local = new Matrix2d();
		world = new Matrix2d();

		_localID = -1;
		_currentLocalID = -1;

		_enabled: boolean = false;

		get enabled() {
			return this._enabled;
		}

		set enabled(value: boolean) {
			if (value === this._enabled) {
				return;
			}
			this._enabled = value;
			if (value) {
				this.legacy.updateTransform = transformHack;
			} else {
				this.legacy.updateTransform = PIXI.TransformStatic.prototype.updateTransform;
			}
		}
	}
}
