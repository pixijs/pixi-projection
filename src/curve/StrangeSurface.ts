namespace pixi_projection {
    import PointLike = PIXI.PointLike;
    import WebGLState = PIXI.WebGLState;

    const tempMat = new PIXI.Matrix();
    const tempRect = new PIXI.Rectangle();
    const tempPoint = new PIXI.Point();

    export class StrangeSurface extends Surface {
        constructor() {
            super();
        }

        params = [0, 0, NaN, NaN];

        clear() {
            let p = this.params;
            p[0] = 0;
            p[1] = 0;
            p[2] = NaN;
            p[3] = NaN;
        }

        setAxisX(pos: PointLike, factor: number, outTransform: PIXI.TransformStatic) {
            const x = pos.x, y = pos.y;
            //TODO: check x=0, y=0

            let d = Math.sqrt(x * x + y * y);
            let rot = outTransform.rotation;
            if (rot !== 0) {
                outTransform.skew._x -= rot;
                outTransform.skew._y += rot;
                outTransform.rotation = 0;
            }
            outTransform.skew.y = Math.atan2(y, x);

            let p = this.params;

            if (factor !== 0) {
                p[2] = -d * factor;
            } else {
                p[2] = NaN;
            }
            this._calc01();
        }

        setAxisY(pos: PointLike, factor: number, outTransform: PIXI.TransformStatic) {
            const x = pos.x, y = pos.y;

            //TODO: check if axis x and axis y is the same

            let d = Math.sqrt(x * x + y * y);
            let rot = outTransform.rotation;
            if (rot !== 0) {
                outTransform.skew._x -= rot;
                outTransform.skew._y += rot;
                outTransform.rotation = 0;
            }
            outTransform.skew.x = -Math.atan2(y, x) + Math.PI / 2;

            let p = this.params;

            if (factor !== 0) {
                p[3] = -d * factor;
            } else {
                p[3] = NaN;
            }
            this._calc01();
        }

        _calc01() {
            let p = this.params;
            if (isNaN(p[2])) {
                p[1] = 0;
                if (isNaN(p[3])) {
                    p[0] = 0;
                } else {
                    p[0] = 1.0 / p[3];
                }
            } else {
                if (isNaN(p[3])) {
                    p[0] = 0;
                    p[1] = 1.0 / p[2];
                } else {
                    const d = 1.0 - p[2] * p[3];
                    p[0] = (1.0 - p[2]) / d;
                    p[1] = (1.0 - p[3]) / d;
                }
            }
        }

        apply(pos: PointLike, newPos?: PointLike): PointLike {
            newPos = newPos || new PIXI.Point();

            const aleph = this.params[0], bet = this.params[1], A = this.params[2], B = this.params[3];
            const u = pos.x, v = pos.y;

            if (aleph === 0.0) {
                newPos.y = v * (1 + u * bet);
                newPos.x = u;
            }
            else if (bet === 0.0) {
                newPos.x = u * (1 + v * aleph);
                newPos.y = v;
            } else {
                const D = A * B - v * u;
                newPos.x = A * u * (B + v) / D;
                newPos.y = B * v * (A + u) / D;
            }
            return newPos;
        }

        applyInverse(pos: PointLike, newPos: PointLike): PointLike {
            newPos = newPos || new PIXI.Point();

            const aleph = this.params[0], bet = this.params[1], A = this.params[2], B = this.params[3];
            const x = pos.x, y = pos.y;

            if (aleph === 0.0) {
                newPos.y = y / (1 + x * bet);
                newPos.x = x;
            }
            else if (bet === 0.0) {
                newPos.x = x * (1 + y * aleph);
                newPos.y = y;
            } else {
                newPos.x = x * (bet + 1) / (bet + 1 + y * aleph);
                newPos.y = y * (aleph + 1) / (aleph + 1 + x * bet);
            }
            return newPos;
        }

        mapSprite(sprite: PIXI.Sprite, quad: Array<PointLike>, outTransform?: PIXI.TransformStatic) {
            const tex = sprite.texture;

            tempRect.x = -sprite.anchor.x * tex.orig.width;
            tempRect.y = -sprite.anchor.y * tex.orig.height;
            tempRect.width = tex.orig.width;
            tempRect.height = tex.orig.height;

            return this.mapQuad(tempRect, quad, outTransform || sprite.transform as PIXI.TransformStatic);
        }

        mapQuad(rect: PIXI.Rectangle, quad: Array<PointLike>, outTransform: PIXI.TransformStatic) {
            const ax = -rect.x / rect.width;
            const ay = -rect.y / rect.height;

            const ax2 = (1.0 - rect.x) / rect.width;
            const ay2 = (1.0 - rect.y) / rect.height;

            const up1x = (quad[0].x * (1.0 - ax) + quad[1].x * ax);
            const up1y = (quad[0].y * (1.0 - ax) + quad[1].y * ax);
            const up2x = (quad[0].x * (1.0 - ax2) + quad[1].x * ax2);
            const up2y = (quad[0].y * (1.0 - ax2) + quad[1].y * ax2);

            const down1x = (quad[3].x * (1.0 - ax) + quad[2].x * ax);
            const down1y = (quad[3].y * (1.0 - ax) + quad[2].y * ax);
            const down2x = (quad[3].x * (1.0 - ax2) + quad[2].x * ax2);
            const down2y = (quad[3].y * (1.0 - ax2) + quad[2].y * ax2);

            const x00 = up1x * (1.0 - ay) + down1x * ay;
            const y00 = up1y * (1.0 - ay) + down1y * ay;

            const x10 = up2x * (1.0 - ay) + down2x * ay;
            const y10 = up2y * (1.0 - ay) + down2y * ay;

            const x01 = up1x * (1.0 - ay2) + down1x * ay2;
            const y01 = up1y * (1.0 - ay2) + down1y * ay2;

            const x11 = up2x * (1.0 - ay2) + down2x * ay2;
            const y11 = up2y * (1.0 - ay2) + down2y * ay2;

            const mat = tempMat;
            mat.tx = x00;
            mat.ty = y00;
            mat.a = x10 - x00;
            mat.b = y10 - y00;
            mat.c = x01 - x00;
            mat.d = y01 - y00;
            tempPoint.set(x11, y11);
            mat.applyInverse(tempPoint, tempPoint);
            // this.distortion.set(tempPoint.x - 1, tempPoint.y - 1);

            outTransform.setFromMatrix(mat);

            return this;
        }

        fillUniforms(uniforms: any) {
            const params = this.params;
            const distortion = uniforms.params || new Float32Array([0, 0, 0, 0]);

            uniforms.params = distortion;
            distortion[0] = params[0];
            distortion[1] = params[1];
            distortion[2] = params[2];
            distortion[3] = params[3];
        }
    }
}
