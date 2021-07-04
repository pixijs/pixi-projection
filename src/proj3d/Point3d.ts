import { IPoint, IPointData, ObservablePoint, Point } from '@pixi/math';

export class Point3d extends Point
{
    // TODO: pixi 6.1.0 global mixin
    z: number;
    constructor(x?: number, y?: number, z?: number)
    {
        super(x, y);
        this.z = z;
    }

    set(x?: number, y?: number, z?: number): this
    {
        this.x = x || 0;
        this.y = (y === undefined) ? this.x : (y || 0);
        this.z = (y === undefined) ? this.x : (z || 0);

        return this;
    }

    copyFrom(p: IPointData): this
    {
        // TODO: pixi 6.1.0 global mixin
        this.set(p.x, p.y, (p as any).z || 0);

        return this;
    }

    copyTo<T extends IPoint>(p: T): T
    {
        (p as any).set(this.x, this.y, this.z);

        return p;
    }
}

export class ObservablePoint3d extends ObservablePoint
{
    _z = 0;

    get z(): number
    {
        return this._z;
    }

    set z(value: number)
    {
        if (this._z !== value)
        {
            this._z = value;
            this.cb.call(this.scope);
        }
    }

    set(x?: number, y?: number, z?: number): this
    {
        const _x = x || 0;
        const _y = (y === undefined) ? _x : (y || 0);
        const _z = (y === undefined) ? _x : (z || 0);

        if (this._x !== _x || this._y !== _y || this._z !== _z)
        {
            this._x = _x;
            this._y = _y;
            this._z = _z;
            this.cb.call(this.scope);
        }

        return this;
    }

    copyFrom(p: IPointData): this
    {
        // TODO: pixi 6.1.0 global mixin
        this.set(p.x, p.y, (p as any).z || 0);

        return this;
    }

    copyTo<T extends IPoint>(p: T): T
    {
        (p as any).set(this._x, this._y, this._z);

        return p;
    }
}
