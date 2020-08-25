/// <reference path="../types.d.ts" />

import { Container } from '@pixi/display';
import { Point } from '@pixi/math';
import { Projection3d } from './Projection3d';
import { TRANSFORM_STEP } from '../constants';

import type { DisplayObject } from '@pixi/display';
import type { IPoint } from '@pixi/math';
import type { IPoint3d } from './Point3d';
import type { IEuler } from './ObservableEuler';

export function container3dWorldTransform() {
	return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
}

export class Container3d extends Container {
	constructor() {
		super();
		this.proj = new Projection3d(this.transform);
	}

	proj: Projection3d;

	isFrontFace(forceUpdate: boolean = false) {
		if (forceUpdate) {
			this._recursivePostUpdateTransform();
			this.displayObjectUpdateTransform();
		}

		const mat = this.proj.world.mat4;
		const dx1 = mat[0] * mat[15] - mat[3] * mat[12];
		const dy1 = mat[1] * mat[15] - mat[3] * mat[13];
		const dx2 = mat[4] * mat[15] - mat[7] * mat[12];
		const dy2 = mat[5] * mat[15] - mat[7] * mat[13];

		return dx1 * dy2 - dx2 * dy1 > 0;
	}

	/**
	 * returns depth from 0 to 1
	 *
	 * @param {boolean} forceUpdate whether to force matrix updates
	 * @returns {number} depth
	 */
	getDepth(forceUpdate: boolean = false) {
		if (forceUpdate) {
			this._recursivePostUpdateTransform();
			this.displayObjectUpdateTransform();
		}

		const mat4 = this.proj.world.mat4;
		return mat4[14] / mat4[15];
	}

	toLocal<T extends IPoint>(position: IPoint, from?: DisplayObject,
			point?: T, skipUpdate?: boolean,
			step = TRANSFORM_STEP.ALL): T {

		if (from)
		{
			position = from.toGlobal(position, point, skipUpdate);
		}

		if (!skipUpdate)
		{
			this._recursivePostUpdateTransform();
		}

		if (step === TRANSFORM_STEP.ALL) {
			if (!skipUpdate) {
				this.displayObjectUpdateTransform();
			}
			if (this.proj.affine) {
				return this.transform.worldTransform.applyInverse(position as Point, point as any) as any;
			}
			return this.proj.world.applyInverse(position as any, point as any) as any;
		}

		if (this.parent) {
			point  = this.parent.worldTransform.applyInverse(position as any, point as any) as any;
		} else {
			point.copyFrom(position);
		}
		if (step === TRANSFORM_STEP.NONE) {
			return point;
		}

		point = this.transform.localTransform.applyInverse(point as any, point as any) as any;
		if (step === TRANSFORM_STEP.PROJ && this.proj.cameraMode) {
			point = this.proj.cameraMatrix.applyInverse(point as any, point as any) as any;
		}
		return point;
	}

	get worldTransform() {
		return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
	}

	get position3d(): IPoint3d {
		return this.proj.position;
	}
	get scale3d(): IPoint {
		return this.proj.scale;
	}
	get euler(): IEuler {
		return this.proj.euler;
	}
	get pivot3d(): IPoint {
		return this.proj.pivot;
	}
	set position3d(value: IPoint3d) {
		this.proj.position.copyFrom(value);
	}
	set scale3d(value: IPoint) {
		this.proj.scale.copyFrom(value);
	}
	set euler(value: IEuler) {
		this.proj.euler.copyFrom(value);
	}
	set pivot3d(value: IPoint) {
		this.proj.pivot.copyFrom(value);
	}
}

export let container3dToLocal = Container3d.prototype.toLocal;
export let container3dGetDepth = Container3d.prototype.getDepth;
export let container3dIsFrontFace = Container3d.prototype.isFrontFace;
