import { IEuler } from './ObservableEuler';

export class Euler
{
    constructor(x?: number, y?: number, z?: number)
    {
        /**
         * @member {number}
         * @default 0
         */
        this._x = x || 0;

        /**
         * @member {number}
         * @default 0
         */
        this._y = y || 0;

        /**
         * @member {number}
         * @default 0
         */
        this._z = z || 0;

        this.quaternion = new Float64Array(4);
        this.quaternion[3] = 1;

        this.update();
    }

    _quatUpdateId = -1;
    _quatDirtyId = 0;

    quaternion: Float64Array;

    _x: number;
    _y: number;
    _z: number;
    _sign = 1;

    get x(): number
    {
        return this._x;
    }

    set x(value: number)
    {
        if (this._x !== value)
        {
            this._x = value;
            this._quatDirtyId++;
        }
    }

    get y(): number
    {
        return this._y;
    }

    set y(value: number)
    {
        if (this._y !== value)
        {
            this._y = value;
            this._quatDirtyId++;
        }
    }

    get z(): number
    {
        return this._z;
    }

    set z(value: number)
    {
        if (this._z !== value)
        {
            this._z = value;
            this._quatDirtyId++;
        }
    }

    get pitch(): number
    {
        return this._x;
    }

    set pitch(value: number)
    {
        if (this._x !== value)
        {
            this._x = value;
            this._quatDirtyId++;
        }
    }

    get yaw(): number
    {
        return this._y;
    }

    set yaw(value: number)
    {
        if (this._y !== value)
        {
            this._y = value;
            this._quatDirtyId++;
        }
    }

    get roll(): number
    {
        return this._z;
    }

    set roll(value: number)
    {
        if (this._z !== value)
        {
            this._z = value;
            this._quatDirtyId++;
        }
    }

    set(x?: number, y?: number, z?: number): void
    {
        const _x = x || 0;
        const _y = y || 0;
        const _z = z || 0;

        if (this._x !== _x || this._y !== _y || this._z !== _z)
        {
            this._x = _x;
            this._y = _y;
            this._z = _z;
            this._quatDirtyId++;
        }
    }

    copyFrom(euler: IEuler): this
    {
        const _x = euler.x;
        const _y = euler.y;
        const _z = euler.z;

        if (this._x !== _x || this._y !== _y || this._z !== _z)
        {
            this._x = _x;
            this._y = _y;
            this._z = _z;
            this._quatDirtyId++;
        }

        return this;
    }

    copyTo(p: IEuler): IEuler
    {
        p.set(this._x, this._y, this._z);

        return p;
    }

    equals(euler: IEuler): boolean
    {
        return this._x === euler.x
            && this._y === euler.y
            && this._z === euler.z;
    }

    clone(): Euler
    {
        return new Euler(this._x, this._y, this._z);
    }

    update(): boolean
    {
        if (this._quatUpdateId === this._quatDirtyId)
        {
            return false;
        }
        this._quatUpdateId = this._quatDirtyId;

        const c1 = Math.cos(this._x / 2);
        const c2 = Math.cos(this._y / 2);
        const c3 = Math.cos(this._z / 2);

        const s = this._sign;
        const s1 = s * Math.sin(this._x / 2);
        const s2 = s * Math.sin(this._y / 2);
        const s3 = s * Math.sin(this._z / 2);

        const q = this.quaternion;

        q[0] = (s1 * c2 * c3) + (c1 * s2 * s3);
        q[1] = (c1 * s2 * c3) - (s1 * c2 * s3);
        q[2] = (c1 * c2 * s3) + (s1 * s2 * c3);
        q[3] = (c1 * c2 * c3) - (s1 * s2 * s3);

        return true;
    }
}
