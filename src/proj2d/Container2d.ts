namespace pixi_projection {
	export function container2dWorldTransform() {
		return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
	}

	export class Container2d extends PIXI.Container {
		constructor() {
			super();
			this.proj = new Projection2d(this.transform);
		}

		proj: Projection2d;

		toLocal<T extends PIXI.PointLike>(position: PIXI.PointLike, from?: PIXI.DisplayObject,
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

			// this parent check is for just in case the item is a root object.
			// If it is we need to give it a temporary parent so that displayObjectUpdateTransform works correctly
			// this is mainly to avoid a parent check in the main loop. Every little helps for performance :)
			if (this.parent) {
				//TODO: sometimes we need to convert it to 3d
				point  = this.parent.worldTransform.applyInverse(position, point) as any;
			} else {
				point.copy(position);
			}
			if (step === TRANSFORM_STEP.NONE) {

				return point;
			}

			point = this.transform.localTransform.applyInverse(point, point) as any;

			if (step <= TRANSFORM_STEP.BEFORE_PROJ) {
				return point;
			}

			point = this.proj.matrix.applyInverse(point, point) as any;

			return point;
		}

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}
	}
}
