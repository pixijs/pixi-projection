// according to https://jsperf.com/obj-vs-array-view-access/1 , Float64Array is the best here

namespace pixi_projection {
	import Point = PIXI.Point;
	import IPoint = PIXI.PointLike;

	const mat3id = [1, 0, 0, 0, 1, 0, 0, 0, 1];

	export class Matrix2d {
		/**
		 * A default (identity) matrix
		 *
		 * @static
		 * @const
		 */
		static readonly IDENTITY = new Matrix2d();

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
		mat3: Float64Array;

		floatArray: Float32Array = null;

		constructor(backingArray?: ArrayLike<number>) {
			this.mat3 = new Float64Array(backingArray || mat3id);
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
			if (!this.floatArray) {
				this.floatArray = new Float32Array(9);
			}

			const array = out || this.floatArray;
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

			let z = 1.0 / (mat3[2] * x + mat3[5] * y + mat3[8]);
			newPos.x = z * (mat3[0] * x + mat3[3] * y + mat3[6]);
			newPos.y = z * (mat3[1] * x + mat3[4] * y + mat3[7]);

			return newPos;
		}

		//TODO: remove props
		applyInverse(pos: IPoint, newPos: IPoint): IPoint {
			newPos = newPos || new Point();

			const a = this.mat3;
			const x = pos.x;
			const y = pos.y;

			const a00 = a[0], a01 = a[1], a02 = a[2],
				a10 = a[3], a11 = a[4], a12 = a[5],
				a20 = a[6], a21 = a[7], a22 = a[8];

			let newX = (a22 * a11 - a12 * a21) * x + (-a22 * a01 + a02 * a21) * y + (a12 * a01 - a02 * a11);
			let newY = (-a22 * a10 + a12 * a20) * x + (a22 * a00 - a02 * a20) * y + (-a12 * a00 + a02 * a10);
			let newZ = (a21 * a10 - a11 * a20) * x + (-a21 * a00 + a01 * a20) * y + (a11 * a00 - a01 * a10);

			newPos.x = newX / newZ;
			newPos.y = newY / newZ;

			return newPos;
		}

		invert(): Matrix2d {
			const a = this.mat3;

			const a00 = a[0], a01 = a[1], a02 = a[2],
				a10 = a[3], a11 = a[4], a12 = a[5],
				a20 = a[6], a21 = a[7], a22 = a[8],

				b01 = a22 * a11 - a12 * a21,
				b11 = -a22 * a10 + a12 * a20,
				b21 = a21 * a10 - a11 * a20;

			// Calculate the determinant
			let det = a00 * b01 + a01 * b11 + a02 * b21;
			if (!det) {
				return this;
			}
			det = 1.0 / det;

			a[0] = b01 * det;
			a[1] = (-a22 * a01 + a02 * a21) * det;
			a[2] = (a12 * a01 - a02 * a11) * det;
			a[3] = b11 * det;
			a[4] = (a22 * a00 - a02 * a20) * det;
			a[5] = (-a12 * a00 + a02 * a10) * det;
			a[6] = b21 * det;
			a[7] = (-a21 * a00 + a01 * a20) * det;
			a[8] = (a11 * a00 - a01 * a10) * det;

			return this;
		}

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
			return this;
		}

		clone() {
			return new Matrix2d(this.mat3);
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
			return matrix;
		}

		/**
		 * legacy method, change the values of given pixi matrix
		 * @param matrix
		 * @return
		 */
		copy(matrix: PIXI.Matrix) {
			const mat3 = this.mat3;
			const d = 1.0 / mat3[8];
			matrix.a = mat3[0] * d;
			matrix.b = mat3[1] * d;
			matrix.c = mat3[3] * d;
			matrix.d = mat3[4] * d;
			matrix.tx = mat3[6] * d;
			matrix.ty = mat3[7] * d;
		}

		setToMultLegacy(pt: PIXI.Matrix, lt: Matrix2d) {
			const a1 = pt.a;
			const b1 = pt.b;
			const c1 = pt.c;
			const d1 = pt.d;

			const mat3 = this.mat3;
			const ltm = lt.mat3;

			mat3[0] = (ltm[0] * a1) + (ltm[1] * c1);
			mat3[1] = (ltm[0] * b1) + (ltm[1] * d1);
			mat3[3] = (ltm[3] * a1) + (ltm[4] * c1);
			mat3[4] = (ltm[3] * b1) + (ltm[4] * d1);

			mat3[6] = (ltm[5] * a1) + (ltm[6] * c1) + pt.tx;
			mat3[7] = (ltm[5] * b1) + (ltm[6] * d1) + pt.ty;
		}

		// that's transform multiplication we use
		setToMult2d(pt: Matrix2d, lt: Matrix2d) {
			const out = this.mat3;
			const a = pt.mat3, b = lt.mat3;

			const a00 = a[0], a01 = a[1], a02 = a[2],
				a10 = a[3], a11 = a[4], a12 = a[5],
				a20 = a[6], a21 = a[7], a22 = a[8],

				b00 = b[0], b01 = b[1], b02 = b[2],
				b10 = b[3], b11 = b[4], b12 = b[5],
				b20 = b[6], b21 = b[7], b22 = b[8];

			out[0] = b00 * a00 + b01 * a10 + b02 * a20;
			out[1] = b00 * a01 + b01 * a11 + b02 * a21;
			out[2] = b00 * a02 + b01 * a12 + b02 * a22;

			out[3] = b10 * a00 + b11 * a10 + b12 * a20;
			out[4] = b10 * a01 + b11 * a11 + b12 * a21;
			out[5] = b10 * a02 + b11 * a12 + b12 * a22;

			out[6] = b20 * a00 + b21 * a10 + b22 * a20;
			out[7] = b20 * a01 + b21 * a11 + b22 * a21;
			out[8] = b20 * a02 + b21 * a12 + b22 * a22;

			return this;
		}
	}
}
