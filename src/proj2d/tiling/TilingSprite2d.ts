namespace pixi_projection {
	export class TilingSprite2d extends PIXI.extras.TilingSprite {
		constructor(texture: PIXI.Texture, width: number, height: number) {
			super(texture, width, height);

			this.tileProj = new Projection2d(this.tileTransform);
			this.proj = new Projection2d(this.transform);

			this.pluginName = 'tilingSprite2d';
		}

		tileProj: Projection2d;
		proj: Projection2d;

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}
	}
}
