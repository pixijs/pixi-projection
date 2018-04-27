// according to https://jsperf.com/obj-vs-array-view-access/1 , Float64Array is the best here

namespace pixi_projection {
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

		_dirtyId: number = 0;
		_updateId: number = -1;
		_mat4inv: Float64Array = null;
		cacheInverse: boolean = false;

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

		setTranslation(p: PIXI.PointLike) {
			const mat4 = this.mat4;

			mat4[0] = 1;
			mat4[1] = 0;
			mat4[2] = 0;
			mat4[3] = 0;

			mat4[4] = 0;
			mat4[5] = 1;
			mat4[6] = 0;
			mat4[7] = 0;

			mat4[8] = 0;
			mat4[9] = 0;
			mat4[10] = 1;
			mat4[11] = 0;

			mat4[12] = p.x;
			mat4[13] = p.y;
			mat4[14] = p.z;
			mat4[15] = 1;
		}

		setRotationTranslation(euler: Euler, p: PIXI.PointLike) {
			const out = this.mat4;
			const q = euler.quaternion;

			let x = q[0], y = q[1], z = q[2], w = q[3];
			let x2 = x + x;
			let y2 = y + y;
			let z2 = z + z;

			let xx = x * x2;
			let xy = x * y2;
			let xz = x * z2;
			let yy = y * y2;
			let yz = y * z2;
			let zz = z * z2;
			let wx = w * x2;
			let wy = w * y2;
			let wz = w * z2;

			out[0] = 1 - (yy + zz);
			out[1] = xy + wz;
			out[2] = xz - wy;
			out[3] = 0;
			out[4] = xy - wz;
			out[5] = 1 - (xx + zz);
			out[6] = yz + wx;
			out[7] = 0;
			out[8] = xz + wy;
			out[9] = yz - wx;
			out[10] = 1 - (xx + yy);
			out[11] = 0;
			out[12] = p.x;
			out[13] = p.y;
			out[14] = p.z;
			out[15] = 1;

			return out;
		}

		//TODO: remove props
		apply(pos: IPoint, newPos: IPoint): IPoint {
			newPos = newPos || new PIXI.Point();

			const mat4 = this.mat4;
			const x = pos.x;
			const y = pos.y;
			const z = pos.z;

			let w = 1.0 / (mat4[3] * x + mat4[7] * y + mat4[11] * z + mat4[15]);
			newPos.x = w * (mat4[0] * x + mat4[4] * y + mat4[8] * z + mat4[12]);
			newPos.y = w * (mat4[1] * x + mat4[5] * y + mat4[9] * z + mat4[13]);
			newPos.z = w * (mat4[2] * x + mat4[6] * y + mat4[10] * z + mat4[14]);

			return newPos;
		}

		translate(tx: number, ty: number, tz?: number) {
			const mat4 = this.mat4;
			mat4[0] += tx * mat4[3];
			mat4[1] += ty * mat4[3];

			mat4[4] += tx * mat4[7];
			mat4[5] += ty * mat4[7];

			mat4[8] += tx * mat4[11];
			mat4[9] += ty * mat4[11];

			mat4[12] += tx * mat4[15];
			mat4[13] += ty * mat4[15];

			if (tz !== undefined) {
				mat4[2] += tz * mat4[3];
				mat4[6] += tz * mat4[7];
				mat4[10] += tz * mat4[11];
				mat4[14] += tz * mat4[15];
			}

			return this;
		}

		scale(x: number, y: number, z?: number) {
			const mat4 = this.mat4;
			mat4[0] *= x;
			mat4[1] *= y;

			mat4[4] *= x;
			mat4[5] *= y;

			mat4[8] *= x;
			mat4[9] *= y;

			mat4[12] *= x;
			mat4[13] *= y;

			if (z !== undefined) {
				mat4[2] *= z;
				mat4[6] *= z;
				mat4[10] *= z;
				mat4[14] *= z;
			}

			return this;
		}

