declare namespace PIXI {
	export interface TransformStatic {
		projection: pixi_projection.Projection2d;
	}
}

namespace pixi_projection {

	function transformHack(this: PIXI.TransformStatic, parentTransform: any) {
		// implementation here
		const proj = this.projection;
		const ta = this as any;

		const lt = ta.localTransform;

		//this part is copied from
		if (ta._localID !== ta._currentLocalID) {
			// get the matrix values of the displayobject based on its transform properties..
			lt.a = ta._cx * ta.scale._x;
			lt.b = ta._sx * ta.scale._x;
			lt.c = ta._cy * ta.scale._y;
			lt.d = ta._sy * ta.scale._y;

			lt.tx = ta.position._x - ((ta.pivot._x * lt.a) + (ta.pivot._y * lt.c));
			lt.ty = ta.position._y - ((ta.pivot._x * lt.b) + (ta.pivot._y * lt.d));
			ta._currentLocalID = ta._localID;

			// force an update..
			proj._cheatID = -1;
		}

		if (proj._currentCheatID !== proj._cheatID) {
			proj._currentCheatID = proj._cheatID;
			proj.local.setToMultLegacy(lt, proj.cheat);
			ta._parentID = -1;
		}

		if (ta._parentID !== parentTransform._worldID) {
			const pp = parentTransform.projection;
			if (pp) {
				proj.world.setToMult2d(pp.world, proj.local);
			} else {
				proj.world.setToMultLegacy(parentTransform.worldTransform, proj.local);
			}
			proj.world.copy(ta.worldTransform);
			ta._parentID = parentTransform._worldID;
			ta._worldID++;
		}
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

		cheat = new Matrix2d();
		local = new Matrix2d();
		world = new Matrix2d();

		_cheatID = -1;
		_currentCheatID = -1;

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
