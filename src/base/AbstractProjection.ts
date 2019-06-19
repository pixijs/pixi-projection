declare namespace PIXI {
    export interface Transform {
        proj?: pixi_projection.AbstractProjection;
    }

    export interface ObservablePoint {
        _x?: number;
        _y?: number;
    }

    export interface Container {
		displayObjectUpdateTransform?(): void;
	}
}

namespace pixi_projection {
    export class AbstractProjection {

        constructor(legacy: PIXI.Transform, enable: boolean = true) {
            this.legacy = legacy;

            if (enable) {
                this.enabled = true;
            }

            // sorry for hidden class, it would be good to have special projection field in official pixi
            this.legacy.proj = this;
        }

        legacy: PIXI.Transform;

        _enabled: boolean = false;

        get enabled() {
            return this._enabled;
        }

        set enabled(value: boolean) {
            this._enabled = value;
        }

        clear() {
        }
    }

    export enum TRANSFORM_STEP {
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
}
