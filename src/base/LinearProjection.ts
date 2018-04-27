namespace pixi_projection {
	function transformHack(this: PIXI.TransformStatic, parentTransform: PIXI.TransformBase) {
		// implementation here
		const proj = this.proj as LinearProjection<any>;
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

			lt.tx = ta.position._x - ((ta.pivot._x * lt.a) + (ta.pivot._y * lt.c));
			lt.ty = ta.position._y - ((ta.pivot._x * lt.b) + (ta.pivot._y * lt.d));
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
			proj.world.copy(ta.worldTransform, proj._affine);
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

		set affine(value: AFFINE) {
			if (this._affine == value) return;
			this._affine = value;
			this._currentProjID = -1;
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
				this.legacy.updateTransform = PIXI.TransformStatic.prototype.updateTransform;
				(this.legacy as any)._parentID = -1;
			}
		}

		clear() {
			this._currentProjID = -1;
			this._projID = 0;
		}
	}
}
