/// <reference path="../../types.d.ts" />

import { DisplayObject } from '@pixi/display';
import { Renderer, Texture } from '@pixi/core';
import { Projection2d } from '../Projection2d';
import { TilingSprite } from '@pixi/sprite-tiling';
import { Transform } from '@pixi/math';
import { TRANSFORM_STEP } from '../../constants';
import { container2dToLocal } from '../Container2d';

import type { IPoint } from '@pixi/math';

const tempTransform = new Transform();

export const TilingSprite2d: typeof TilingSprite = !TilingSprite ? null : class TilingSprite2d extends TilingSprite {
	constructor(texture: Texture, width: number, height: number) {
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

	toLocal<T extends IPoint>(position: IPoint, from?: DisplayObject,
										point?: T, skipUpdate?: boolean,
										step = TRANSFORM_STEP.ALL): T {
		return container2dToLocal.call(this, position, from, point, skipUpdate, step);
	}

	_render(renderer: Renderer)
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
