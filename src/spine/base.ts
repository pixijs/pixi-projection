import { Container } from '@pixi/display';
import { Sprite } from '@pixi/sprite';
import { Texture } from '@pixi/core';
import { Graphics } from '@pixi/graphics';
import { SimpleMesh } from '@pixi/mesh-extras';

export interface ISpineClass {
    newContainer(): Container;

    newSprite(tex: Texture): Sprite;

    newGraphics(): Graphics;

    newMesh(texture: Texture, vertices?: Float32Array, uvs?: Float32Array,
            indices?: Uint16Array, drawMode?: number): SimpleMesh;

    transformHack(): number;
}
