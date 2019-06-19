namespace pixi_projection {
    import IPoint = PIXI.IPoint;

    const tempMat = new PIXI.Matrix();
    const tempRect = new PIXI.Rectangle();
    const tempPoint = new PIXI.Point();

    export class BilinearSurface extends Surface {
        distortion = new PIXI.Point();

        constructor() {
            super();
        }

        clear() {
            this.distortion.set(0, 0);
        }

        apply(pos: IPoint, newPos?: IPoint): IPoint {
            newPos = newPos || new PIXI.Point();
            const d = this.distortion;
            const m = pos.x * pos.y;
            newPos.x = pos.x + d.x * m;
            newPos.y = pos.y + d.y * m;
            return newPos;
        }

        applyInverse(pos: IPoint, newPos: IPoint): IPoint {
            newPos = newPos || new PIXI.Point();
            const vx = pos.x, vy = pos.y;
            const dx = this.distortion.x, dy = this.distortion.y;

            if (dx == 0.0) {
                newPos.x = vx;
                newPos.y = vy / (1.0 + dy * vx);
            } else
            if (dy == 0.0) {
                newPos.y = vy;
                newPos.x = vx/ (1.0 + dx * vy);
            } else {
                const b = (vy * dx - vx * dy + 1.0) * 0.5 / dy;
                const d = b * b + vx / dy;

                if (d <= 0.00001) {
                    newPos.set(NaN, NaN);
                    return;
                }
                if (dy > 0.0) {
                    newPos.x = - b + Math.sqrt(d);
                } else {
                    newPos.x = - b - Math.sqrt(d);
                }
                newPos.y = (vx / newPos.x - 1.0) / dx;
            }
            return newPos;
        }

        mapSprite(sprite: PIXI.Sprite, quad: Array<IPoint>, outTransform?: PIXI.Transform) {
            const tex = sprite.texture;

            tempRect.x = -sprite.anchor.x * tex.orig.width;
            tempRect.y = -sprite.anchor.y * tex.orig.height;
            tempRect.width = tex.orig.width;
            tempRect.height = tex.orig.height;

            return this.mapQuad(tempRect, quad, outTransform || sprite.transform as PIXI.Transform);
        }

        mapQuad(rect: PIXI.Rectangle, quad: Array<IPoint>, outTransform: PIXI.Transform) {
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
            this.distortion.set(tempPoint.x - 1, tempPoint.y - 1);

            outTransform.setFromMatrix(mat);

            return this;
        }

        fillUniforms(uniforms: any) {
            uniforms.distortion = uniforms.distortion || new Float32Array([0, 0, 0, 0]);
            const ax = Math.abs(this.distortion.x);
            const ay = Math.abs(this.distortion.y);

            uniforms.distortion[0] = ax * 10000 <= ay ? 0 : this.distortion.x;
            uniforms.distortion[1] = ay * 10000 <= ax ? 0 : this.distortion.y;
            uniforms.distortion[2] = 1.0 / uniforms.distortion[0];
            uniforms.distortion[3] = 1.0 / uniforms.distortion[1];
        }
    }
}
