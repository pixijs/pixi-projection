namespace pixi_projection {
	export class Sprite2d extends PIXI.Sprite {
		constructor(texture: PIXI.Texture) {
			super(texture);
			this.proj = new Projection2d(this.transform);
		}

		proj: Projection2d;

		//TODO: override all sprite methods about transforms
	}
}
