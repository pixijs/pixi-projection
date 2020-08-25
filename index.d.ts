/// <reference types="pixi-spine" />
import { Container } from '@pixi/display';
import type { DisplayObject } from '@pixi/display';
import { DRAW_MODES } from '@pixi/constants';
import { Filter } from '@pixi/core';
import { Geometry } from '@pixi/core';
import { Graphics } from '@pixi/graphics';
import type { IPoint } from '@pixi/math';
import { Matrix } from '@pixi/math';
import { Mesh } from '@pixi/mesh';
import { ObservablePoint } from '@pixi/math';
import { Point } from '@pixi/math';
import { Rectangle } from '@pixi/math';
import { Renderer } from '@pixi/core';
import { RenderTexture } from '@pixi/core';
import { Shader } from '@pixi/core';
import { Sprite } from '@pixi/sprite';
import { State } from '@pixi/core';
import { systems } from '@pixi/core';
import { Text as Text_2 } from '@pixi/text';
import { TextStyle } from '@pixi/text';
import { Texture } from '@pixi/core';
import { TilingSprite } from '@pixi/sprite-tiling';
import { Transform } from '@pixi/math';

export declare class AbstractProjection {
    legacy: ProjectedTransform;
    protected _enabled: boolean;
    constructor(legacy: Transform, enable?: boolean);
    get enabled(): boolean;
    set enabled(value: boolean);
    clear(): void;
}

export declare enum AFFINE {
    NONE = 0,
    FREE = 1,
    AXIS_X = 2,
    AXIS_Y = 3,
    POINT = 4,
    AXIS_XR = 5
}

export declare class BilinearSurface extends Surface {
    distortion: Point;
    constructor();
    clear(): void;
    apply(pos: IPoint, newPos?: IPoint): IPoint;
    applyInverse(pos: IPoint, newPos: IPoint): IPoint;
    mapSprite(sprite: Sprite, quad: Array<IPoint>, outTransform?: Transform): this;
    mapQuad(rect: Rectangle, quad: Array<IPoint>, outTransform: Transform): this;
    fillUniforms(uniforms: any): void;
}

export declare class Camera3d extends Container3d {
    constructor();
    _far: number;
    _near: number;
    _focus: number;
    _orthographic: boolean;
    get far(): number;
    get near(): number;
    get focus(): number;
    get ortographic(): boolean;
    setPlanes(focus: number, near?: number, far?: number, orthographic?: boolean): void;
}

