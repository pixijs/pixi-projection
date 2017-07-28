declare namespace PIXI {
    export interface TransformBase {
        proj: pixi_projection.Projection2d;
    }

    export interface ObservablePoint {
        _x: number;
        _y: number;
    }

    export interface TransformStatic {
        proj: pixi_projection.Projection2d;
    }
}

namespace pixi_projection {
    import PointLike = PIXI.PointLike;

    function transformHack(this: PIXI.TransformStatic, parentTransform: PIXI.TransformBase) {
        // implementation here
        const proj = this.proj;
        const ta = this as any;
        const pwid = (parentTransform as any)._worldID;

        const lt = ta.localTransform;

        //this part is copied from
        if (ta._localID !== ta._currentLocalID) {
            // get the matrix values of the displayobject based on its transform properties..
            lt.a = ta._cx * ta.scale._x;
            lt.b = ta._sx * ta.scale._x;
            lt.c = ta._cy * ta.scale._y;
            lt.d = ta._sy * ta.scale._y;

            //TODO: do something about pivot, it has to be applied after the projections
            //TODO: add special pivot mode that user request for 2 years already

            lt.tx = ta.position._x - ((ta.pivot._x * lt.a) + (ta.pivot._y * lt.c));
            lt.ty = ta.position._y - ((ta.pivot._x * lt.b) + (ta.pivot._y * lt.d));
            ta._currentLocalID = ta._localID;

            // force an update..
            proj._currentMatrixID = -1;
        }

        const _matrixID = proj._matrixID;
        if (proj._currentMatrixID !== _matrixID) {
            proj._currentMatrixID = _matrixID;
            if (_matrixID !== 0) {
                proj.local.setToMultLegacy(lt, proj.matrix);
            } else {
                proj.local.copyFrom(lt);
            }
            ta._parentID = -1;
        }

        if (ta._parentID !== pwid) {
            const pp = parentTransform.proj;
            if (pp) {
                proj.world.setToMult2d(pp.world, proj.local);
            } else {
                proj.world.setToMultLegacy(parentTransform.worldTransform, proj.local);
            }
            proj.world.copy(ta.worldTransform);
            ta._parentID = pwid;
            ta._worldID++;
        }
    }

    const t0 = new PIXI.Point();
    const t1 = new PIXI.Point();
    const t2 = new PIXI.Point();
    const tempZero = new PIXI.Point(0, 0);
    const tempMat = new Matrix2d();

    export class Projection2d {

        constructor(legacy: PIXI.TransformBase, enable: boolean = true) {
            this.legacy = legacy as PIXI.TransformStatic;

            if (enable) {
                this.enabled = true;
            }

            // sorry for hidden class, it would be good to have special projection field in official pixi
            this.legacy.proj = this;
        }

        legacy: PIXI.TransformStatic;

        matrix = new Matrix2d();
        local = new Matrix2d();
        world = new Matrix2d();

        _matrixID = 0;
        _currentMatrixID = -1;

        _enabled: boolean = false;

        get enabled() {
            return this._enabled;
        }

        set enabled(value: boolean) {
            if (value === this._enabled) {
                return;
            }
            this._enabled = value;
            if (value) {
                this.legacy.updateTransform = transformHack;
            } else {
                this.legacy.updateTransform = PIXI.TransformStatic.prototype.updateTransform;
            }
        }

        setAxisX(p: PointLike, factor: number = 1): void {
            const x = p.x, y = p.y;
            const d = Math.sqrt(x * x + y * y);
            const mat3 = this.matrix.mat3;
            mat3[0] = x / d;
            mat3[1] = y / d;
            mat3[2] = factor / d;
            this._matrixID++;
        }

        setAxisY(p: PointLike, factor: number = 1) {
            const x = p.x, y = p.y;
            const d = Math.sqrt(x * x + y * y);
            const mat3 = this.matrix.mat3;
            mat3[3] = x / d;
            mat3[4] = y / d;
            mat3[5] = factor / d;
            this._matrixID++;
        }

        setFromQuad(p: Array<PointLike>, anchor: PointLike = tempZero, sizeX: number = 1, sizeY: number = 1) {
            // utils.getPositionFromQuad(p, anchor, t0);

            let mat3 = this.matrix.mat3;
            mat3[6] = 0;
            mat3[7] = 0;
            mat3[8] = 1;
            // mat3[6] = t0.x;
            // mat3[7] = t0.y;
            // mat3[8] = 1;

            let f1 = utils.getIntersectionFactor(p[0], p[1], p[3], p[2], t1);
            this.setAxisX(t1, f1);
            let f2 = utils.getIntersectionFactor(p[1], p[2], p[0], p[3], t2);
            this.setAxisY(t2, f2);

            this.matrix.applyInverse(p[0], t1);
            this.matrix.applyInverse(p[2], t2);

            let m3 = tempMat.mat3;
            //for anchor (0,0)
            m3[0] = (t2.x - t1.x) / sizeX;
            m3[6] = t1.x;
            m3[4] = (t2.y - t1.y) / sizeY;
            m3[7] = t1.y;
            this.matrix.setToMult2d(this.matrix, tempMat);
        }

        clear() {
            this._currentMatrixID = -1;
            this._matrixID = 0;
            this.matrix.identity();
        }
    }
}
