/// <reference path="../types.d.ts" />

import { Point, ObservablePoint } from '@pixi/math';

import type { IPoint } from '@pixi/math';

export interface IPoint3d {
	x: number;
	y: number;
	z: number;
}

export class Point3d extends Point {
	public z: number;

	constructor(x?: number, y?: number, z?: number) {
		super(x, y);
		this.z = z;
	}

	set(x?: number, y?: number, z?: number) {
		this.x = x || 0;
		this.y = (y === undefined) ? this.x : (y || 0);
		this.z = (y === undefined) ? this.x : (z || 0);
		return this;
	}

	copyFrom(p: IPoint) {
		this.set(p.x, p.y, (p as Point3d).z || 0);
		return this;
	}

	copyTo(p: Point3d) {
		p.set(this.x, this.y, this.z);
		return p;
	}
}

export class ObservablePoint3d extends ObservablePoint {
	_x: number;
	_y: number;
	_z: number = 0;

	scope: any;
	cb: any;

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
		return this;
	}

	copyFrom(p: Point3d | IPoint3d | IPoint) {
		this.set(p.x, p.y, (p as any).z || 0);
		return this;
	}

	copyTo(p: IPoint) {
		(p as Point3d).set(this._x, this._y, this._z);
		return p;
	}
}