export declare class Container2d extends Container {
    constructor();
    proj: Projection2d;
    toLocal<T extends IPoint>(position: IPoint, from?: DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
    get worldTransform(): any;
}

export declare let container2dToLocal: <T extends IPoint>(position: IPoint, from?: DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP) => T;

export declare function container2dWorldTransform(): any;

export declare class Container2s extends Container {
    constructor();
    proj: ProjectionSurface;
    get worldTransform(): any;
}

export declare class Container3d extends Container {
    constructor();
    proj: Projection3d;
    isFrontFace(forceUpdate?: boolean): boolean;
    getDepth(forceUpdate?: boolean): number;
    toLocal<T extends IPoint>(position: IPoint, from?: DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
    get worldTransform(): any;
    get position3d(): IPoint3d;
    get scale3d(): IPoint;
    get euler(): IEuler;
    get pivot3d(): IPoint;
    set position3d(value: IPoint3d);
    set scale3d(value: IPoint);
    set euler(value: IEuler);
    set pivot3d(value: IPoint);
}

export declare let container3dGetDepth: (forceUpdate?: boolean) => number;

export declare let container3dIsFrontFace: (forceUpdate?: boolean) => boolean;

export declare let container3dToLocal: <T extends IPoint>(position: IPoint, from?: DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP) => T;

export declare function container3dWorldTransform(): any;

export declare class Euler {
    constructor(x?: number, y?: number, z?: number);
    _quatUpdateId: number;
    _quatDirtyId: number;
    quaternion: Float64Array;
    _x: number;
    _y: number;
    _z: number;
    _sign: number;
    get x(): number;
    set x(value: number);
    get y(): number;
    set y(value: number);
    get z(): number;
    set z(value: number);
    get pitch(): number;
    set pitch(value: number);
    get yaw(): number;
    set yaw(value: number);
    get roll(): number;
    set roll(value: number);
    set(x?: number, y?: number, z?: number): void;
    copyFrom(euler: IEuler): void;
    copyTo(p: IEuler): IEuler;
    equals(euler: IEuler): boolean;
    clone(): Euler;
    update(): boolean;
}

export declare type IEuler = Euler | ObservableEuler;

export declare interface IPoint3d {
    x: number;
    y: number;
    z: number;
}

export declare interface IWorldTransform {
    apply(pos: IPoint, newPos: IPoint): IPoint;
    applyInverse(pos: IPoint, newPos: IPoint): IPoint;
}

export declare class LinearProjection<T> extends AbstractProjection {
    _projID: number;
    _currentProjID: number;
    _affine: AFFINE;
    affinePreserveOrientation: boolean;
    scaleAfterAffine: boolean;
    updateLocalTransform(lt: Matrix): void;
    set affine(value: AFFINE);
    get affine(): AFFINE;
    local: T;
    world: T;
    set enabled(value: boolean);
    clear(): void;
}

export declare class Matrix2d {
    static readonly IDENTITY: Matrix2d;
    static readonly TEMP_MATRIX: Matrix2d;
    mat3: Float64Array;
    floatArray: Float32Array;
    constructor(backingArray?: ArrayLike<number>);
    get a(): number;
    get b(): number;
    get c(): number;
    get d(): number;
    get tx(): number;
    get ty(): number;
    set a(value: number);
    set b(value: number);
    set c(value: number);
    set d(value: number);
    set tx(value: number);
    set ty(value: number);
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
    copyTo2dOr3d(matrix: Matrix2d): Matrix2d;
    copyTo(matrix: Matrix, affine?: AFFINE, preserveOrientation?: boolean): Matrix;
    copyFrom(matrix: Matrix): this;
    setToMultLegacy(pt: Matrix, lt: Matrix2d): this;
    setToMultLegacy2(pt: Matrix2d, lt: Matrix): this;
    setToMult(pt: Matrix2d, lt: Matrix2d): this;
    prepend(lt: any): this;
}

export declare class Matrix3d {
    static readonly IDENTITY: Matrix3d;
    static readonly TEMP_MATRIX: Matrix3d;
    mat4: Float64Array;
    floatArray: Float32Array;
    _dirtyId: number;
    _updateId: number;
    _mat4inv: Float64Array;
    cacheInverse: boolean;
    constructor(backingArray?: ArrayLike<number>);
    get a(): number;
    get b(): number;
    get c(): number;
    get d(): number;
    get tx(): number;
    get ty(): number;
    set a(value: number);
    set b(value: number);
    set c(value: number);
    set d(value: number);
    set tx(value: number);
    set ty(value: number);
    set(a: number, b: number, c: number, d: number, tx: number, ty: number): this;
    toArray(transpose?: boolean, out?: Float32Array): Float32Array;
    setToTranslation(tx: number, ty: number, tz: number): void;
    setToRotationTranslationScale(quat: Float64Array, tx: number, ty: number, tz: number, sx: number, sy: number, sz: number): Float64Array;
    apply(pos: IPoint3d, newPos: IPoint3d): IPoint3d;
    translate(tx: number, ty: number, tz: number): this;
    scale(x: number, y: number, z?: number): this;
    scaleAndTranslate(scaleX: number, scaleY: number, scaleZ: number, tx: number, ty: number, tz: number): void;
    applyInverse(pos: IPoint3d, newPos: IPoint3d): IPoint3d;
    invert(): Matrix3d;
    invertCopyTo(matrix: Matrix3d): void;
    identity(): Matrix3d;
    clone(): Matrix3d;
    copyTo3d(matrix: Matrix3d): Matrix3d;
    copyTo2d(matrix: Matrix2d): Matrix2d;
    copyTo2dOr3d(matrix: Matrix2d | Matrix3d): Matrix2d | Matrix3d;
    copyTo(matrix: Matrix, affine?: AFFINE, preserveOrientation?: boolean): Matrix;
    copyFrom(matrix: Matrix): this;
    setToMultLegacy(pt: Matrix, lt: Matrix3d): this;
    setToMultLegacy2(pt: Matrix3d, lt: Matrix): this;
    setToMult(pt: Matrix3d, lt: Matrix3d): this;
    prepend(lt: any): void;
    static glMatrixMat4Invert(out: Float64Array, a: Float64Array): Float64Array;
    static glMatrixMat4Multiply(out: Float64Array, a: Float64Array, b: Float64Array): Float64Array;
}

export declare class Mesh2d extends Mesh {
    static defaultVertexShader: string;
    static defaultFragmentShader: string;
    constructor(geometry: Geometry, shader: Shader, state: State, drawMode?: DRAW_MODES);
    vertexData2d: Float32Array;
    proj: Projection2d;
    calculateVertices(): void;
    _renderDefault(renderer: Renderer): void;
    toLocal<T extends IPoint>(position: IPoint, from?: DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
    get worldTransform(): any;
}

export declare class Mesh3d2d extends Mesh {
    constructor(geometry: Geometry, shader: Shader, state: State, drawMode?: number);
    vertexData2d: Float32Array;
    proj: Projection3d;
    calculateVertices(): void;
    get worldTransform(): any;
    toLocal<T extends IPoint>(position: IPoint, from?: DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
    isFrontFace(forceUpdate?: boolean): any;
    getDepth(forceUpdate?: boolean): any;
    get position3d(): IPoint;
    get scale3d(): IPoint;
    get euler(): Euler;
    get pivot3d(): IPoint;
    set position3d(value: IPoint);
    set scale3d(value: IPoint);
    set euler(value: Euler);
    set pivot3d(value: IPoint);
}

export declare class ObservableEuler {
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
    get x(): number;
    set x(value: number);
    get y(): number;
    set y(value: number);
    get z(): number;
    set z(value: number);
    get pitch(): number;
    set pitch(value: number);
    get yaw(): number;
    set yaw(value: number);
    get roll(): number;
    set roll(value: number);
    set(x?: number, y?: number, z?: number): void;
    copyFrom(euler: IEuler): void;
    copyTo(p: IEuler): IEuler;
    equals(euler: IEuler): boolean;
    clone(): Euler;
    update(): boolean;
}

export declare class ObservablePoint3d extends ObservablePoint {
    _x: number;
    _y: number;
    _z: number;
    scope: any;
    cb: any;
    get z(): number;
    set z(value: number);
    set(x?: number, y?: number, z?: number): this;
    copyFrom(p: Point3d | IPoint3d | IPoint): this;
    copyTo(p: IPoint): IPoint;
}

export declare class Point3d extends Point {
    z: number;
    constructor(x?: number, y?: number, z?: number);
    set(x?: number, y?: number, z?: number): this;
    copyFrom(p: IPoint): this;
    copyTo(p: Point3d): Point3d;
}

export declare class ProjectedTransform extends Transform {
    proj: AbstractProjection;
}

export declare class Projection2d extends LinearProjection<Matrix2d> {
    constructor(legacy: Transform, enable?: boolean);
    matrix: Matrix2d;
    pivot: ObservablePoint;
    reverseLocalOrder: boolean;
    onChange(): void;
    setAxisX(p: IPoint, factor?: number): void;
    setAxisY(p: IPoint, factor?: number): void;
    mapSprite(sprite: Sprite, quad: Array<IPoint>): void;
    mapQuad(rect: Rectangle, p: Array<IPoint>): void;
    updateLocalTransform(lt: Matrix): void;
    clear(): void;
}

export declare class Projection3d extends LinearProjection<Matrix3d> {
    constructor(legacy: Transform, enable?: boolean);
    cameraMatrix: Matrix3d;
    _cameraMode: boolean;
    get cameraMode(): boolean;
    set cameraMode(value: boolean);
    position: ObservablePoint3d;
    scale: ObservablePoint3d;
    euler: ObservableEuler;
    pivot: ObservablePoint3d;
    onChange(): void;
    clear(): void;
    updateLocalTransform(lt: Matrix): void;
}

export declare class ProjectionSurface extends AbstractProjection {
    constructor(legacy: Transform, enable?: boolean);
    _surface: Surface;
    _activeProjection: ProjectionSurface;
    set enabled(value: boolean);
    get surface(): Surface;
    set surface(value: Surface);
    applyPartial(pos: IPoint, newPos?: IPoint): IPoint;
    apply(pos: IPoint, newPos?: IPoint): IPoint;
    applyInverse(pos: IPoint, newPos: IPoint): IPoint;
    mapBilinearSprite(sprite: Sprite, quad: Array<IPoint>): void;
    _currentSurfaceID: number;
    _currentLegacyID: number;
    _lastUniforms: any;
    clear(): void;
    get uniforms(): any;
}

export declare class SimpleMesh2d extends Mesh2d {
    constructor(texture: Texture, vertices?: Float32Array, uvs?: Float32Array, indices?: Uint16Array, drawMode?: number);
    autoUpdate: boolean;
    get vertices(): Float32Array;
    set vertices(value: Float32Array);
    protected _render(renderer?: Renderer): void;
}

export declare class SimpleMesh3d2d extends Mesh3d2d {
    constructor(texture: Texture, vertices?: Float32Array, uvs?: Float32Array, indices?: Uint16Array, drawMode?: number);
    autoUpdate: boolean;
    get vertices(): Float32Array;
    set vertices(value: Float32Array);
    protected _render(renderer?: Renderer): void;
}

export declare class Spine2d extends PIXI.spine.Spine {
    constructor(spineData: PIXI.spine.core.SkeletonData);
    proj: Projection2d;
    newContainer(): Container2d;
    newSprite(tex: Texture): any;
    newGraphics(): Graphics;
    newMesh(texture: Texture, vertices?: Float32Array, uvs?: Float32Array, indices?: Uint16Array, drawMode?: number): any;
    transformHack(): number;
}

export declare class Spine3d extends PIXI.spine.Spine {
    constructor(spineData: PIXI.spine.core.SkeletonData);
    proj: Projection2d;
    newContainer(): Container3d;
    newSprite(tex: Texture): any;
    newGraphics(): Graphics;
    newMesh(texture: Texture, vertices?: Float32Array, uvs?: Float32Array, indices?: Uint16Array, drawMode?: number): any;
    transformHack(): number;
}

export declare class Sprite2d extends Sprite {
    constructor(texture: Texture);
    vertexData2d: Float32Array;
    proj: Projection2d;
    _calculateBounds(): void;
    calculateVertices(): void;
    calculateTrimmedVertices(): void;
    toLocal<T extends IPoint>(position: IPoint, from?: DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
    get worldTransform(): any;
}

export declare class Sprite2s extends Sprite {
    constructor(texture: Texture);
    proj: ProjectionSurface;
    aTrans: Matrix;
    _calculateBounds(): void;
    calculateVertices(): void;
    calculateTrimmedVertices(): void;
    get worldTransform(): any;
}

export declare class Sprite3d extends Sprite {
    constructor(texture: Texture);
    vertexData2d: Float32Array;
    proj: Projection3d;
    culledByFrustrum: boolean;
    trimmedCulledByFrustrum: boolean;
    calculateVertices(): void;
    calculateTrimmedVertices(): void;
    _calculateBounds(): void;
    _render(renderer: Renderer): void;
    containsPoint(point: IPoint): boolean;
    get worldTransform(): any;
    toLocal<T extends IPoint>(position: IPoint, from?: DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
    isFrontFace(forceUpdate?: boolean): any;
    getDepth(forceUpdate?: boolean): any;
    get position3d(): IPoint;
    get scale3d(): IPoint;
    get euler(): Euler;
    get pivot3d(): IPoint;
    set position3d(value: IPoint);
    set scale3d(value: IPoint);
    set euler(value: Euler);
    set pivot3d(value: IPoint);
}

export declare class SpriteMaskFilter2d extends Filter {
    constructor(sprite: Sprite);
    maskSprite: Sprite;
    maskMatrix: Matrix2d;
    apply(filterManager: systems.FilterSystem, input: RenderTexture, output: RenderTexture, clearMode?: boolean): void;
    static calculateSpriteMatrix(input: RenderTexture, mappedMatrix: Matrix2d, sprite: Sprite): Matrix2d;
}

export declare abstract class Surface implements IWorldTransform {
    surfaceID: string;
    _updateID: number;
    vertexSrc: string;
    fragmentSrc: string;
    fillUniforms(uniforms: any): void;
    clear(): void;
    boundsQuad(v: ArrayLike<number>, out: any, after?: Matrix): void;
    abstract apply(pos: IPoint, newPos: IPoint): IPoint;
    abstract applyInverse(pos: IPoint, newPos: IPoint): IPoint;
}

export declare class Text2d extends Text_2 {
    constructor(text?: string, style?: TextStyle, canvas?: HTMLCanvasElement);
    proj: Projection2d;
    vertexData2d: Float32Array;
    get worldTransform(): any;
}

export declare class Text2s extends Text_2 {
    constructor(text?: string, style?: TextStyle, canvas?: HTMLCanvasElement);
    proj: ProjectionSurface;
    aTrans: Matrix;
    get worldTransform(): any;
}

export declare class Text3d extends Text_2 {
    constructor(text?: string, style?: TextStyle, canvas?: HTMLCanvasElement);
    proj: Projection3d;
    vertexData2d: Float32Array;
    get worldTransform(): any;
    toLocal<T extends IPoint>(position: IPoint, from?: DisplayObject, point?: T, skipUpdate?: boolean, step?: TRANSFORM_STEP): T;
    isFrontFace(forceUpdate?: boolean): any;
    getDepth(forceUpdate?: boolean): any;
    get position3d(): IPoint;
    get scale3d(): IPoint;
    get euler(): IEuler;
    get pivot3d(): IPoint;
    set position3d(value: IPoint);
    set scale3d(value: IPoint);
    set euler(value: IEuler);
    set pivot3d(value: IPoint);
}

export declare const TilingSprite2d: typeof TilingSprite;

export declare enum TRANSFORM_STEP {
    NONE = 0,
    BEFORE_PROJ = 4,
    PROJ = 5,
    ALL = 9
}

export declare const utils: {
    getIntersectionFactor(p1: IPoint, p2: IPoint, p3: IPoint, p4: IPoint, out: IPoint): number;
    getPositionFromQuad(p: Array<IPoint>, anchor: IPoint, out: IPoint): IPoint;
};

export { }
