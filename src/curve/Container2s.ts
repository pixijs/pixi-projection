/// <reference path="../types.d.ts" />

import { ProjectionSurface } from './ProjectionSurface';

export class Container2s extends PIXI.Container {
	constructor() {
		super();
		this.proj = new ProjectionSurface(this.transform);
	}

	proj: ProjectionSurface;

	get worldTransform() {
		return this.proj as any;
	}
}
