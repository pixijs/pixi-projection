import { IPointData, Transform } from '@pixi/math';
import { AbstractProjection } from '../base';
import { Surface } from './BaseSurface';
import { BilinearSurface } from './BilinearSurface';
import { Sprite } from '@pixi/sprite';

const fun = Transform.prototype.updateTransform;

export interface IWorldTransform {
    apply(pos: IPointData, newPos: IPointData): IPointData;

    // TODO: remove props
    applyInverse(pos: IPointData, newPos: IPointData): IPointData;
}

function transformHack(this: Transform, parentTransform: Transform): IWorldTransform
{
    // TODO: pixi 6.1.0 global mixin
    const proj = (this as any).proj as ProjectionSurface;

    const pp = (parentTransform as any).proj as ProjectionSurface;
    const ta = this as any;

    if (!pp)
    {
        fun.call(this, parentTransform);
        proj._activeProjection = null;

        return;
    }

    if (pp._surface)
    {
        proj._activeProjection = pp;
        this.updateLocalTransform();
        this.localTransform.copyTo(this.worldTransform);
        if (ta._parentID < 0)
        {
            ++ta._worldID;
        }

        return;
    }

    fun.call(this, parentTransform);
    proj._activeProjection = pp._activeProjection;
}

export class ProjectionSurface extends AbstractProjection
{
    _surface: Surface = null;
    _activeProjection: ProjectionSurface = null;

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

    get surface(): Surface
    {
        return this._surface;
    }

    set surface(value: Surface)
    {
        if (this._surface === value)
        {
            return;
        }
        this._surface = value || null;
        (this.legacy as any)._parentID = -1;
    }

    applyPartial(pos: IPointData, newPos?: IPointData): IPointData
    {
        if (this._activeProjection !== null)
        {
            newPos = this.legacy.worldTransform.apply(pos, newPos);

            return this._activeProjection.surface.apply(newPos, newPos);
        }
        if (this._surface !== null)
        {
            return this.surface.apply(pos, newPos);
        }

        return this.legacy.worldTransform.apply(pos, newPos);
    }

    apply(pos: IPointData, newPos?: IPointData): IPointData
    {
        if (this._activeProjection !== null)
        {
            newPos = this.legacy.worldTransform.apply(pos, newPos);
            this._activeProjection.surface.apply(newPos, newPos);

            return this._activeProjection.legacy.worldTransform.apply(newPos, newPos);
        }
        if (this._surface !== null)
        {
            newPos = this.surface.apply(pos, newPos);

            return this.legacy.worldTransform.apply(newPos, newPos);
        }

        return this.legacy.worldTransform.apply(pos, newPos);
    }

    applyInverse(pos: IPointData, newPos: IPointData): IPointData
    {
        if (this._activeProjection !== null)
        {
            newPos = this._activeProjection.legacy.worldTransform.applyInverse(pos, newPos);
            this._activeProjection._surface.applyInverse(newPos, newPos);

            return this.legacy.worldTransform.applyInverse(newPos, newPos);
        }
        if (this._surface !== null)
        {
            newPos = this.legacy.worldTransform.applyInverse(pos, newPos);

            return this._surface.applyInverse(newPos, newPos);
        }

        return this.legacy.worldTransform.applyInverse(pos, newPos);
    }

    mapBilinearSprite(sprite: Sprite, quad: Array<IPointData>): void
    {
        if (!(this._surface instanceof BilinearSurface))
        {
            this.surface = new BilinearSurface();
        }
        (this.surface as BilinearSurface).mapSprite(sprite, quad, this.legacy);
    }

    _currentSurfaceID = -1;
    _currentLegacyID = -1;
    _lastUniforms : any = null;

    clear(): void
    {
        if (this.surface)
        {
            this.surface.clear();
        }
    }

    get uniforms(): any
    {
        if (this._currentLegacyID === (this.legacy as any)._worldID
            && this._currentSurfaceID === this.surface._updateID)
        {
            return this._lastUniforms;
        }

        this._lastUniforms = this._lastUniforms || {};
        this._lastUniforms.translationMatrix = this.legacy.worldTransform;
        this._surface.fillUniforms(this._lastUniforms);

        return this._lastUniforms;
    }
}
