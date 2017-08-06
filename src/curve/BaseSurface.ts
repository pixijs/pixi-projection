namespace pixi_projection {
    import PointLike = PIXI.PointLike;

    const tempPoint = new PIXI.Point();

    export abstract class Surface implements IWorldTransform {
        surfaceID = "default";

        _updateID: number = 0;

        vertexSrc: string = "";
        fragmentSrc: string = "";

        fillUniforms(uniforms: any) {

        }
        
        clear() {

        }

        /**
         * made for bilinear, other things will need adjustments, like test if (0) is inside
         * @param {ArrayLike<number>} v
         * @param out
         * @param {PIXI.Matrix} after
         */
        boundsQuad(v: ArrayLike<number>, out: any, after?: PIXI.Matrix) {
            let minX = out[0], minY = out[1];
            let maxX = out[0], maxY = out[1];
            for (let i = 2; i < 8; i += 2) {
                if (minX > out[i]) minX = out[i];
                if (maxX < out[i]) maxX = out[i];
                if (minY > out[i + 1]) minY = out[i + 1];
                if (maxY < out[i + 1]) maxY = out[i + 1];
            }

            tempPoint.set(minX, minY);
            this.apply(tempPoint, tempPoint);
            if (after) {
                after.apply(tempPoint, tempPoint);
            }
            out[0] = tempPoint.x;
            out[1] = tempPoint.y;

            tempPoint.set(maxX, minY);
            this.apply(tempPoint, tempPoint);
            if (after) {
                after.apply(tempPoint, tempPoint);
            }
            out[2] = tempPoint.x;
            out[3] = tempPoint.y;

            tempPoint.set(maxX, maxY);
            this.apply(tempPoint, tempPoint);
            if (after) {
                after.apply(tempPoint, tempPoint);
            }
            out[4] = tempPoint.x;
            out[5] = tempPoint.y;

            tempPoint.set(minX, maxY);
            this.apply(tempPoint, tempPoint);
            if (after) {
                after.apply(tempPoint, tempPoint);
            }
            out[6] = tempPoint.x;
            out[7] = tempPoint.y;
        }

        abstract apply(pos: PointLike, newPos: PointLike): PointLike;

        //TODO: remove props
        abstract applyInverse(pos: PointLike, newPos: PointLike): PointLike;
    }
}