		scaleAndTranslate(scaleX: number, scaleY: number, tx: number, ty: number) {
			const mat3 = this.mat4;
			mat3[0] = scaleX * mat3[0] + tx * mat3[3];
			mat3[1] = scaleY * mat3[1] + ty * mat3[3];

			mat3[4] = scaleX * mat3[4] + tx * mat3[7];
			mat3[5] = scaleY * mat3[5] + ty * mat3[7];

			mat3[8] = scaleX * mat3[8] + tx * mat3[11];
			mat3[9] = scaleY * mat3[9] + ty * mat3[11];

			mat3[12] = scaleX * mat3[12] + tx * mat3[15];
			mat3[13] = scaleY * mat3[13] + ty * mat3[15];
		}

		//TODO: remove props
		applyInverse(pos: IPoint, newPos: IPoint): IPoint {
			newPos = newPos || new Point3d();
			if (!this._mat4inv) {
				this._mat4inv = new Float64Array(16);
			}

			const mat4 = this._mat4inv;
			const a = this.mat4;
			const x = pos.x;
			const y = pos.y;
			const z = pos.z;

			if (!this.cacheInverse || this._updateId !== this._dirtyId) {
				this._updateId = this._dirtyId;
				Matrix3d.glMatrixMat4Invert(mat4, a);
			}

			let w = 1.0 / (mat4[3] * x + mat4[7] * y + mat4[11] * z + mat4[15]);
			newPos.x = w * (mat4[0] * x + mat4[4] * y + mat4[8] * z + mat4[12]);
			newPos.y = w * (mat4[1] * x + mat4[5] * y + mat4[9] * z + mat4[13]);
			newPos.z = w * (mat4[2] * x + mat4[6] * y + mat4[10] * z + mat4[14]);
			return newPos;
		}

		invert(): Matrix3d {
			Matrix3d.glMatrixMat4Invert(this.mat4, this.mat4);
			return this;
		}

		invertCopyTo(matrix: Matrix3d) {
			if (!this._mat4inv) {
				this._mat4inv = new Float64Array(16);
			}

			const mat4 = this._mat4inv;
			const a = this.mat4;

			if (!this.cacheInverse || this._updateId !== this._dirtyId) {
				this._updateId = this._dirtyId;
				Matrix3d.glMatrixMat4Invert(mat4, a);
			}

			matrix.mat4.set(mat4);
		}

		identity(): Matrix3d {
			const mat3 = this.mat4;
			mat3[0] = 1;
			mat3[1] = 0;
			mat3[2] = 0;
			mat3[3] = 0;

			mat3[4] = 0;
			mat3[5] = 1;
			mat3[6] = 0;
			mat3[7] = 0;

			mat3[8] = 0;
			mat3[9] = 0;
			mat3[10] = 1;
			mat3[11] = 0;

			mat3[12] = 0;
			mat3[13] = 0;
			mat3[14] = 0;
			mat3[15] = 1;
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
			const d = 1.0 / mat3[15];
			const tx = mat3[12] * d, ty = mat3[13] * d;
			matrix.a = (mat3[0] - mat3[3] * tx) * d;
			matrix.b = (mat3[1] - mat3[3] * ty) * d;
			matrix.c = (mat3[4] - mat3[7] * tx) * d;
			matrix.d = (mat3[5] - mat3[7] * ty) * d;
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
			mat3[3] = 0;

			mat3[4] = matrix.c;
			mat3[5] = matrix.d;
			mat3[6] = 0;
			mat3[7] = 0;

			mat3[8] = 0;
			mat3[9] = 0;
			mat3[10] = 1;
			mat3[11] = 0;

			mat3[12] = matrix.tx;
			mat3[13] = matrix.ty;
			mat3[14] = 0;
			mat3[15] = 1;
			return this;
		}

		setToMultLegacy(pt: PIXI.Matrix, lt: Matrix3d) {
			const out = this.mat4;
			const b = lt.mat4;

			const a00 = pt.a, a01 = pt.b,
				a10 = pt.c, a11 = pt.d,
				a30 = pt.tx, a31 = pt.ty;

			let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];

			out[0] = b0 * a00 + b1 * a10 + b3 * a30;
			out[1] = b0 * a01 + b1 * a11 + b3 * a31;
			out[2] = b2;
			out[3] = b3;

