// according to https://jsperf.com/obj-vs-array-view-access/1 , Float64Array is the best here

namespace pixi_projection {
	import Point = PIXI.Point;
	import IPoint = PIXI.PointLike;

	const mat4id = [1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1];


	export class Matrix3d {
		/**
		 * A default (identity) matrix
		 *
		 * @static
		 * @const
		 */
		static readonly IDENTITY = new Matrix3d();

		/**
		 * A temp matrix
		 *
		 * @static
		 * @const
		 */
		static readonly TEMP_MATRIX = new Matrix3d();

		/**
		 * mat4 implementation through array of 16 elements
		 */
		mat4: Float64Array;

		floatArray: Float32Array = null;

		constructor(backingArray?: ArrayLike<number>) {
			this.mat4 = new Float64Array(backingArray || mat4id);
		}

		get a() {
			return this.mat4[0] / this.mat4[15];
		}

		get b() {
			return this.mat4[1] / this.mat4[15];
		}

		get c() {
			return this.mat4[4] / this.mat4[15];
		}

		get d() {
			return this.mat4[5] / this.mat4[15];
		}

		get tx() {
			return this.mat4[12] / this.mat4[15];
		}

		get ty() {
			return this.mat4[13] / this.mat4[15];
		}

		set a(value: number) {
			this.mat4[0] = value * this.mat4[15];
		}

		set b(value: number) {
			this.mat4[1] = value * this.mat4[15];
		}

		set c(value: number) {
			this.mat4[4] = value * this.mat4[15];
		}

		set d(value: number) {
			this.mat4[5] = value * this.mat4[15];
		}

		set tx(value: number) {
			this.mat4[12] = value * this.mat4[15];
		}

		set ty(value: number) {
			this.mat4[13] = value * this.mat4[15];
		}

		set(a: number, b: number, c: number, d: number, tx: number, ty: number) {
			let mat4 = this.mat4;
			mat4[0] = a;
			mat4[1] = b;
			mat4[2] = 0;
			mat4[3] = 0;
			mat4[4] = c;
			mat4[5] = d;
			mat4[6] = 0;
			mat4[7] = 0;
			mat4[8] = 0;
			mat4[9] = 0;
			mat4[10] = 1;
			mat4[11] = 0;
			mat4[12] = tx;
			mat4[13] = ty;
			mat4[14] = 0;
			mat4[15] = 1;
			return this;
		}

		toArray(transpose?: boolean, out?: Float32Array): Float32Array {
			if (!this.floatArray) {
				this.floatArray = new Float32Array(9);
			}

			const array = out || this.floatArray;
			const mat3 = this.mat4;

			if (transpose) {
				array[0] = mat3[0];
				array[1] = mat3[1];
				array[2] = mat3[3];
				array[3] = mat3[4];
				array[4] = mat3[5];
				array[5] = mat3[7];
				array[6] = mat3[12];
				array[7] = mat3[13];
				array[8] = mat3[15];
			}
			else {
				//this branch is NEVER USED in pixi
				array[0] = mat3[0];
				array[1] = mat3[4];
				array[2] = mat3[12];
				array[3] = mat3[2];
				array[4] = mat3[6];
				array[5] = mat3[13];
				array[6] = mat3[3];
				array[7] = mat3[7];
				array[8] = mat3[15];
			}

			return array;
		}

		//TODO: remove props
		apply(pos: IPoint, newPos: IPoint): IPoint {
			newPos = newPos || new PIXI.Point();

			const mat3 = this.mat4;
			const x = pos.x;
			const y = pos.y;

			let z = 1.0 / (mat3[2] * x + mat3[5] * y + mat3[8]);
			newPos.x = z * (mat3[0] * x + mat3[3] * y + mat3[6]);
			newPos.y = z * (mat3[1] * x + mat3[4] * y + mat3[7]);

			return newPos;
		}

		translate(tx: number, ty: number) {
			const mat3 = this.mat4;
			mat3[0] += tx * mat3[2];
			mat3[1] += ty * mat3[2];
			mat3[3] += tx * mat3[5];
			mat3[4] += ty * mat3[5];
			mat3[6] += tx * mat3[8];
			mat3[7] += ty * mat3[8];
			return this;
		}

		scale(x: number, y: number) {
			const mat3 = this.mat4;
			mat3[0] *= x;
			mat3[1] *= y;
			mat3[3] *= x;
			mat3[4] *= y;
			mat3[6] *= x;
			mat3[7] *= y;
			return this;
		}

		scaleAndTranslate(scaleX: number, scaleY: number, tx: number, ty: number) {
			const mat3 = this.mat4;
			mat3[0] = scaleX * mat3[0] + tx * mat3[2];
			mat3[1] = scaleY * mat3[1] + ty * mat3[2];
			mat3[3] = scaleX * mat3[3] + tx * mat3[5];
			mat3[4] = scaleY * mat3[4] + ty * mat3[5];
			mat3[6] = scaleX * mat3[6] + tx * mat3[8];
			mat3[7] = scaleY * mat3[7] + ty * mat3[8];
		}

