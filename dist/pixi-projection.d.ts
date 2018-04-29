/// <reference types="pixi.js" />
declare namespace PIXI {
    interface TransformBase {
        proj: PIXI.projection.AbstractProjection;
    }
    interface ObservablePoint {
        _x: number;
        _y: number;
    }
    interface TransformStatic {
        proj: PIXI.projection.AbstractProjection;
    }
}
declare module PIXI.projection {
    class AbstractProjection {
        constructor(legacy: PIXI.TransformBase, enable?: boolean);
        legacy: PIXI.TransformStatic;
        _enabled: boolean;
        enabled: boolean;
        clear(): void;
    }
    enum TRANSFORM_STEP {
        NONE = 0,
        BEFORE_PROJ = 4,
        PROJ = 5,
        ALL = 9,
    }
}
declare module PIXI.projection {
    class LinearProjection<T> extends AbstractProjection {
        updateLocalTransform(lt: PIXI.Matrix): void;
        _projID: number;
        _currentProjID: number;
        _affine: AFFINE;
        affine: AFFINE;
        local: T;
        world: T;
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
        abstract fillVertices(float32View: Float32Array, uint32View: Uint32Array, index: number, sprite: any, argb: number, textureId: number): void;
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
    class Container2s extends PIXI.Container {
        constructor();
        proj: ProjectionSurface;
        readonly worldTransform: any;
    }
}
declare namespace PIXI {
    interface Matrix extends PIXI.projection.IWorldTransform {
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
    class ProjectionSurface extends AbstractProjection {
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
    class Container2d extends PIXI.Container {
        constructor();
        proj: Projection2d;
        toLocal<T extends PIXI.PointLike>(position: PIXI.PointLike, from?: PIXI.DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
        readonly worldTransform: any;
    }
    let container2dToLocal: <T extends PIXI.PointLike>(position: PIXI.PointLike, from?: PIXI.DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP) => T;
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
        scale(x: number, y: number): this;
        scaleAndTranslate(scaleX: number, scaleY: number, tx: number, ty: number): void;
        applyInverse(pos: IPoint, newPos: IPoint): IPoint;
        invert(): Matrix2d;
        identity(): Matrix2d;
        clone(): Matrix2d;
        copyTo(matrix: Matrix2d): Matrix2d;
        copy(matrix: PIXI.Matrix, affine?: AFFINE): void;
        copyFrom(matrix: PIXI.Matrix): this;
        setToMultLegacy(pt: PIXI.Matrix, lt: Matrix2d): this;
        setToMultLegacy2(pt: Matrix2d, lt: PIXI.Matrix): this;
        setToMult(pt: Matrix2d, lt: Matrix2d): this;
        prepend(lt: any): void;
    }
}
declare module PIXI.projection {
    class Mesh2d extends PIXI.mesh.Mesh {
        constructor(texture: PIXI.Texture, vertices?: Float32Array, uvs?: Float32Array, indices?: Uint16Array, drawMode?: number);
        proj: Projection2d;
        toLocal<T extends PIXI.PointLike>(position: PIXI.PointLike, from?: PIXI.DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
        readonly worldTransform: any;
    }
}
declare module PIXI.projection {
    class Mesh2dRenderer extends PIXI.mesh.MeshRenderer {
        onContextChange(): void;
    }
}
declare module PIXI.projection {
    import PointLike = PIXI.PointLike;
    class Projection2d extends LinearProjection<Matrix2d> {
        constructor(legacy: PIXI.TransformBase, enable?: boolean);
        matrix: Matrix2d;
        pivot: PIXI.ObservablePoint;
        reverseLocalOrder: boolean;
        onChange(): void;
        setAxisX(p: PointLike, factor?: number): void;
        setAxisY(p: PointLike, factor?: number): void;
        mapSprite(sprite: PIXI.Sprite, quad: Array<PointLike>): void;
        mapQuad(rect: PIXI.Rectangle, p: Array<PointLike>): void;
        updateLocalTransform(lt: PIXI.Matrix): void;
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
    namespace mesh {
        interface Mesh {
            convertTo2d(): void;
        }
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
        toLocal<T extends PIXI.PointLike>(position: PIXI.PointLike, from?: PIXI.DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
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
    class TilingSprite2d extends PIXI.extras.TilingSprite {
        constructor(texture: PIXI.Texture, width: number, height: number);
        tileProj: Projection2d;
        proj: Projection2d;
        readonly worldTransform: any;
        toLocal<T extends PIXI.PointLike>(position: PIXI.PointLike, from?: PIXI.DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
        _renderWebGL(renderer: PIXI.WebGLRenderer): void;
    }
}
declare module PIXI.projection {
    class TilingSprite2dRenderer extends PIXI.extras.TilingSpriteRenderer {
        shader: PIXI.Shader;
        simpleShader: PIXI.Shader;
        quad: PIXI.Quad;
        onContextChange(): void;
        render(ts: any): void;
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
    interface SpriteMaskFilter2dUniforms {
        mask: PIXI.Texture;
        otherMatrix: PIXI.Matrix | Matrix2d;
        alpha: number;
    }
    class SpriteMaskFilter2d extends PIXI.Filter<SpriteMaskFilter2dUniforms> {
        constructor(sprite: PIXI.Sprite);
        maskSprite: PIXI.Sprite;
        maskMatrix: Matrix2d;
        apply(filterManager: PIXI.FilterManager, input: PIXI.RenderTarget, output: PIXI.RenderTarget, clear?: boolean, currentState?: any): void;
        static calculateSpriteMatrix(currentState: any, mappedMatrix: Matrix2d, sprite: PIXI.Sprite): Matrix2d;
    }
}
declare module PIXI.projection {
    class Camera3d extends Container3d {
        constructor();
        _far: number;
        _near: number;
        _focus: number;
        _orthographic: boolean;
        readonly far: number;
        readonly near: number;
        readonly focus: number;
        readonly ortographic: boolean;
        setPlanes(focus: number, near?: number, far?: number, orthographic?: boolean): void;
    }
}
declare module PIXI.projection {
    function container3dWorldTransform(): any;
    class Container3d extends PIXI.Container {
        constructor();
        proj: Projection3d;
        isFrontFace(forceUpdate?: boolean): boolean;
        getDepth(forceUpdate?: boolean): number;
        toLocal<T extends PIXI.PointLike>(position: PIXI.PointLike, from?: PIXI.DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
        readonly worldTransform: any;
        position3d: PIXI.PointLike;
        scale3d: PIXI.PointLike;
        euler: Euler;
        pivot3d: PIXI.PointLike;
    }
    let container3dToLocal: <T extends PIXI.PointLike>(position: PIXI.PointLike, from?: PIXI.DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP) => T;
    let container3dGetDepth: (forceUpdate?: boolean) => number;
    let container3dIsFrontFace: (forceUpdate?: boolean) => boolean;
}
declare module PIXI.projection {
    class Euler implements PIXI.PointLike {
        constructor(x?: number, y?: number, z?: number);
        _quatUpdateId: number;
        _quatDirtyId: number;
        quaternion: Float64Array;
        _x: number;
        _y: number;
        _z: number;
        _sign: number;
        x: number;
        y: number;
        z: number;
        pitch: number;
        yaw: number;
        roll: number;
        set(x?: number, y?: number, z?: number): void;
        copy(euler: PIXI.PointLike): void;
        clone(): Euler;
        update(): boolean;
    }
}
declare module PIXI.projection {
    import IPoint = PIXI.PointLike;
    class Matrix3d {
        static readonly IDENTITY: Matrix3d;
        static readonly TEMP_MATRIX: Matrix3d;
        mat4: Float64Array;
        floatArray: Float32Array;
        _dirtyId: number;
        _updateId: number;
        _mat4inv: Float64Array;
        cacheInverse: boolean;
        constructor(backingArray?: ArrayLike<number>);
        a: number;
        b: number;
        c: number;
        d: number;
        tx: number;
        ty: number;
        set(a: number, b: number, c: number, d: number, tx: number, ty: number): this;
        toArray(transpose?: boolean, out?: Float32Array): Float32Array;
        setToTranslation(tx: number, ty: number, tz: number): void;
        setToRotationTranslationScale(quat: Float64Array, tx: number, ty: number, tz: number, sx: number, sy: number, sz: number): Float64Array;
        apply(pos: IPoint, newPos: IPoint): IPoint;
        translate(tx: number, ty: number, tz: number): this;
        scale(x: number, y: number, z?: number): this;
        scaleAndTranslate(scaleX: number, scaleY: number, scaleZ: number, tx: number, ty: number, tz: number): void;
        applyInverse(pos: IPoint, newPos: IPoint): IPoint;
        invert(): Matrix3d;
        invertCopyTo(matrix: Matrix3d): void;
        identity(): Matrix3d;
        clone(): Matrix3d;
        copyTo(matrix: Matrix3d): Matrix3d;
        copy(matrix: PIXI.Matrix, affine?: AFFINE): void;
        copyFrom(matrix: PIXI.Matrix): this;
        setToMultLegacy(pt: PIXI.Matrix, lt: Matrix3d): this;
        setToMultLegacy2(pt: Matrix3d, lt: PIXI.Matrix): this;
        setToMult(pt: Matrix3d, lt: Matrix3d): this;
        prepend(lt: any): void;
        static glMatrixMat4Invert(out: Float64Array, a: Float64Array): Float64Array;
        static glMatrixMat4Multiply(out: Float64Array, a: Float64Array, b: Float64Array): Float64Array;
    }
}
declare module PIXI.projection {
    class Mesh3d extends PIXI.mesh.Mesh {
        constructor(texture: PIXI.Texture, vertices?: Float32Array, uvs?: Float32Array, indices?: Uint16Array, drawMode?: number);
        proj: Projection3d;
        readonly worldTransform: any;
        toLocal<T extends PIXI.PointLike>(position: PIXI.PointLike, from?: PIXI.DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
        isFrontFace(forceUpdate?: boolean): any;
        getDepth(forceUpdate?: boolean): any;
        position3d: PIXI.PointLike;
        scale3d: PIXI.PointLike;
        euler: Euler;
        pivot3d: PIXI.PointLike;
    }
}
declare module PIXI.projection {
    class ObservableEuler implements PIXI.PointLike, Euler {
        cb: any;
        scope: any;
        constructor(cb: any, scope: any, x?: number, y?: number, z?: number);
        _quatUpdateId: number;
        _quatDirtyId: number;
        quaternion: Float64Array;
        _x: number;
        _y: number;
        _z: number;
        _sign: number;
        x: number;
        y: number;
        z: number;
        pitch: number;
        yaw: number;
        roll: number;
        set(x?: number, y?: number, z?: number): void;
        copy(euler: PIXI.PointLike): void;
        clone(): Euler;
        update(): boolean;
    }
}
declare namespace PIXI {
    interface PointLike {
        z: number;
        set(x?: number, y?: number, z?: number): void;
    }
    interface Point {
        z: number;
        set(x?: number, y?: number, z?: number): void;
    }
    interface ObservablePoint {
        _z: number;
        z: number;
        set(x?: number, y?: number, z?: number): void;
    }
}
declare module PIXI.projection {
    class Point3d extends PIXI.Point {
        constructor(x?: number, y?: number, z?: number);
    }
}
declare module PIXI.projection {
    class Projection3d extends LinearProjection<Matrix3d> {
        constructor(legacy: PIXI.TransformBase, enable?: boolean);
        cameraMatrix: Matrix3d;
        _cameraMode: boolean;
        cameraMode: boolean;
        position: PIXI.ObservablePoint;
        scale: PIXI.ObservablePoint;
        euler: ObservableEuler;
        pivot: PIXI.ObservablePoint;
        onChange(): void;
        clear(): void;
        updateLocalTransform(lt: PIXI.Matrix): void;
    }
}
declare module PIXI {
    interface Container {
        convertTo3d(): void;
        convertSubtreeTo3d(): void;
    }
}
declare module PIXI.projection {
}
declare module PIXI.projection {
    class Sprite3d extends PIXI.Sprite {
        constructor(texture: PIXI.Texture);
        proj: Projection3d;
        culledByFrustrum: boolean;
        trimmedCulledByFrustrum: boolean;
        _calculateBounds(): void;
        calculateVertices(): void;
        calculateTrimmedVertices(): void;
        _renderWebGL(renderer: PIXI.WebGLRenderer): void;
        containsPoint(point: PIXI.PointLike): boolean;
        readonly worldTransform: any;
        toLocal<T extends PIXI.PointLike>(position: PIXI.PointLike, from?: PIXI.DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
        isFrontFace(forceUpdate?: boolean): any;
        getDepth(forceUpdate?: boolean): any;
        position3d: PIXI.PointLike;
        scale3d: PIXI.PointLike;
        euler: Euler;
        pivot3d: PIXI.PointLike;
    }
}
declare module PIXI.projection {
    class Text3d extends PIXI.Text {
        constructor(text?: string, style?: PIXI.TextStyle, canvas?: HTMLCanvasElement);
        proj: Projection3d;
        readonly worldTransform: any;
        toLocal<T extends PIXI.PointLike>(position: PIXI.PointLike, from?: PIXI.DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
        isFrontFace(forceUpdate?: boolean): any;
        getDepth(forceUpdate?: boolean): any;
        position3d: PIXI.PointLike;
        scale3d: PIXI.PointLike;
        euler: Euler;
        pivot3d: PIXI.PointLike;
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
