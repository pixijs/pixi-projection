namespace pixi_projection {
	export class Mesh2d extends PIXI.mesh.Mesh {
		constructor(texture: PIXI.Texture, vertices?: Float32Array, uvs?: Float32Array,
		            indices?: Uint16Array, drawMode?: number) {
			super(texture, vertices, uvs, indices, drawMode);
			this.proj = new Projection2d(this.transform);
			this.pluginName = 'mesh2d';
		}

		proj: Projection2d;

		get worldTransform() {
			return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
		}
	}
}
