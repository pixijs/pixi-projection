/// <reference types="pixi-spine"/>
/// <reference path="../src/types.d.ts" />

import { Container2d, Projection2d, Sprite2d, SimpleMesh2d } from '../src';
import { Graphics } from '@pixi/graphics';

import type { Texture } from '@pixi/core';

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
		return new Sprite2d(tex) as any;
	}

	newGraphics() {
		//TODO: make Graphics2d
		return new Graphics();
	}

	newMesh(texture: Texture, vertices?: Float32Array, uvs?: Float32Array, indices?: Uint16Array, drawMode?: number) {
		return new SimpleMesh2d(texture, vertices, uvs, indices, drawMode) as any;
	}

	transformHack() {
		return 2;
	}
}
