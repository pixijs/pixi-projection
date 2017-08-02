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
			if (minX > v[2]) minX = v[2];
			if (maxX < v[2]) maxX = v[2];
			if (minY > v[3]) minY = v[3];
			if (maxY < v[3]) maxY = v[3];

			tempPoint.set(v[4], v[5]);
			this.apply(tempPoint, tempPoint);
			if (after) {
				after.apply(tempPoint, tempPoint);
			}
			if (minX > v[4]) minX = v[4];
			if (maxX < v[4]) maxX = v[4];
			if (minY > v[5]) minY = v[5];
			if (maxY < v[5]) maxY = v[5];

			tempPoint.set(v[6], v[7]);
			this.apply(tempPoint, tempPoint);
			if (after) {
				after.apply(tempPoint, tempPoint);
			}
			if (minX > v[6]) minX = v[6];
			if (maxX < v[6]) maxX = v[6];
			if (minY > v[7]) minY = v[7];
			if (maxY < v[7]) maxY = v[7];

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
