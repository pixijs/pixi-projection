declare namespace PIXI {
    export interface TransformBase {
        proj: pixi_projection.Projection;
    }

    export interface ObservablePoint {
        _x: number;
        _y: number;
    }

    export interface TransformStatic {
        proj: pixi_projection.Projection;
    }
}

namespace pixi_projection {
    export class Projection {

        constructor(legacy: PIXI.TransformBase, enable: boolean = true) {
            this.legacy = legacy as PIXI.TransformStatic;

            if (enable) {
                this.enabled = true;
            }

            // sorry for hidden class, it would be good to have special projection field in official pixi
            this.legacy.proj = this;
        }

        legacy: PIXI.TransformStatic;

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
}
