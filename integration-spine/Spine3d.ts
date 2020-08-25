/// <reference types="pixi-spine"/>
/// <reference path="../src/types.d.ts" />

import { Container3d, Sprite3d, SimpleMesh3d2d } from '../src';
import { Graphics } from '@pixi/graphics';

import type { Texture } from '@pixi/core';
import type { Projection2d } from '../src';

export class Spine3d extends PIXI.spine.Spine {
	constructor(spineData: PIXI.spine.core.SkeletonData) {
		super(spineData);

		this.convertTo3d();
	}

	proj: Projection2d;

	newContainer() {
		return new Container3d();
	}

	newSprite(tex: Texture) {
		return new Sprite3d(tex) as any;
	}

	newGraphics() {
		//TODO: make Graphics3d
		return new Graphics();
	}

	newMesh(texture: Texture, vertices?: Float32Array, uvs?: Float32Array, indices?: Uint16Array, drawMode?: number) {
		return new SimpleMesh3d2d(texture, vertices, uvs, indices, drawMode) as any;
	}

	transformHack() {
		return 3;
	}
}
