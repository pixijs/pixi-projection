// according to https://jsperf.com/obj-vs-array-view-access/1 , literal array member is the best there.

namespace pixi_projection {
	import Point = PIXI.Point;
	import IPoint = PIXI.PointLike;
	import DEG_TO_RAD = PIXI.DEG_TO_RAD;

	export enum MATRIX_TYPE {
		IDENTITY = 0,
		TRANSLATE = 1,
		ROTATE = 2,
		PROJECT = 3
	}

	export class Matrix2d {
		/**
		 * A default (identity) matrix
		 *
		 * @static
		 * @const
		 */
		static readonly IDENTITY = new Matrix2d().setType(MATRIX_TYPE.IDENTITY);

		/**
		 * A temp matrix
		 *
		 * @static
		 * @const
		 */
		static readonly TEMP_MATRIX = new Matrix2d();

		/**
		 * mat3 implementation through array of 9 elements
		 */
		mat3: Array<number>;

		/**
		 * type 2 is old pixi matrix, type 3 is projective
		 */
		type = MATRIX_TYPE.ROTATE;

		array: Float32Array = null;

		constructor(backingArray?: Array<number>) {
			this.mat3 = backingArray || [1, 0, 0, 0, 1, 0, 0, 0, 1];
		}

		setType(rank: MATRIX_TYPE) {
			this.type = rank;
			return this;
		}

		get a() {
			return this.mat3[0];
		}

		get b() {
			return this.mat3[1];
		}

		get c() {
			return this.mat3[3];
		}

		get d() {
			return this.mat3[4];
		}

		get tx() {
			return this.mat3[6];
		}

		get ty() {
			return this.mat3[7];
		}

		set a(value: number) {
			this.mat3[0] = value;
		}

		set b(value: number) {
			this.mat3[1] = value;
		}

		set c(value: number) {
			this.mat3[3] = value;
		}

		set d(value: number) {
			this.mat3[4] = value;
		}

		set tx(value: number) {
			this.mat3[6] = value;
		}

		set ty(value: number) {
			this.mat3[7] = value;
		}

		set(a: number, b: number, c: number, d: number, tx: number, ty: number) {
			let mat3 = this.mat3;
			mat3[0] = a;
			mat3[1] = b;
			mat3[3] = c;
			mat3[4] = d;
			mat3[6] = tx;
			mat3[7] = ty;
			return this;
		}

		toArray(transpose?: boolean, out?: Float32Array): Float32Array {
			if (!this.array) {
				this.array = new Float32Array(9);
			}

			const array = out || this.array;
			const mat3 = this.mat3;

			if (transpose) {
				array[0] = mat3[0];
				array[1] = mat3[1];
				array[2] = mat3[2];
				array[3] = mat3[3];
				array[4] = mat3[4];
				array[5] = mat3[5];
				array[6] = mat3[6];
				array[7] = mat3[7];
				array[8] = mat3[8];
			}
			else {
				//this branch is NEVER USED in pixi
				array[0] = mat3[0];
				array[1] = mat3[3];
				array[2] = mat3[6];
				array[3] = mat3[1];
				array[4] = mat3[4];
				array[5] = mat3[7];
				array[6] = mat3[2];
				array[7] = mat3[5];
				array[8] = mat3[8];
			}

			return array;
		}

		//TODO: remove props
		apply(pos: IPoint, newPos: IPoint): IPoint {
			newPos = newPos || new PIXI.Point();

			const mat3 = this.mat3;
			const x = pos.x;
			const y = pos.y;

			let z = mat3[2] * x + mat3[5] * y + mat3[8];
			newPos.x = (mat3[0] * x + mat3[3] * y + mat3[6]) / z;
			newPos.y = (mat3[1] * x + mat3[4] * y + mat3[7]) / z;

			return newPos;
		}

		//TODO: remove props
		applyInverse(pos: IPoint, newPos: IPoint): IPoint {
			newPos = newPos || new Point();

			const id = 1 / ((this.a * this.d) + (this.c * -this.b));

			const x = pos.x;
			const y = pos.y;

			newPos.x = (this.d * id * x) + (-this.c * id * y) + (((this.ty * this.c) - (this.tx * this.d)) * id);
			newPos.y = (this.a * id * y) + (-this.b * id * x) + (((-this.ty * this.a) + (this.tx * this.b)) * id);

			return newPos;
		}

		//TODO: remove props
		translate(x: number, y: number): Matrix2d {
			this.tx += x;
			this.ty += y;

			return this;
		}

		//TODO: remove props
		scale(x: number, y: number): Matrix2d {
			this.a *= x;
			this.d *= y;
			this.c *= x;
			this.b *= y;
			this.tx *= x;
			this.ty *= y;

			return this;
		}

		//TODO: remove props
		rotateRad(angle: number): Matrix2d {
			const cos = Math.cos(angle);
			const sin = Math.sin(angle);

			const a1 = this.a;
			const c1 = this.c;
			const tx1 = this.tx;

			this.a = (a1 * cos) - (this.b * sin);
			this.b = (a1 * sin) + (this.b * cos);
			this.c = (c1 * cos) - (this.d * sin);
			this.d = (c1 * sin) + (this.d * cos);
			this.tx = (tx1 * cos) - (this.ty * sin);
			this.ty = (tx1 * sin) + (this.ty * cos);

			return this;
		}