		//TODO: remove props
		applyInverse(pos: IPoint, newPos: IPoint): IPoint {
			newPos = newPos || new Point();

			const a = this.mat4;
			const x = pos.x;
			const y = pos.y;

			const a00 = a[0], a01 = a[3], a02 = a[6],
				a10 = a[1], a11 = a[4], a12 = a[7],
				a20 = a[2], a21 = a[5], a22 = a[8];

			let newX = (a22 * a11 - a12 * a21) * x + (-a22 * a01 + a02 * a21) * y + (a12 * a01 - a02 * a11);
			let newY = (-a22 * a10 + a12 * a20) * x + (a22 * a00 - a02 * a20) * y + (-a12 * a00 + a02 * a10);
			let newZ = (a21 * a10 - a11 * a20) * x + (-a21 * a00 + a01 * a20) * y + (a11 * a00 - a01 * a10);

			newPos.x = newX / newZ;
			newPos.y = newY / newZ;

			return newPos;
		}

		invert(): Matrix3d {
			const a = this.mat4;

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

		identity(): Matrix3d {
			const mat3 = this.mat4;
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
			return new Matrix3d(this.mat4);
		}

		copyTo(matrix: Matrix3d) {
			const mat3 = this.mat4;
			const ar2 = matrix.mat4;
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
		copy(matrix: PIXI.Matrix, affine?: AFFINE) {
			const mat3 = this.mat4;
			const d = 1.0 / mat3[8];
			const tx = mat3[6] * d, ty = mat3[7] * d;
			matrix.a = (mat3[0] - mat3[2] * tx) * d;
			matrix.b = (mat3[1] - mat3[2] * ty) * d;
			matrix.c = (mat3[3] - mat3[5] * tx) * d;
			matrix.d = (mat3[4] - mat3[5] * ty) * d;
			matrix.tx = tx;
			matrix.ty = ty;

			if (affine >= 2) {
				if (affine === AFFINE.POINT) {
					matrix.a = 1;
					matrix.b = 0;
					matrix.c = 0;
					matrix.d = 1;
				} else if (affine === AFFINE.AXIS_X) {
					matrix.c = -matrix.b;
					matrix.d = matrix.a;
				} else if (affine === AFFINE.AXIS_Y) {
					matrix.a = matrix.d;
					matrix.c = -matrix.b;
				}
			}
		}

		/**
		 * legacy method, change the values of given pixi matrix
		 * @param matrix
		 * @return
		 */
		copyFrom(matrix: PIXI.Matrix) {
			const mat3 = this.mat4;
			mat3[0] = matrix.a;
			mat3[1] = matrix.b;
			mat3[2] = 0;
			mat3[3] = matrix.c;
			mat3[4] = matrix.d;
			mat3[5] = 0;
			mat3[6] = matrix.tx;
			mat3[7] = matrix.ty;
			mat3[8] = 1.0;
			return this;
		}

		setToMultLegacy(pt: PIXI.Matrix, lt: Matrix3d) {
			const out = this.mat4;
			const b = lt.mat4;

			const a00 = pt.a, a01 = pt.b,
				a10 = pt.c, a11 = pt.d,
				a20 = pt.tx, a21 = pt.ty,

				b00 = b[0], b01 = b[1], b02 = b[2],
				b10 = b[3], b11 = b[4], b12 = b[5],
				b20 = b[6], b21 = b[7], b22 = b[8];


			out[0] = b00 * a00 + b01 * a10 + b02 * a20;
			out[1] = b00 * a01 + b01 * a11 + b02 * a21;
			out[2] = b02;

			out[3] = b10 * a00 + b11 * a10 + b12 * a20;
			out[4] = b10 * a01 + b11 * a11 + b12 * a21;
			out[5] = b12;

			out[6] = b20 * a00 + b21 * a10 + b22 * a20;
			out[7] = b20 * a01 + b21 * a11 + b22 * a21;
			out[8] = b22;

			return this;
		}

		setToMultLegacy2(pt: Matrix3d, lt: PIXI.Matrix) {
			const out = this.mat4;
			const a = pt.mat4;

			const a00 = a[0], a01 = a[1], a02 = a[2],
				a10 = a[3], a11 = a[4], a12 = a[5],
				a20 = a[6], a21 = a[7], a22 = a[8],

				b00 = lt.a, b01 = lt.b,
				b10 = lt.c, b11 = lt.d,
				b20 = lt.tx, b21 = lt.ty;


			out[0] = b00 * a00 + b01 * a10;
			out[1] = b00 * a01 + b01 * a11;
			out[2] = b00 * a02 + b01 * a12;

			out[3] = b10 * a00 + b11 * a10;
			out[4] = b10 * a01 + b11 * a11;
			out[5] = b10 * a02 + b11 * a12;

			out[6] = b20 * a00 + b21 * a10 + a20;
			out[7] = b20 * a01 + b21 * a11 + a21;
			out[8] = b20 * a02 + b21 * a12 + a22;

			return this;
		}

		// that's transform multiplication we use
		setToMult2d(pt: Matrix3d, lt: Matrix3d) {
			const out = this.mat4;
			const a = pt.mat4, b = lt.mat4;

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

		prepend(lt: any) {
			if (lt.mat4) {
				this.setToMult2d(lt, this);
			} else
			{
				this.setToMultLegacy(lt, this);
			}
		}
	}
}
