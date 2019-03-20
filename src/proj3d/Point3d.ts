declare namespace PIXI {
	export interface PointLike {
		z: number;
		set(x?: number, y?: number, z?: number): void;
	}

	export interface Point {
		z: number;
		set(x?: number, y?: number, z?: number): void;
	}

	export interface ObservablePoint {
		_z: number;
		z: number;
		set(x?: number, y?: number, z?: number): void;
	}
}

namespace pixi_projection {
	PIXI.Point.prototype.z = 0;
	PIXI.Point.prototype.set = function(x?: number, y?: number, z?: number) {
		this.x = x || 0;
		this.y = (y === undefined) ? this.x : (y || 0);
		this.z = (y === undefined) ? this.x : (z || 0);
	};

	PIXI.Point.prototype.copy = function(p?: PIXI.PointLike) {
		this.set(p.x, p.y, p.z);
	};

	PIXI.ObservablePoint.prototype._z = 0;
	PIXI.ObservablePoint.prototype.set = function(x?: number, y?: number, z?: number) {
		const _x = x || 0;
		const _y = (y === undefined) ? _x : (y || 0);
		const _z = (y === undefined) ? _x : (z || 0);

		if (this._x !== _x || this._y !== _y || this._z !== _z)
		{
			this._x = _x;
			this._y = _y;
			this._z = _z;
			this.cb.call(this.scope);
		}
	};

	Object.defineProperty(PIXI.ObservablePoint.prototype, "z", {
		get: function() {
			return this._z;
		},
		set: function(value) {
			if (this._z !== value)
			{
				this._z = value;
				this.cb.call(this.scope);
			}
		},
		enumerable: true,
		configurable: true
	});

	PIXI.ObservablePoint.prototype.copy = function(point?: PIXI.PointLike) {
		if (this._x !== point.x || this._y !== point.y || this._z !== point.z)
		{
			this._x = point.x;
			this._y = point.y;
			this._z = point.z;
			this.cb.call(this.scope);
		}
	};

	export class Point3d extends PIXI.Point {
		constructor(x?: number, y?: number, z?: number) {
			super(x, y);
			this.z = z;
		}
	}

	(PIXI as any).Point3d = Point3d;
}
