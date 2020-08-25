import { Transform } from '@pixi/math';

export class ProjectedTransform extends Transform {
	proj: AbstractProjection;
}

export class AbstractProjection {
	legacy: ProjectedTransform;

	protected _enabled: boolean = false;

	constructor(legacy: Transform, enable: boolean = true) {
		this.legacy = legacy as ProjectedTransform;

		if (enable) {
			this.enabled = true;
		}

		// sorry for hidden class, it would be good to have special projection field in official pixi
		this.legacy.proj = this;
	}

	get enabled() {
		return this._enabled;
	}

	set enabled(value: boolean) {
		this._enabled = value;
	}

	clear() {
	}
}