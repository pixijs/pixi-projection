namespace pixi_projection {
	const tempTransform = new PIXI.TransformStatic();

	export class TilingSprite2d extends PIXI.extras.TilingSprite {
		constructor(texture: PIXI.Texture, width: number, height: number) {
			super(texture, width, height);

			this.tileProj = new Projection2d(this.tileTransform);
			this.tileProj.reverseLocalOrder = true;
			this.proj = new Projection2d(this.transform);

			this.pluginName = 'tilingSprite2d';
			this.uvRespectAnchor = true;
		}

		tileProj: Projection2d;
		proj: Projection2d;

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}

		toLocal<T extends PIXI.PointLike>(position: PIXI.PointLike, from?: PIXI.DisplayObject,
		                                  point?: T, skipUpdate?: boolean,
		                                  step = TRANSFORM_STEP.ALL): T {
			return container2dToLocal.call(this, position, from, point, skipUpdate, step);
		}

		_renderWebGL(renderer: PIXI.WebGLRenderer)
		{
			// tweak our texture temporarily..
			const texture = this._texture;

			if (!texture || !texture.valid)
			{
				return;
			}

			// changed
			this.tileTransform.updateTransform(tempTransform);
			this.uvTransform.update();

			renderer.setObjectRenderer(renderer.plugins[this.pluginName]);
			renderer.plugins[this.pluginName].render(this);
		}
	}
}
