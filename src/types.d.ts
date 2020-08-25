/*
 * Temporary hack until pixi.js releases typings at a per-package basis.
 */

declare module "@pixi/constants" {
    export {
        ALPHA_MODES,
        DRAW_MODES,
        WRAP_MODES,
        SCALE_MODES,
        TYPES
    } from 'pixi.js';
}

declare module "@pixi/core" {
    export { 
        AbstractBatchRenderer, 
        BatchShaderGenerator,
        BaseTexture,
        BatchTextureArray,
        Buffer,
        Texture,
        ObjectRenderer,
        Filter,
        Renderer,
        MaskData,
        GLTexture,
        Geometry,
        RenderTexture,
        TextureMatrix,
        QuadUv,
        Shader,
        State,
        resources,
        systems,
        Program,
        ViewableBuffer
    } from 'pixi.js';
}

declare module "@pixi/display" {
    export {
        DisplayObject,
        Container
    } from 'pixi.js';
}

declare module "@pixi/math" {
    export {
        Matrix,
        ObservablePoint,
        IPoint,
        Point,
        Rectangle,
        Transform,
        groupD8
    } from 'pixi.js';
}

declare module "@pixi/graphics" {
    export { 
        Graphics
    } from 'pixi.js';
}

declare module "@pixi/sprite" {
    export {
        Sprite
    } from 'pixi.js';
}

declare module "@pixi/mesh" {
    export {
        Mesh,
        MeshGeometry,
        MeshMaterial
    } from 'pixi.js';
}

declare module "@pixi/sprite-tiling" {
    export {
        TilingSprite
    } from 'pixi.js';
}

declare module "@pixi/utils" {
    export function correctBlendMode(blendMode: number, premultiplied: boolean): number;
    export function premultiplyTint(tint: number, alpha: number): number;
    export function premultiplyTintToRgba(tint: number, alpha: number, out: Float32Array, premultiply: boolean): Float32Array;
    export const premultiplyBlendMode: number[][];
}

declare module "@pixi/text" {
    export {
        Text,
        TextStyle
    } from 'pixi.js';
}

declare module "@pixi/mesh-extras" {
    export {
        SimpleMesh,
        SimpleRope
    } from 'pixi.js';
}