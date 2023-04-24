/* eslint-disable no-mixed-operators */
import { Projection3d } from './Projection3d';
import { Container, DisplayObject } from '@pixi/display';
import { IPointData, Matrix, Point } from '@pixi/math';
import { TRANSFORM_STEP } from '../base';
import { IEuler } from './ObservableEuler';

export function container3dWorldTransform(): Matrix
{
    return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
}

export interface IDisplayObject3d
{
    isFrontFace(forceUpdate?: boolean): boolean;
    getDepth(forceUpdate?: boolean): number;
    // eslint-disable-next-line max-len
    toLocal<P extends IPointData = Point>(position: IPointData, from?: DisplayObject, point?: P, skipUpdate?: boolean, step?: TRANSFORM_STEP): P;
    position3d: IPointData;
    scale3d: IPointData;
    euler: IEuler;
    pivot3d: IPointData;
}

export class Container3d extends Container implements IDisplayObject3d
{
    constructor()
    {
        super();
        this.proj = new Projection3d(this.transform);
    }

    proj: Projection3d;

    isFrontFace(forceUpdate = false): boolean
    {
        if (forceUpdate)
        {
            this._recursivePostUpdateTransform();
            this.displayObjectUpdateTransform();
        }

        const mat = this.proj.world.mat4;
        const dx1 = mat[0] * mat[15] - mat[3] * mat[12];
        const dy1 = mat[1] * mat[15] - mat[3] * mat[13];
        const dx2 = mat[4] * mat[15] - mat[7] * mat[12];
        const dy2 = mat[5] * mat[15] - mat[7] * mat[13];

        return dx1 * dy2 - dx2 * dy1 > 0;
    }

    /**
     * returns depth from 0 to 1
     *
     * @param {boolean} forceUpdate whether to force matrix updates
     * @returns {number} depth
     */
    getDepth(forceUpdate = false): number
    {
        if (forceUpdate)
        {
            this._recursivePostUpdateTransform();
            this.displayObjectUpdateTransform();
        }

        const mat4 = this.proj.world.mat4;

        return mat4[14] / mat4[15];
    }

    toLocal<P extends IPointData = Point>(position: IPointData, from?: DisplayObject, point?: P, skipUpdate?: boolean,
        step = TRANSFORM_STEP.ALL): P
    {
        if (from)
        {
            position = from.toGlobal(position, point, skipUpdate);
        }

        if (!skipUpdate)
        {
            this._recursivePostUpdateTransform();
        }

        if (step === TRANSFORM_STEP.ALL)
        {
            if (!skipUpdate)
            {
                this.displayObjectUpdateTransform();
            }
            if (this.proj.affine)
            {
                return this.transform.worldTransform.applyInverse(position, point) as any;
            }

            return this.proj.world.applyInverse(position, point) as any;
        }

        if (this.parent)
        {
            point = this.parent.worldTransform.applyInverse(position, point) as any;
        }
        else
        {
            point.x = position.x;
            point.y = position.y;
            // TODO: pixi 6.1.0 global mixin
            (point as any).z = (position as any).z;
        }
        if (step === TRANSFORM_STEP.NONE)
        {
            return point;
        }

        point = this.transform.localTransform.applyInverse(point, point) as any;
        if (step === TRANSFORM_STEP.PROJ && this.proj.cameraMode)
        {
            point = this.proj.cameraMatrix.applyInverse(point, point) as any;
        }

        return point;
    }

    get worldTransform(): Matrix
    {
        return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
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
    get euler(): IEuler
    {
        return this.proj.euler;
    }
    set euler(value: IEuler)
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

export const container3dToLocal = Container3d.prototype.toLocal;
export const container3dGetDepth = Container3d.prototype.getDepth;
export const container3dIsFrontFace = Container3d.prototype.isFrontFace;
