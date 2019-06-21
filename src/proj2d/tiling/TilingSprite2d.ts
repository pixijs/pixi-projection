namespace pixi_projection {
	const tempTransform = new PIXI.Transform();

	export class TilingSprite2d extends PIXI.TilingSprite {
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

		toLocal<T extends PIXI.IPoint>(position: PIXI.IPoint, from?: PIXI.DisplayObject,
		                                  point?: T, skipUpdate?: boolean,
		                                  step = TRANSFORM_STEP.ALL): T {
			return container2dToLocal.call(this, position, from, point, skipUpdate, step);
		}

		_render(renderer: PIXI.Renderer)
		{
			// tweak our texture temporarily..
			const texture = this._texture;

			if (!texture || !texture.valid)
			{
				return;
			}

			// changed
			this.tileTransform.updateTransform(tempTransform);
			this.uvMatrix.update();

			renderer.batch.setObjectRenderer((renderer.plugins as any)[this.pluginName]);
            (renderer.plugins as any)[this.pluginName].render(this);
		}
	}
}
