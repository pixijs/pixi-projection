namespace pixi_projection {
    import PointLike = PIXI.PointLike;

    const fun = PIXI.TransformStatic.prototype.updateTransform;

    function transformHack(this: PIXI.TransformStatic, parentTransform: PIXI.TransformBase) {
        const proj = this.proj as ProjectionCurve;

        const pp = parentTransform.proj as ProjectionCurve;
        const ta = this as any;

        if (!pp) {
            fun.call(this, parentTransform);
            proj._activeCurve = null;
            return;
        }

        if (pp.curve) {
            proj._activeCurve = pp.curve;
            this.updateLocalTransform();
            this.localTransform.copy(this.worldTransform);
            if (ta._parentID < 0) {
                ++ta._worldID;
            }
            return;
        }

        fun.call(this, parentTransform);
        proj._activeCurve = pp._activeCurve;
    }

    export class ProjectionCurve extends Projection {
        constructor(legacy: PIXI.TransformBase, enable?: boolean) {
            super(legacy, enable);
        }

        curve: Curve = null;
        _activeCurve: Curve = null;

        set enabled(value: boolean) {
            if (value === this._enabled) {
                return;
            }
            this._enabled = value;
            if (value) {
                this.legacy.updateTransform = transformHack;
                (this.legacy as any)._parentID = -1;
            } else {
                this.legacy.updateTransform = PIXI.TransformStatic.prototype.updateTransform;
                (this.legacy as any)._parentID = -1;
            }
        }
    }
}
