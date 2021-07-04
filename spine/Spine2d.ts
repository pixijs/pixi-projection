///<reference types="pixi-spine"/>
import {Graphics} from "@pixi/graphics";

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

		newSprite(tex: Texture) {
			return new Sprite2d(tex);
		}

		newGraphics() {
			//TODO: make Graphics2d
			const graphics = new Graphics();
			graphics.convertTo2d();
			return graphics;
		}

		newMesh(texture: PIXI.Texture, vertices?: Float32Array, uvs?: Float32Array, indices?: Uint16Array, drawMode?: number) {
			return new SimpleMesh2d(texture, vertices, uvs, indices, drawMode) as any;
		}

		transformHack() {
			return 2;
		}
	}
}
