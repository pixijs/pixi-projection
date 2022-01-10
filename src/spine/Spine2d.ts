import { ISpineClass } from './base';
import { Graphics } from '@pixi/graphics';
import { Sprite2d, Container2d, SimpleMesh2d } from '../proj2d';
import { Texture } from '@pixi/core';

export function applySpine2dMixin(spineClassPrototype: ISpineClass): void
{
    spineClassPrototype.newMesh = function newMesh(texture: Texture, vertices?: Float32Array,
        uvs?: Float32Array, indices?: Uint16Array, drawMode?: number)
    {
        return new SimpleMesh2d(texture, vertices, uvs, indices, drawMode) as any;
    };
    spineClassPrototype.newContainer = function newMesh()
    {
        if (!this.proj)
        {
            this.convertTo2d();
        }

        return new Container2d() as any;
    };
    spineClassPrototype.newSprite = function newSprite(texture: Texture)
    {
        return new Sprite2d(texture);
    };
    spineClassPrototype.newGraphics = function newMesh()
    {
        const graphics = new Graphics();
        // TODO: make Graphics2d

        graphics.convertTo2d();

        return graphics;
    };
    spineClassPrototype.transformHack = function transformHack()
    {
        return 2;
    };
}
