/// <reference types="pixi.js" />
declare namespace PIXI {
    interface TransformBase {
        proj: pixi_projection.Projection;
    }
    interface ObservablePoint {
        _x: number;
        _y: number;
    }
    interface TransformStatic {
        proj: pixi_projection.Projection;
    }
}
declare module PIXI.projection {
    class Projection {
        constructor(legacy: PIXI.TransformBase, enable?: boolean);
        legacy: PIXI.TransformStatic;
        _projID: number;
        _currentProjID: number;
        _enabled: boolean;
        enabled: boolean;
        clear(): void;
    }
}
declare module PIXI.projection {
    class ProjectionCurve extends Projection {
        constructor(legacy: PIXI.TransformBase, enable?: boolean);
    }
}
declare module PIXI.projection {
    class Container2d extends PIXI.Sprite {
        constructor(texture: PIXI.Texture);
        proj: Projection2d;
        readonly worldTransform: any;
    }
}
declare module PIXI.projection {
    import IPoint = PIXI.PointLike;
    class Matrix2d {
        static readonly IDENTITY: Matrix2d;
        static readonly TEMP_MATRIX: Matrix2d;
        mat3: Float64Array;
        floatArray: Float32Array;
        constructor(backingArray?: ArrayLike<number>);
        a: number;
        b: number;
        c: number;
        d: number;
        tx: number;
        ty: number;
        set(a: number, b: number, c: number, d: number, tx: number, ty: number): this;
        toArray(transpose?: boolean, out?: Float32Array): Float32Array;
        apply(pos: IPoint, newPos: IPoint): IPoint;
        applyInverse(pos: IPoint, newPos: IPoint): IPoint;
        invert(): Matrix2d;
        identity(): Matrix2d;
        clone(): Matrix2d;
        copyTo(matrix: Matrix2d): Matrix2d;
        copy(matrix: PIXI.Matrix): void;
        copyFrom(matrix: PIXI.Matrix): void;
        setToMultLegacy(pt: PIXI.Matrix, lt: Matrix2d): this;
        setToMult2d(pt: Matrix2d, lt: Matrix2d): this;
    }
}
declare module PIXI.projection {
    import PointLike = PIXI.PointLike;
    class Projection2d extends Projection {
        constructor(legacy: PIXI.TransformBase, enable?: boolean);
        matrix: Matrix2d;
        local: Matrix2d;
        world: Matrix2d;
        enabled: boolean;
        setAxisX(p: PointLike, factor?: number): void;
        setAxisY(p: PointLike, factor?: number): void;
        setFromQuad(p: Array<PointLike>, anchor?: PointLike, sizeX?: number, sizeY?: number): void;
        clear(): void;
    }
}
declare module PIXI {
    interface Sprite {
        convertTo2d(): void;
    }
    interface Container {
        convertTo2d(): void;
        convertSubtreeTo2d(): void;
    }
}
declare module PIXI.projection {
}
declare module PIXI.projection {
    class Sprite2d extends PIXI.Sprite {
        constructor(texture: PIXI.Texture);
        proj: Projection2d;
        calculateVertices(): void;
        calculateTrimmedVertices(): void;
        readonly worldTransform: any;
    }
}
declare module PIXI.projection {
    class Text2d extends PIXI.Text {
        constructor(text?: string, style?: PIXI.TextStyle, canvas?: HTMLCanvasElement);
        proj: Projection2d;
        readonly worldTransform: any;
    }
}
declare module PIXI.projection.webgl {
    class BatchBuffer {
        vertices: ArrayBuffer;
        float32View: Float32Array;
        uint32View: Uint32Array;
        constructor(size: number);
        destroy(): void;
    }
}
declare module PIXI.projection.webgl {
    const defaultTextureVertex: string;
    function generateMultiTextureShader(gl: WebGLRenderingContext, maxTextures: number): PIXI.Shader;
}
declare module PIXI {
    interface ObjectRenderer {
        renderer: WebGLRenderer;
    }
    interface BaseTexture {
        _virtalBoundId: number;
    }
}
declare module PIXI.projection.webgl {
    import BaseTexture = PIXI.BaseTexture;
    import ObjectRenderer = PIXI.ObjectRenderer;
    import GLBuffer = PIXI.glCore.GLBuffer;
    import VertexArrayObject = PIXI.glCore.VertexArrayObject;
    import WebGLRenderer = PIXI.WebGLRenderer;
    import Sprite = PIXI.Sprite;
    class BatchGroup {
        textures: Array<BaseTexture>;
        textureCount: number;
        ids: Array<Number>;
        size: number;
        start: number;
        blend: number;
    }
    class SpriteRenderer extends ObjectRenderer {
        vertSize: number;
        vertByteSize: number;
        size: number;
        buffers: Array<BatchBuffer>;
        indices: Uint16Array;
        shader: PIXI.Shader;
        currentIndex: number;
        groups: Array<BatchGroup>;
        sprites: Array<Sprite>;
        indexBuffer: GLBuffer;
        vertexBuffers: Array<GLBuffer>;
        vaos: Array<VertexArrayObject>;
        vao: VertexArrayObject;
        vaoMax: number;
        vertexCount: number;
        MAX_TEXTURES: number;
        constructor(renderer: WebGLRenderer);
        onContextChange(): void;
        onPrerender(): void;
        render(sprite: Sprite): void;
        flush(): void;
        start(): void;
        stop(): void;
        destroy(): void;
    }
}
declare module PIXI.projection.utils {
    function createIndicesForQuads(size: number): Uint16Array;
    function isPow2(v: number): boolean;
    function nextPow2(v: number): number;
    function log2(v: number): number;
    import PointLike = PIXI.PointLike;
    function getIntersectionFactor(p1: PointLike, p2: PointLike, p3: PointLike, p4: PointLike, out: PointLike): number;
    function getPositionFromQuad(p: Array<PointLike>, anchor: PointLike, out: PointLike): PointLike;
}
