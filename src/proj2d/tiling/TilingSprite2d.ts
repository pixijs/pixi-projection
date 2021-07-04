import { Renderer, Texture } from '@pixi/core';
import { IPointData, Matrix, Point, Transform } from '@pixi/math';
import { Projection2d } from '../Projection2d';
import { DisplayObject } from '@pixi/display';
import { TRANSFORM_STEP } from '../../base';
import { container2dToLocal } from '../Container2d';
import { TilingSprite } from '@pixi/sprite-tiling';

const tempTransform = new Transform();

export class TilingSprite2d extends TilingSprite
{
    constructor(texture: Texture, width: number, height: number)
    {
        super(texture, width, height);

        this.tileProj = new Projection2d(this.tileTransform);
        this.tileProj.reverseLocalOrder = true;
        this.proj = new Projection2d(this.transform);

        this.pluginName = 'tilingSprite2d';
        this.uvRespectAnchor = true;
    }

    tileProj: Projection2d;
    proj: Projection2d;

    get worldTransform(): Matrix
    {
        return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
    }

    toLocal<P extends IPointData = Point>(position: IPointData, from?: DisplayObject, point?: P, skipUpdate?: boolean,
        step = TRANSFORM_STEP.ALL): P
    {
        return container2dToLocal.call(this, position, from, point, skipUpdate, step);
    }

    _render(renderer: Renderer): void
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
