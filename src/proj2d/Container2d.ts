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

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}
	}
}
