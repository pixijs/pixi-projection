declare namespace PIXI {
	interface Matrix extends pixi_projection.IWorldTransform {
		apply(pos: PointLike, newPos?: PointLike): PointLike;

		applyInverse(pos: PointLike, newPos?: PointLike): PointLike;
	}
}

namespace pixi_projection {
	import PointLike = PIXI.PointLike;

	const fun = PIXI.TransformStatic.prototype.updateTransform;

	export interface IWorldTransform {
		apply(pos: PointLike, newPos: PointLike): PointLike;

		//TODO: remove props
		applyInverse(pos: PointLike, newPos: PointLike): PointLike;
	}

	function transformHack(this: PIXI.TransformStatic, parentTransform: PIXI.TransformBase): IWorldTransform {
		const proj = this.proj as ProjectionSurface;

		const pp = parentTransform.proj as ProjectionSurface;
		const ta = this as any;

		if (!pp) {
			fun.call(this, parentTransform);
			proj._activeProjection = null;
			return;
		}

		if (pp._surface) {
			proj._activeProjection = pp;
			this.updateLocalTransform();
			this.localTransform.copy(this.worldTransform);
			if (ta._parentID < 0) {
				++ta._worldID;
			}
			return;
		}

		fun.call(this, parentTransform);
		proj._activeProjection = pp._activeProjection;
	}

	export class ProjectionSurface extends Projection {
		constructor(legacy: PIXI.TransformBase, enable?: boolean) {
			super(legacy, enable);
		}

		_surface: Surface = null;
		_activeProjection: ProjectionSurface = null;

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

		get surface() {
			return this._surface;
		}

		set surface(value: Surface) {
			if (this._surface == value) {
				return;
			}
			this._surface = value || null;
			(this.legacy as any)._parentID = -1;
		}

		applyPartial(pos: PointLike, newPos?: PointLike): PointLike {
			if (this._activeProjection !== null) {
				newPos = this.legacy.worldTransform.apply(pos, newPos);
				return this._activeProjection.surface.apply(newPos, newPos);
			}
			if (this._surface !== null) {
				return this.surface.apply(pos, newPos);
			}
			return this.legacy.worldTransform.apply(pos, newPos);
		}

		apply(pos: PointLike, newPos?: PointLike): PointLike {
			if (this._activeProjection !== null) {
				newPos = this.legacy.worldTransform.apply(pos, newPos);
				this._activeProjection.surface.apply(newPos, newPos);
				return this._activeProjection.legacy.worldTransform.apply(newPos, newPos);
			}
			if (this._surface !== null) {
				newPos = this.surface.apply(pos, newPos);
				return this.legacy.worldTransform.apply(newPos, newPos);
			}
			return this.legacy.worldTransform.apply(pos, newPos);
		}

		applyInverse(pos: PointLike, newPos: PointLike) {
			if (this._activeProjection !== null) {
				newPos = this._activeProjection.legacy.worldTransform.applyInverse(pos, newPos);
				this._activeProjection._surface.applyInverse(newPos, newPos);
				return this.legacy.worldTransform.applyInverse(newPos, newPos);
			}
			if (this._surface !== null) {
				newPos = this.legacy.worldTransform.applyInverse(pos, newPos);
				return this._surface.applyInverse(newPos, newPos);
			}
			return this.legacy.worldTransform.applyInverse(pos, newPos);
		}

		mapBilinearSprite(sprite: PIXI.Sprite, quad: Array<PointLike>) {
			if (!(this._surface instanceof BilinearSurface)) {
				this.surface = new BilinearSurface();
			}
			(this.surface as BilinearSurface).mapSprite(sprite, quad, this.legacy);
		}

		_currentSurfaceID = -1;
		_currentLegacyID = -1;
		_lastUniforms = null;

		clear() {
			if (this.surface) {
				this.surface.clear();
			}
		}

		get uniforms(): any {
			if (this._currentLegacyID === (this.legacy as any)._worldID &&
				this._currentSurfaceID === this.surface._updateID) {

				return this._lastUniforms;
			}

			this._lastUniforms = this._lastUniforms || {};
			this._lastUniforms.worldTransform = this.legacy.worldTransform.toArray(true)
			this._surface.fillUniforms(this._lastUniforms);
			return this._lastUniforms;
		}
	}
}