			b0 = b[4];
			b1 = b[5];
			b2 = b[6];
			b3 = b[7];
			out[4] = b0 * a00 + b1 * a10 + b3 * a30;
			out[5] = b0 * a01 + b1 * a11 + b3 * a31;
			out[6] = b2;
			out[7] = b3;

			b0 = b[8];
			b1 = b[9];
			b2 = b[10];
			b3 = b[11];
			out[8] = b0 * a00 + b1 * a10 + b3 * a30;
			out[9] = b0 * a01 + b1 * a11 + b3 * a31;
			out[10] = b2;
			out[11] = b3;

			b0 = b[12];
			b1 = b[13];
			b2 = b[14];
			b3 = b[15];
			out[12] = b0 * a00 + b1 * a10 + b3 * a30;
			out[13] = b0 * a01 + b1 * a11 + b3 * a31;
			out[14] = b2;
			out[15] = b3;

			return this;
		}

		setToMultLegacy2(pt: Matrix3d, lt: PIXI.Matrix) {
			const out = this.mat4;
			const a = pt.mat4;

			const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
			const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];

			const b00 = lt.a, b01 = lt.b,
				b10 = lt.c, b11 = lt.d,
				b30 = lt.tx, b31 = lt.ty;

			out[0] = b00 * a00 + b01 * a10;
			out[1] = b00 * a01 + b01 * a11;
			out[2] = b00 * a02 + b01 * a12;
			out[3] = b00 * a03 + b01 * a13;

			out[4] = b10 * a00 + b11 * a10;
			out[5] = b10 * a01 + b11 * a11;
			out[6] = b10 * a02 + b11 * a12;
			out[7] = b10 * a03 + b11 * a13;

			out[8] = a[8];
			out[9] = a[9];
			out[10] = a[10];
			out[11] = a[11];

			out[12] = b30 * a00 + b31 * a10 + a[12];
			out[13] = b30 * a01 + b31 * a11 + a[13];
			out[14] = b30 * a02 + b31 * a12 + a[14];
			out[15] = b30 * a03 + b31 * a13 + a[15];


			return this;
		}

		// that's transform multiplication we use
		setToMult2d(pt: Matrix3d, lt: Matrix3d) {
			Matrix3d.glMatrixMat4Multiply(this.mat4, pt.mat4, lt.mat4);
			return this;
		}

		prepend(lt: any) {
			if (lt.mat4) {
				this.setToMult2d(lt, this);
			} else {
				this.setToMultLegacy(lt, this);
			}
		}

		static glMatrixMat4Invert(out: Float64Array, a: Float64Array) {
			let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
			let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
			let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
			let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

			let b00 = a00 * a11 - a01 * a10;
			let b01 = a00 * a12 - a02 * a10;
			let b02 = a00 * a13 - a03 * a10;
			let b03 = a01 * a12 - a02 * a11;
			let b04 = a01 * a13 - a03 * a11;
			let b05 = a02 * a13 - a03 * a12;
			let b06 = a20 * a31 - a21 * a30;
			let b07 = a20 * a32 - a22 * a30;
			let b08 = a20 * a33 - a23 * a30;
			let b09 = a21 * a32 - a22 * a31;
			let b10 = a21 * a33 - a23 * a31;
			let b11 = a22 * a33 - a23 * a32;

			// Calculate the determinant
			let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

			if (!det) {
				return null;
			}
			det = 1.0 / det;

			out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
			out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
			out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
			out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
			out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
			out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
			out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
			out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
			out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
			out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
			out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
			out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
			out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
			out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
			out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
			out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

			return out;
		}

		static glMatrixMat4Multiply(out: Float64Array, a: Float64Array, b: Float64Array) {
			let a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
			let a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
			let a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
			let a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

			// Cache only the current line of the second matrix
			let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
			out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
			out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
			out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
			out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

			b0 = b[4];
			b1 = b[5];
			b2 = b[6];
			b3 = b[7];
			out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
			out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
			out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
			out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

			b0 = b[8];
			b1 = b[9];
			b2 = b[10];
			b3 = b[11];
			out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
			out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
			out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
			out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

			b0 = b[12];
			b1 = b[13];
			b2 = b[14];
			b3 = b[15];
			out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
			out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
			out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
			out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
			return out;
		}
	}
}
