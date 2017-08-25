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
        _enabled: boolean;
        enabled: boolean;
        clear(): void;
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
    function generateMultiTextureShader(vertexSrc: string, fragmentSrc: string, gl: WebGLRenderingContext, maxTextures: number): PIXI.Shader;
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
        uniforms: any;
    }
    abstract class MultiTextureSpriteRenderer extends ObjectRenderer {
        shaderVert: string;
        shaderFrag: string;
        MAX_TEXTURES_LOCAL: number;
        abstract createVao(vertexBuffer: GLBuffer): PIXI.glCore.VertexArrayObject;
        abstract fillVertices(float32View: Float32Array, uint32View: Uint32Array, index: number, sprite: any, argb: number, textureId: number): any;
        getUniforms(spr: PIXI.Sprite): any;
        syncUniforms(obj: any): void;
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
declare module PIXI.projection {
    import PointLike = PIXI.PointLike;
    abstract class Surface implements IWorldTransform {
        surfaceID: string;
        _updateID: number;
        vertexSrc: string;
        fragmentSrc: string;
        fillUniforms(uniforms: any): void;
        clear(): void;
        boundsQuad(v: ArrayLike<number>, out: any, after?: PIXI.Matrix): void;
        abstract apply(pos: PointLike, newPos: PointLike): PointLike;
        abstract applyInverse(pos: PointLike, newPos: PointLike): PointLike;
    }
}
declare module PIXI.projection {
    import PointLike = PIXI.PointLike;
    class BilinearSurface extends Surface {
        distortion: PIXI.Point;
        constructor();
        clear(): void;
        apply(pos: PointLike, newPos?: PointLike): PointLike;
        applyInverse(pos: PointLike, newPos: PointLike): PointLike;
        mapSprite(sprite: PIXI.Sprite, quad: Array<PointLike>, outTransform?: PIXI.TransformStatic): this;
        mapQuad(rect: PIXI.Rectangle, quad: Array<PointLike>, outTransform: PIXI.TransformStatic): this;
        fillUniforms(uniforms: any): void;
    }
}
declare module PIXI.projection {
    class Container2s extends PIXI.Sprite {
        constructor(texture: PIXI.Texture);
        proj: ProjectionSurface;
        readonly worldTransform: any;
    }
}
declare namespace PIXI {
    interface Matrix extends pixi_projection.IWorldTransform {
        apply(pos: PointLike, newPos?: PointLike): PointLike;
        applyInverse(pos: PointLike, newPos?: PointLike): PointLike;
    }
}
declare module PIXI.projection {
    import PointLike = PIXI.PointLike;
    interface IWorldTransform {
        apply(pos: PointLike, newPos: PointLike): PointLike;
        applyInverse(pos: PointLike, newPos: PointLike): PointLike;
    }
    class ProjectionSurface extends Projection {
        constructor(legacy: PIXI.TransformBase, enable?: boolean);
        _surface: Surface;
        _activeProjection: ProjectionSurface;
        enabled: boolean;
        surface: Surface;
        applyPartial(pos: PointLike, newPos?: PointLike): PointLike;
        apply(pos: PointLike, newPos?: PointLike): PointLike;
        applyInverse(pos: PointLike, newPos: PointLike): PointLike;
        mapBilinearSprite(sprite: PIXI.Sprite, quad: Array<PointLike>): void;
        _currentSurfaceID: number;
        _currentLegacyID: number;
        _lastUniforms: any;
        clear(): void;
        readonly uniforms: any;
    }
}
declare module PIXI.projection {
}
declare module PIXI {
    interface Sprite {
        convertTo2s(): void;
    }
    interface Container {
        convertTo2s(): void;
        convertSubtreeTo2s(): void;
    }
}
declare module PIXI.projection {
}
declare module PIXI.projection {
    class Sprite2s extends PIXI.Sprite {
        constructor(texture: PIXI.Texture);
        proj: ProjectionSurface;
        aTrans: PIXI.Matrix;
        _calculateBounds(): void;
        calculateVertices(): void;
        calculateTrimmedVertices(): void;
        readonly worldTransform: any;
    }
}
declare module PIXI.projection {
    class Text2s extends PIXI.Text {
        constructor(text?: string, style?: PIXI.TextStyle, canvas?: HTMLCanvasElement);
        proj: ProjectionSurface;
        aTrans: PIXI.Matrix;
        readonly worldTransform: any;
    }
}
declare module PIXI.projection {
}
declare module PIXI.projection {
    import PointLike = PIXI.PointLike;
    class StrangeSurface extends Surface {
        constructor();
        params: number[];
        clear(): void;
        setAxisX(pos: PointLike, factor: number, outTransform: PIXI.TransformStatic): void;
        setAxisY(pos: PointLike, factor: number, outTransform: PIXI.TransformStatic): void;
        _calc01(): void;
        apply(pos: PointLike, newPos?: PointLike): PointLike;
        applyInverse(pos: PointLike, newPos: PointLike): PointLike;
        mapSprite(sprite: PIXI.Sprite, quad: Array<PointLike>, outTransform?: PIXI.TransformStatic): this;
        mapQuad(rect: PIXI.Rectangle, quad: Array<PointLike>, outTransform: PIXI.TransformStatic): this;
        fillUniforms(uniforms: any): void;
    }
}
declare module PIXI.projection {
    function container2dWorldTransform(): any;
    class Container2d extends PIXI.Sprite {
        constructor(texture: PIXI.Texture);
        proj: Projection2d;
        readonly worldTransform: any;
    }
}
declare module PIXI.projection {
    import IPoint = PIXI.PointLike;
    enum AFFINE {
        NONE = 0,
        FREE = 1,
        AXIS_X = 2,
        AXIS_Y = 3,
        POINT = 4,
    }
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
        translate(tx: number, ty: number): this;
        scale(x: any, y: any): this;
        scaleAndTranslate(scaleX: number, scaleY: number, tx: number, ty: number): void;
        applyInverse(pos: IPoint, newPos: IPoint): IPoint;
        invert(): Matrix2d;
        identity(): Matrix2d;
        clone(): Matrix2d;
        copyTo(matrix: Matrix2d): Matrix2d;
        copy(matrix: PIXI.Matrix, affine?: AFFINE): void;
        copyFrom(matrix: PIXI.Matrix): this;
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
        _projID: number;
        _currentProjID: number;
        _affine: AFFINE;
        affine: AFFINE;
        enabled: boolean;
        setAxisX(p: PointLike, factor?: number): void;
        setAxisY(p: PointLike, factor?: number): void;
        mapSprite(sprite: PIXI.Sprite, quad: Array<PointLike>): void;
        mapQuad(rect: PIXI.Rectangle, p: Array<PointLike>): void;
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
        _calculateBounds(): void;
        calculateVertices(): void;
        calculateTrimmedVertices(): void;
        readonly worldTransform: any;
    }
}
declare module PIXI.projection {
}
declare module PIXI.projection {
    class Text2d extends PIXI.Text {
        constructor(text?: string, style?: PIXI.TextStyle, canvas?: HTMLCanvasElement);
        proj: Projection2d;
        readonly worldTransform: any;
    }
}
declare module PIXI.projection {
    class ProjectionsManager {
        renderer: PIXI.WebGLRenderer;
        gl: WebGLRenderingContext;
        constructor(renderer: PIXI.WebGLRenderer);
        onContextChange: (gl: WebGLRenderingContext) => void;
        destroy(): void;
    }
}
declare module PIXI.projection {
    class SpriteMaskFilter2d extends PIXI.Filter {
        constructor(sprite: any);
        maskSprite: PIXI.Sprite;
        maskMatrix: Matrix2d;
        apply(filterManager: PIXI.FilterManager, input: PIXI.RenderTarget, output: PIXI.RenderTarget, clear?: boolean, currentState?: any): void;
        static calculateSpriteMatrix(currentState: any, mappedMatrix: Matrix2d, sprite: PIXI.Sprite): Matrix2d;
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
