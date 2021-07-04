import { ISpineClass } from './base';
import { Graphics } from '@pixi/graphics';
import { Sprite3d, Container3d, SimpleMesh3d2d } from '../proj3d';
import { Texture } from '@pixi/core';

export function applySpine3dMixin(spineClassPrototype: ISpineClass): void
{
    spineClassPrototype.newMesh = function newMesh(texture: Texture, vertices?: Float32Array,
        uvs?: Float32Array, indices?: Uint16Array, drawMode?: number)
    {
        return new SimpleMesh3d2d(texture, vertices, uvs, indices, drawMode) as any;
    };
    spineClassPrototype.newContainer = function newMesh()
    {
        if (!this.proj)
        {
            this.convertTo3d();
        }

        return new Container3d() as any;
    };
    spineClassPrototype.newSprite = function newSprite(texture: Texture)
    {
        return new Sprite3d(texture);
    };
    spineClassPrototype.newGraphics = function newMesh()
    {
        const graphics = new Graphics();
        // TODO: make Graphics2d

        graphics.convertTo3d();

        return graphics;
    };
    spineClassPrototype.transformHack = function transformHack()
    {
        return 2;
    };
}
