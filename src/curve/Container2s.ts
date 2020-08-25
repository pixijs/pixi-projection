/// <reference path="../types.d.ts" />

import { Container } from '@pixi/display';
import { ProjectionSurface } from './ProjectionSurface';

export class Container2s extends Container {
	constructor() {
		super();
		this.proj = new ProjectionSurface(this.transform);
	}

	proj: ProjectionSurface;

	get worldTransform() {
		return this.proj as any;
	}
}
