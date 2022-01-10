/* eslint-disable no-mixed-operators */
import { Sprite } from '@pixi/sprite';
import { Texture } from '@pixi/core';
import { Projection2d } from '../Projection2d';
import { IPointData, Matrix, Point } from '@pixi/math';
import { DisplayObject } from '@pixi/display';
import { TRANSFORM_STEP } from '../../base';
import { container2dToLocal } from '../Container2d';

export class Sprite2d extends Sprite
{
    constructor(texture: Texture)
    {
        super(texture);
        this.proj = new Projection2d(this.transform);
        this.pluginName = 'batch2d';
    }

    vertexData2d: Float32Array = null;
    proj: Projection2d;

    _calculateBounds(): void
    {
        this.calculateTrimmedVertices();
        this._bounds.addQuad((this as any).vertexTrimmedData);
    }

    calculateVertices(): void
    {
        const texture = this._texture;
        const thisAny = this as any;

        if (this.proj._affine)
        {
            this.vertexData2d = null;
            super.calculateVertices();

            return;
        }
        if (!this.vertexData2d)
        {
            this.vertexData2d = new Float32Array(12);
        }

        const wid = (this.transform as any)._worldID;
        const tuid = (texture as any)._updateID;

        if (thisAny._transformID === wid && this._textureID === tuid)
        {
            return;
        }
        // update texture UV here, because base texture can be changed without calling `_onTextureUpdate`
        if (this._textureID !== tuid)
        {
            (this as any).uvs = (texture as any)._uvs.uvsFloat32;
        }

        thisAny._transformID = wid;
        this._textureID = tuid;

        const wt = this.proj.world.mat3;
        const vertexData2d = this.vertexData2d;
        const vertexData = this.vertexData;
        const trim = texture.trim;
        const orig = texture.orig;
        const anchor = this._anchor;

        let w0: number;
        let w1: number;
        let h0: number;
        let h1: number;

        if (trim)
        {
            w1 = trim.x - (anchor._x * orig.width);
            w0 = w1 + trim.width;

            h1 = trim.y - (anchor._y * orig.height);
            h0 = h1 + trim.height;
        }
        else
        {
            w1 = -anchor._x * orig.width;
            w0 = w1 + orig.width;

            h1 = -anchor._y * orig.height;
            h0 = h1 + orig.height;
        }

        vertexData2d[0] = (wt[0] * w1) + (wt[3] * h1) + wt[6];
        vertexData2d[1] = (wt[1] * w1) + (wt[4] * h1) + wt[7];
        vertexData2d[2] = (wt[2] * w1) + (wt[5] * h1) + wt[8];

        vertexData2d[3] = (wt[0] * w0) + (wt[3] * h1) + wt[6];
        vertexData2d[4] = (wt[1] * w0) + (wt[4] * h1) + wt[7];
        vertexData2d[5] = (wt[2] * w0) + (wt[5] * h1) + wt[8];

        vertexData2d[6] = (wt[0] * w0) + (wt[3] * h0) + wt[6];
        vertexData2d[7] = (wt[1] * w0) + (wt[4] * h0) + wt[7];
        vertexData2d[8] = (wt[2] * w0) + (wt[5] * h0) + wt[8];

        vertexData2d[9] = (wt[0] * w1) + (wt[3] * h0) + wt[6];
        vertexData2d[10] = (wt[1] * w1) + (wt[4] * h0) + wt[7];
        vertexData2d[11] = (wt[2] * w1) + (wt[5] * h0) + wt[8];

        vertexData[0] = vertexData2d[0] / vertexData2d[2];
        vertexData[1] = vertexData2d[1] / vertexData2d[2];

        vertexData[2] = vertexData2d[3] / vertexData2d[5];
        vertexData[3] = vertexData2d[4] / vertexData2d[5];

        vertexData[4] = vertexData2d[6] / vertexData2d[8];
        vertexData[5] = vertexData2d[7] / vertexData2d[8];

        vertexData[6] = vertexData2d[9] / vertexData2d[11];
        vertexData[7] = vertexData2d[10] / vertexData2d[11];
    }

    calculateTrimmedVertices(): void
    {
        if (this.proj._affine)
        {
            super.calculateTrimmedVertices();

            return;
        }

        const wid = (this.transform as any)._worldID;
        const tuid = (this._texture as any)._updateID;
        const thisAny = this as any;

        if (!thisAny.vertexTrimmedData)
        {
            thisAny.vertexTrimmedData = new Float32Array(8);
        }
        else if (thisAny._transformTrimmedID === wid && this._textureTrimmedID === tuid)
        {
            return;
        }

        thisAny._transformTrimmedID = wid;
        this._textureTrimmedID = tuid;

        // lets do some special trim code!
        const texture = this._texture;
        const vertexData = thisAny.vertexTrimmedData;
        const orig = texture.orig;
        const w = (this as any).tileProj ? this._width : orig.width;
        const h = (this as any).tileProj ? this._height : orig.height;
        const anchor = this._anchor;

        // lets calculate the new untrimmed bounds..
        const wt = this.proj.world.mat3;

        const w1 = -anchor._x * w;
        const w0 = w1 + w;

        const h1 = -anchor._y * h;
        const h0 = h1 + h;

        let z = 1.0 / (wt[2] * w1 + wt[5] * h1 + wt[8]);

        vertexData[0] = z * ((wt[0] * w1) + (wt[3] * h1) + wt[6]);
        vertexData[1] = z * ((wt[1] * w1) + (wt[4] * h1) + wt[7]);

        z = 1.0 / (wt[2] * w0 + wt[5] * h1 + wt[8]);
        vertexData[2] = z * ((wt[0] * w0) + (wt[3] * h1) + wt[6]);
        vertexData[3] = z * ((wt[1] * w0) + (wt[4] * h1) + wt[7]);

        z = 1.0 / (wt[2] * w0 + wt[5] * h0 + wt[8]);
        vertexData[4] = z * ((wt[0] * w0) + (wt[3] * h0) + wt[6]);
        vertexData[5] = z * ((wt[1] * w0) + (wt[4] * h0) + wt[7]);

        z = 1.0 / (wt[2] * w1 + wt[5] * h0 + wt[8]);
        vertexData[6] = z * ((wt[0] * w1) + (wt[3] * h0) + wt[6]);
        vertexData[7] = z * ((wt[1] * w1) + (wt[4] * h0) + wt[7]);
    }

    toLocal<P extends IPointData = Point>(position: IPointData, from?: DisplayObject, point?: P, skipUpdate?: boolean,
        step = TRANSFORM_STEP.ALL): P
    {
        return container2dToLocal.call(this, position, from, point, skipUpdate, step);
    }

    get worldTransform(): Matrix
    {
        return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
    }
}
