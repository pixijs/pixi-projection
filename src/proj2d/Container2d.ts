/// <reference path="../types.d.ts" />

import { Projection2d } from './Projection2d';
import { TRANSFORM_STEP } from '../constants';

export function container2dWorldTransform() {
	return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
}

export class Container2d extends PIXI.Container {
	constructor() {
		super();
		this.proj = new Projection2d(this.transform);
	}

	proj: Projection2d;

	toLocal<T extends PIXI.IPoint>(position: PIXI.IPoint, from?: PIXI.DisplayObject,
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

		if (step >= TRANSFORM_STEP.PROJ) {
			if (!skipUpdate) {
				this.displayObjectUpdateTransform();
			}
			if (this.proj.affine) {
				return this.transform.worldTransform.applyInverse(position, point) as any;
			}
			return this.proj.world.applyInverse(position, point) as any;
		}

		if (this.parent) {
			point  = this.parent.worldTransform.applyInverse(position, point) as any;
		} else {
			point.copyFrom(position);
		}
		if (step === TRANSFORM_STEP.NONE) {
			return point;
		}

		return this.transform.localTransform.applyInverse(point, point) as any;
	}

	get worldTransform() {
		return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
	}
}

export let container2dToLocal = Container2d.prototype.toLocal;