		//TODO: remove props
		rotateDeg(angle: number): Matrix2d {
			const cos = Math.cos(angle * DEG_TO_RAD);
			const sin = Math.sin(angle * DEG_TO_RAD);

			const a1 = this.a;
			const c1 = this.c;
			const tx1 = this.tx;

			this.a = (a1 * cos) - (this.b * sin);
			this.b = (a1 * sin) + (this.b * cos);
			this.c = (c1 * cos) - (this.d * sin);
			this.d = (c1 * sin) + (this.d * cos);
			this.tx = (tx1 * cos) - (this.ty * sin);
			this.ty = (tx1 * sin) + (this.ty * cos);

			return this;
		}

		//TODO: remove props
		append(matrix: Matrix2d): Matrix2d {
			const a1 = this.a;
			const b1 = this.b;
			const c1 = this.c;
			const d1 = this.d;

			this.a = (matrix.a * a1) + (matrix.b * c1);
			this.b = (matrix.a * b1) + (matrix.b * d1);
			this.c = (matrix.c * a1) + (matrix.d * c1);
			this.d = (matrix.c * b1) + (matrix.d * d1);

			this.tx = (matrix.tx * a1) + (matrix.ty * c1) + this.tx;
			this.ty = (matrix.tx * b1) + (matrix.ty * d1) + this.ty;

			return this;
		}

		//TODO: remove props
		setToMult(pt: Matrix2d, lt: Matrix2d) {
			const a1 = pt.a;
			const b1 = pt.b;
			const c1 = pt.c;
			const d1 = pt.d;

			this.a = (lt.a * a1) + (lt.b * c1);
			this.b = (lt.a * b1) + (lt.b * d1);
			this.c = (lt.c * a1) + (lt.d * c1);
			this.d = (lt.c * b1) + (lt.d * d1);

			this.tx = (lt.tx * a1) + (lt.ty * c1) + pt.tx;
			this.ty = (lt.tx * b1) + (lt.ty * d1) + pt.ty;
		}

		//TODO: remove props
		prepend(matrix: Matrix2d): Matrix2d {
			const tx1 = this.tx;

			if (matrix.mat3[0] !== 1 || matrix.mat3[1] !== 0 || matrix.mat3[2] !== 0 || matrix.mat3[3] !== 1) {
				const a1 = this.a;
				const c1 = this.c;

				this.a = (a1 * matrix.a) + (this.b * matrix.c);
				this.b = (a1 * matrix.b) + (this.b * matrix.d);
				this.c = (c1 * matrix.a) + (this.d * matrix.c);
				this.d = (c1 * matrix.b) + (this.d * matrix.d);
			}

			this.tx = (tx1 * matrix.a) + (this.ty * matrix.c) + matrix.tx;
			this.ty = (tx1 * matrix.b) + (this.ty * matrix.d) + matrix.ty;

			return this;
		}

		invert(): Matrix2d {
			const mat3 = this.mat3;

			const a1 = mat3[0];
			const b1 = mat3[1];
			const c1 = mat3[3];
			const d1 = mat3[4];
			const tx1 = mat3[6];
			const n = (a1 * d1) - (b1 * c1);

			mat3[0] = d1 / n;
			mat3[1] = -b1 / n;
			mat3[3] = -c1 / n;
			mat3[4] = a1 / n;
			mat3[6] = ((c1 * this.ty) - (d1 * tx1)) / n;
			mat3[7] = -((a1 * this.ty) - (b1 * tx1)) / n;

			return this;
		}

		// normalize(): Matrix2d {
		// 	const mat3 = this.mat3;
		// 	if (Math.abs(mat3[8]) > 1e-9) {
		// 		mat3[6] /= mat3[8];
		// 		mat3[7] /= mat3[8];
		// 		mat3[8] = 1;
		// 	}
		//
		// 	return this;
		// }

		identity(): Matrix2d {
			const mat3 = this.mat3;
			mat3[0] = 1;
			mat3[1] = 0;
			mat3[2] = 0;
			mat3[3] = 0;
			mat3[4] = 1;
			mat3[5] = 0;
			mat3[6] = 0;
			mat3[7] = 0;
			mat3[8] = 1;
			this.type = MATRIX_TYPE.IDENTITY;
			return this;
		}

		clone() {
			return new Matrix2d(this.mat3.slice(0));
		}

		copyTo(matrix: Matrix2d) {
			const mat3 = this.mat3;
			const ar2 = matrix.mat3;
			ar2[0] = mat3[0];
			ar2[1] = mat3[1];
			ar2[2] = mat3[2];
			ar2[3] = mat3[3];
			ar2[4] = mat3[4];
			ar2[5] = mat3[5];
			ar2[6] = mat3[6];
			ar2[7] = mat3[7];
			ar2[8] = mat3[8];
			matrix.type = this.type;
			return matrix;
		}

		/**
		 * legacy method, change the values of given pixi matrix
		 * @param matrix
		 * @return
		 */
		copy(matrix: PIXI.Matrix) {
			const mat3 = this.mat3;
			//TODO: check if rank is projective, throw an error
			matrix.a = mat3[0];
			matrix.b = mat3[1];
			matrix.c = mat3[3];
			matrix.d = mat3[4];
			matrix.tx = mat3[6];
			matrix.ty = mat3[7];
		}
	}
}
