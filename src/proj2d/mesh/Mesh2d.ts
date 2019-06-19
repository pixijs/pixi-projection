namespace pixi_projection {
	export class Mesh2d extends PIXI.SimpleMesh {
		constructor(texture: PIXI.Texture, vertices?: Float32Array, uvs?: Float32Array,
		            indices?: Uint16Array, drawMode?: number) {
			super(texture, vertices, uvs, indices, drawMode);
			this.proj = new Projection2d(this.transform);
			this.material.pluginName = 'batch2d';
		}

		proj: Projection2d;

		toLocal<T extends PIXI.IPoint>(position: PIXI.IPoint, from?: PIXI.DisplayObject,
		                                  point?: T, skipUpdate?: boolean,
		                                  step = TRANSFORM_STEP.ALL): T {
			return container2dToLocal.call(this, position, from, point, skipUpdate, step);
		}

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}
	}
}
