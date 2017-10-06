///<reference types="pixi-spine"/>
module pixi_projection {
	export interface Sprite2d {
		region: PIXI.spine.core.TextureRegion;
	}

	export interface Mesh2d {
		region: PIXI.spine.core.TextureRegion;
	}

	export class Spine2d extends PIXI.spine.Spine {
		constructor(spineData: PIXI.spine.core.SkeletonData) {
			super(spineData);

			this.convertTo2d();
		}

		proj: Projection2d;

		newContainer() {
			return new Container2d();
		}

		newSprite(tex: PIXI.Texture) {
			return new Sprite2d(tex);
		}

		newGraphics() {
			//TODO: make Graphics2d
			return new PIXI.Graphics();
		}

		newMesh(texture: PIXI.Texture, vertices?: Float32Array, uvs?: Float32Array, indices?: Uint16Array, drawMode?: number) {
			return new Mesh2d(texture, vertices, uvs, indices, drawMode);
		}

		transformHack() {
			return false;
		}
	}
}
