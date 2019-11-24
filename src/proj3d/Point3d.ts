declare namespace PIXI {
    export interface IPoint {
        z?: number;
        set(x?: number, y?: number, z?: number): void;
    }

	export interface Point {
		z?: number;
		set(x?: number, y?: number, z?: number): void;
	}

	export interface ObservablePoint {
		_z?: number;
		z: number;
		cb?: any;
        scope?: any;
		set(x?: number, y?: number, z?: number): void;
	}
}

namespace pixi_projection {
	export class Point3d extends PIXI.Point {
		constructor(x?: number, y?: number, z?: number) {
			super(x, y);
			this.z = z;
		}

		set(x?: number, y?: number, z?: number) {
			this.x = x || 0;
			this.y = (y === undefined) ? this.x : (y || 0);
			this.z = (y === undefined) ? this.x : (z || 0);
		}

		copyFrom(p: PIXI.IPoint) {
			this.set(p.x, p.y, p.z || 0);
			return this;
		}

		copyTo(p: PIXI.Point) {
			p.set(this.x, this.y, this.z);
			return p;
		}
	}

	export class ObservablePoint3d extends PIXI.ObservablePoint {
		_z: number = 0;

		get z() {
			return this._z;
		}

		set z(value) {
			if (this._z !== value) {
				this._z = value;
				this.cb.call(this.scope);
			}
		}

		set(x?: number, y?: number, z?: number) {
			const _x = x || 0;
			const _y = (y === undefined) ? _x : (y || 0);
			const _z = (y === undefined) ? _x : (z || 0);

			if (this._x !== _x || this._y !== _y || this._z !== _z) {
				this._x = _x;
				this._y = _y;
				this._z = _z;
				this.cb.call(this.scope);
			}
		}

		copyFrom(p: PIXI.IPoint) {
			this.set(p.x, p.y, p.z || 0);
			return this;
		}

		copyTo(p: PIXI.IPoint) {
			p.set(this._x, this._y, this._z);
			return p;
		}
	}
}
