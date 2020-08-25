/// <reference path="../../types.d.ts" />

import { MaskData, systems } from '@pixi/core';
import { SpriteMaskFilter2d } from './SpriteMaskFilter';

import type { Sprite } from '@pixi/sprite';

systems.MaskSystem.prototype.pushSpriteMask =  function(maskData: MaskData): void {
	const { maskObject } = maskData;
	const target = (maskData as any)._target;

	let alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex];

	if (!alphaMaskFilter) {
		alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex] = [new SpriteMaskFilter2d(maskObject as Sprite)];
	}

	alphaMaskFilter[0].resolution = this.renderer.resolution;
	alphaMaskFilter[0].maskSprite = maskObject;

	const stashFilterArea = target.filterArea;

	target.filterArea = maskObject.getBounds(true);
	this.renderer.filter.push(target, alphaMaskFilter);
	target.filterArea = stashFilterArea;

	this.alphaMaskIndex++;
}
