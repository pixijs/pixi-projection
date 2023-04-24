import { Transform } from '@pixi/math';

export class AbstractProjection
{
    constructor(legacy: Transform, enable = true)
    {
        this.legacy = legacy;

        if (enable)
        {
            this.enabled = true;
        }

        // sorry for hidden class, it would be good to have special projection field in official pixi
        // TODO: pixi 6.1.0 global mixin
        (this.legacy as any).proj = this;
    }

    legacy: Transform;

    _enabled = false;

    get enabled(): boolean
    {
        return this._enabled;
    }

    set enabled(value: boolean)
    {
        this._enabled = value;
    }

    clear(): void
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    {
    }
}

export enum TRANSFORM_STEP
    {
    NONE = 0,
    // POS = 1,
    // ROT = 2,
    // SCALE = 3,
    // PIVOT = 4,
    BEFORE_PROJ = 4,
    PROJ = 5,
    // POS_2 = 6,
    // ROT_2 = 7,
    // SCALE_2 = 8,
    // PIVOT_2 = 9,
    ALL = 9
}
