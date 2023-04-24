import { AbstractProjection } from './AbstractProjection';
import { Matrix, Transform } from '@pixi/math';
import type { Projection2d } from '../proj2d';

export enum AFFINE
    {
    NONE = 0,
    FREE = 1,
    AXIS_X = 2,
    AXIS_Y = 3,
    POINT = 4,
    AXIS_XR = 5
}

export function transformHack(this: Transform, parentTransform: Transform): void
{
    // implementation here
    // TODO: pixi 6.1.0 global mixin
    const proj = (this as any).proj as LinearProjection<any>;
    const ta = this as any;
    const pwid = (parentTransform as any)._worldID;

    const lt = ta.localTransform;
    const scaleAfterAffine = proj.scaleAfterAffine && proj.affine >= 2;

    // this part is copied from
    if (ta._localID !== ta._currentLocalID)
    {
        // get the matrix values of the displayobject based on its transform properties..
        if (scaleAfterAffine)
        {
            lt.a = ta._cx;
            lt.b = ta._sx;
            lt.c = ta._cy;
            lt.d = ta._sy;

            lt.tx = ta.position._x;
            lt.ty = ta.position._y;
        }
        else
        {
            lt.a = ta._cx * ta.scale._x;
            lt.b = ta._sx * ta.scale._x;
            lt.c = ta._cy * ta.scale._y;
            lt.d = ta._sy * ta.scale._y;

            lt.tx = ta.position._x - ((ta.pivot._x * lt.a) + (ta.pivot._y * lt.c));
            lt.ty = ta.position._y - ((ta.pivot._x * lt.b) + (ta.pivot._y * lt.d));
        }

        ta._currentLocalID = ta._localID;

        // force an update..
        proj._currentProjID = -1;
    }

    const _matrixID = proj._projID;

    if (proj._currentProjID !== _matrixID)
    {
        proj._currentProjID = _matrixID;
        proj.updateLocalTransform(lt);
        ta._parentID = -1;
    }

    if (ta._parentID !== pwid)
    {
        // TODO: pixi 6.1.0 global mixin
        const pp = (parentTransform as any).proj as Projection2d;

        if (pp && !pp._affine)
        {
            proj.world.setToMult(pp.world, proj.local);
        }
        else
        {
            proj.world.setToMultLegacy(parentTransform.worldTransform, proj.local);
        }

        const wa = ta.worldTransform;

        proj.world.copyTo(wa, proj._affine, proj.affinePreserveOrientation);

        if (scaleAfterAffine)
        {
            wa.a *= ta.scale._x;
            wa.b *= ta.scale._x;
            wa.c *= ta.scale._y;
            wa.d *= ta.scale._y;

            wa.tx -= ((ta.pivot._x * wa.a) + (ta.pivot._y * wa.c));
            wa.ty -= ((ta.pivot._x * wa.b) + (ta.pivot._y * wa.d));
        }
        ta._parentID = pwid;
        ta._worldID++;
    }
}

export class LinearProjection<T> extends AbstractProjection
{
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateLocalTransform(lt: Matrix): void
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    {
    }

    _projID = 0;
    _currentProjID = -1;
    _affine = AFFINE.NONE;
    affinePreserveOrientation = false;
    scaleAfterAffine = true;

    set affine(value: AFFINE)
    {
        if (this._affine === value) return;
        this._affine = value;
        this._currentProjID = -1;
        // this is because scaleAfterAffine
        (this.legacy as any)._currentLocalID = -1;
    }

    get affine(): AFFINE
    {
        return this._affine;
    }

    local: T;
    world: T;

    // eslint-disable-next-line accessor-pairs
    set enabled(value: boolean)
    {
        if (value === this._enabled)
        {
            return;
        }
        this._enabled = value;
        if (value)
        {
            this.legacy.updateTransform = transformHack;
            (this.legacy as any)._parentID = -1;
        }
        else
        {
            this.legacy.updateTransform = Transform.prototype.updateTransform;
            (this.legacy as any)._parentID = -1;
        }
    }

    clear(): void
    {
        this._currentProjID = -1;
        this._projID = 0;
    }
}
