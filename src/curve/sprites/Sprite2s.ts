import { Matrix } from '@pixi/math';
import { Texture, TextureMatrix } from '@pixi/core';
import { Sprite } from '@pixi/sprite';
import { ProjectionSurface } from '../ProjectionSurface';

export class Sprite2s extends Sprite
{
    constructor(texture: Texture)
    {
        super(texture);
        this.proj = new ProjectionSurface(this.transform);
        this.pluginName = 'batch_bilinear';
    }

    proj: ProjectionSurface;
    aTrans = new Matrix();

    _calculateBounds(): void
    {
        this.calculateTrimmedVertices();
        this._bounds.addQuad((this as any).vertexTrimmedData as any);
    }

    calculateVertices(): void
    {
        const wid = (this.transform as any)._worldID;
        const tuid = (this._texture as any)._updateID;
        const thisAny = this as any;

        if (thisAny._transformID === wid && this._textureID === tuid)
        {
            return;
        }

        thisAny._transformID = wid;
        this._textureID = tuid;

        const texture = this._texture;
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

        if (this.proj._surface)
        {
            vertexData[0] = w1;
            vertexData[1] = h1;
            vertexData[2] = w0;
            vertexData[3] = h1;
            vertexData[4] = w0;
            vertexData[5] = h0;
            vertexData[6] = w1;
            vertexData[7] = h0;
            this.proj._surface.boundsQuad(vertexData, vertexData);
        }
        else
        {
            const wt = this.transform.worldTransform;
            const a = wt.a;
            const b = wt.b;
            const c = wt.c;
            const d = wt.d;
            const tx = wt.tx;
            const ty = wt.ty;

            vertexData[0] = (a * w1) + (c * h1) + tx;
            vertexData[1] = (d * h1) + (b * w1) + ty;
            vertexData[2] = (a * w0) + (c * h1) + tx;
            vertexData[3] = (d * h1) + (b * w0) + ty;
            vertexData[4] = (a * w0) + (c * h0) + tx;
            vertexData[5] = (d * h0) + (b * w0) + ty;
            vertexData[6] = (a * w1) + (c * h0) + tx;
            vertexData[7] = (d * h0) + (b * w1) + ty;
            if (this.proj._activeProjection)
            {
                this.proj._activeProjection.surface.boundsQuad(vertexData, vertexData);
            }
        }

        if (!texture.uvMatrix)
        {
            texture.uvMatrix = new TextureMatrix(texture);
        }
        texture.uvMatrix.update();

        const aTrans = this.aTrans;

        aTrans.set(orig.width, 0, 0, orig.height, w1, h1);
        if (this.proj._surface === null)
        {
            aTrans.prepend(this.transform.worldTransform);
        }
        aTrans.invert();
        aTrans.prepend((texture.uvMatrix as any).mapCoord);
    }

    calculateTrimmedVertices(): void
    {
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
        const anchor = this._anchor;

        // lets calculate the new untrimmed bounds..

        const w1 = -anchor._x * orig.width;
        const w0 = w1 + orig.width;

        const h1 = -anchor._y * orig.height;
        const h0 = h1 + orig.height;

        // TODO: take rotations into account! form temporary bounds

        if (this.proj._surface)
        {
            vertexData[0] = w1;
            vertexData[1] = h1;
            vertexData[2] = w0;
            vertexData[3] = h1;
            vertexData[4] = w0;
            vertexData[5] = h0;
            vertexData[6] = w1;
            vertexData[7] = h0;
            this.proj._surface.boundsQuad(vertexData, vertexData, this.transform.worldTransform);
        }
        else
        {
            const wt = this.transform.worldTransform;
            const a = wt.a;
            const b = wt.b;
            const c = wt.c;
            const d = wt.d;
            const tx = wt.tx;
            const ty = wt.ty;

            vertexData[0] = (a * w1) + (c * h1) + tx;
            vertexData[1] = (d * h1) + (b * w1) + ty;
            vertexData[2] = (a * w0) + (c * h1) + tx;
            vertexData[3] = (d * h1) + (b * w0) + ty;
            vertexData[4] = (a * w0) + (c * h0) + tx;
            vertexData[5] = (d * h0) + (b * w0) + ty;
            vertexData[6] = (a * w1) + (c * h0) + tx;
            vertexData[7] = (d * h0) + (b * w1) + ty;
            if (this.proj._activeProjection)
            {
                this.proj._activeProjection.surface.boundsQuad(vertexData, vertexData,
                    this.proj._activeProjection.legacy.worldTransform);
            }
        }
    }

    get worldTransform(): Matrix
    {
        return this.proj as any;
    }
}
