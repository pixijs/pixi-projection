///<reference types="pixi-spine"/>
module pixi_projection {
	export interface Sprite3d {
		region: PIXI.spine.core.TextureRegion;
	}

	export interface SimpleMesh3d2d {
		region: PIXI.spine.core.TextureRegion;
	}

	export class Spine3d extends PIXI.spine.Spine {
		constructor(spineData: PIXI.spine.core.SkeletonData) {
			super(spineData);

			this.convertTo3d();
		}

		proj: Projection2d;

		newContainer() {
			return new Container3d();
		}

		newSprite(tex: PIXI.Texture) {
			return new Sprite3d(tex);
		}

		newGraphics() {
			//TODO: make Graphics3d
			return new PIXI.Graphics();
		}

		newMesh(texture: PIXI.Texture, vertices?: Float32Array, uvs?: Float32Array, indices?: Uint16Array, drawMode?: number) {
			return new SimpleMesh3d2d(texture, vertices, uvs, indices, drawMode) as any;
		}

		transformHack() {
			return 3;
		}
	}
}
