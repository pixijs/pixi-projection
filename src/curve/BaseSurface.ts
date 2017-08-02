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

		/**
		 * made for bilinear, other things will need adjustments, like test if (0) is inside
		 * @param {ArrayLike<number>} v
		 * @param out
		 * @param {PIXI.Matrix} after
		 */
		boundsQuad(v: ArrayLike<number>, out: any, after?: PIXI.Matrix) {
			tempPoint.set(v[0], v[1]);
			this.apply(tempPoint, tempPoint);
			if (after) {
				after.apply(tempPoint, tempPoint);
			}
			let minX = tempPoint.x, minY = tempPoint.y;
			let maxX = tempPoint.x, maxY = tempPoint.y;

			tempPoint.set(v[2], v[3]);
			this.apply(tempPoint, tempPoint);
			if (after) {
				after.apply(tempPoint, tempPoint);
			}
			if (minX > tempPoint.x) minX = tempPoint.x;
			if (maxX < tempPoint.x) maxX = tempPoint.x;
			if (minY > tempPoint.y) minY = tempPoint.y;
			if (maxY < tempPoint.y) maxY = tempPoint.y;

			tempPoint.set(v[4], v[5]);
			this.apply(tempPoint, tempPoint);
			if (after) {
				after.apply(tempPoint, tempPoint);
			}
			if (minX > tempPoint.x) minX = tempPoint.x;
			if (maxX < tempPoint.x) maxX = tempPoint.x;
			if (minY > tempPoint.y) minY = tempPoint.y;
			if (maxY < tempPoint.y) maxY = tempPoint.y;

			tempPoint.set(v[6], v[7]);
			this.apply(tempPoint, tempPoint);
			if (after) {
				after.apply(tempPoint, tempPoint);
			}
			if (minX > tempPoint.x) minX = tempPoint.x;
			if (maxX < tempPoint.x) maxX = tempPoint.x;
			if (minY > tempPoint.y) minY = tempPoint.y;
			if (maxY < tempPoint.y) maxY = tempPoint.y;

			out[0] = minX;
			out[1] = minY;
			out[2] = maxX;
			out[3] = minY;
			out[4] = maxX;
			out[5] = maxY;
			out[6] = minX;
			out[7] = maxY;
		}

		abstract apply(pos: PointLike, newPos: PointLike): PointLike;

		//TODO: remove props
		abstract applyInverse(pos: PointLike, newPos: PointLike): PointLike;
	}
}
