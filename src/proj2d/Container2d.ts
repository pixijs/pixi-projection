namespace pixi_projection {
	export class Container2d extends PIXI.Sprite {
		constructor(texture: PIXI.Texture) {
			super(texture);
			this.proj = new Projection2d(this.transform);
		}

		proj: Projection2d;

		get worldTransform() {
			return this.proj.world as any;
		}
	}
}