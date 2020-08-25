/// <reference path="../types.d.ts" />

import { AbstractProjection } from '../base/AbstractProjection';
import { BilinearSurface } from './BilinearSurface';
import { Sprite } from '@pixi/sprite';
import { Surface } from './BaseSurface';
import { Transform } from '@pixi/math';

import type { IPoint } from '@pixi/math';
import type { ProjectedTransform } from '../base/AbstractProjection';

const fun = Transform.prototype.updateTransform;

export interface IWorldTransform {
	apply(pos: IPoint, newPos: IPoint): IPoint;

	//TODO: remove props
	applyInverse(pos: IPoint, newPos: IPoint): IPoint;
}

function transformHack(this: ProjectedTransform, parentTransform: ProjectedTransform): IWorldTransform {
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
		this.localTransform.copyTo(this.worldTransform);
		if (ta._parentID < 0) {
			++ta._worldID;
		}
		return;
	}

	fun.call(this, parentTransform);
	proj._activeProjection = pp._activeProjection;
}

export class ProjectionSurface extends AbstractProjection {
	constructor(legacy: Transform, enable?: boolean) {
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
			this.legacy.updateTransform = Transform.prototype.updateTransform;
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

	applyPartial(pos: IPoint, newPos?: IPoint): IPoint {
		if (this._activeProjection !== null) {
			newPos = this.legacy.worldTransform.apply(pos as any, newPos as any);
			return this._activeProjection.surface.apply(newPos, newPos);
		}
		if (this._surface !== null) {
			return this.surface.apply(pos, newPos);
		}
		return this.legacy.worldTransform.apply(pos as any, newPos as any);
	}

	apply(pos: IPoint, newPos?: IPoint): IPoint {
		if (this._activeProjection !== null) {
			newPos = this.legacy.worldTransform.apply(pos as any, newPos as any);
			this._activeProjection.surface.apply(newPos, newPos);
			return this._activeProjection.legacy.worldTransform.apply(newPos as any, newPos as any);
		}
		if (this._surface !== null) {
			newPos = this.surface.apply(pos, newPos);
			return this.legacy.worldTransform.apply(newPos as any, newPos as any);
		}
		return this.legacy.worldTransform.apply(pos as any, newPos as any);
	}

	applyInverse(pos: IPoint, newPos: IPoint) {
		if (this._activeProjection !== null) {
			newPos = this._activeProjection.legacy.worldTransform.applyInverse(pos as any, newPos as any);
			this._activeProjection._surface.applyInverse(newPos, newPos);
			return this.legacy.worldTransform.applyInverse(newPos as any, newPos as any);
		}
		if (this._surface !== null) {
			newPos = this.legacy.worldTransform.applyInverse(pos as any, newPos as any);
			return this._surface.applyInverse(newPos, newPos);
		}
		return this.legacy.worldTransform.applyInverse(pos as any, newPos as any);
	}

	mapBilinearSprite(sprite: Sprite, quad: Array<IPoint>) {
		if (!(this._surface instanceof BilinearSurface)) {
			this.surface = new BilinearSurface();
		}
		(this.surface as BilinearSurface).mapSprite(sprite, quad, this.legacy);
	}

	_currentSurfaceID = -1;
	_currentLegacyID = -1;
	_lastUniforms : any = null;

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
		this._lastUniforms.translationMatrix = this.legacy.worldTransform;
		this._surface.fillUniforms(this._lastUniforms);
		return this._lastUniforms;
	}
}
