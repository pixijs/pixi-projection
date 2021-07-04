import { Text, TextStyle } from '@pixi/text';
import { Projection3d } from '../Projection3d';
import { IPointData, Matrix } from '@pixi/math';
import { container3dGetDepth, container3dIsFrontFace, container3dToLocal } from '../Container3d';
import { DisplayObject } from '@pixi/display';
import { TRANSFORM_STEP } from '../../base';
import { Sprite3d } from './Sprite3d';
import { Euler } from '../Euler';

export class Text3d extends Text
{
    constructor(text?: string, style?: TextStyle, canvas?: HTMLCanvasElement)
    {
        super(text, style, canvas);
        this.proj = new Projection3d(this.transform);
        this.pluginName = 'batch2d';
    }

    proj: Projection3d;
    vertexData2d: Float32Array = null;

    get worldTransform(): Matrix
    {
        return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
    }

    toLocal<T extends IPointData>(position: IPointData, from?: DisplayObject,
        point?: T, skipUpdate?: boolean,
        step = TRANSFORM_STEP.ALL): T
    {
        return container3dToLocal.call(this, position, from, point, skipUpdate, step);
    }

    isFrontFace(forceUpdate?: boolean): boolean
    {
        return container3dIsFrontFace.call(this, forceUpdate);
    }

    getDepth(forceUpdate?: boolean): boolean
    {
        return container3dGetDepth.call(this, forceUpdate);
    }

    get position3d(): IPointData
    {
        return this.proj.position;
    }
    set position3d(value: IPointData)
    {
        this.proj.position.copyFrom(value);
    }
    get scale3d(): IPointData
    {
        return this.proj.scale;
    }
    set scale3d(value: IPointData)
    {
        this.proj.scale.copyFrom(value);
    }
    get euler(): Euler
    {
        return this.proj.euler;
    }
    set euler(value: Euler)
    {
        this.proj.euler.copyFrom(value);
    }
    get pivot3d(): IPointData
    {
        return this.proj.pivot;
    }
    set pivot3d(value: IPointData)
    {
        this.proj.pivot.copyFrom(value);
    }
}

Text3d.prototype.calculateVertices = Sprite3d.prototype.calculateVertices;
(Text3d.prototype as any).calculateTrimmedVertices = Sprite3d.prototype.calculateTrimmedVertices;
(Text3d.prototype as any)._calculateBounds = Sprite3d.prototype._calculateBounds;
Text3d.prototype.containsPoint = Sprite3d.prototype.containsPoint;
(Text3d.prototype as any)._render = Sprite3d.prototype._render;
