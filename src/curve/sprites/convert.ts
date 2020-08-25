/// <reference path="../../types.d.ts" />

import { Container } from '@pixi/display';
import { Projection2d } from '../../proj2d/Projection2d';
import { Sprite } from '@pixi/sprite';
import { Sprite2s } from './Sprite2s';

Sprite.prototype.convertTo2s = function () {
	if (this.proj) return;
	//cointainer
	this.pluginName = 'sprite_bilinear';
	this.aTrans = new PIXI.Matrix();
	this.calculateVertices = Sprite2s.prototype.calculateVertices;
	this.calculateTrimmedVertices = Sprite2s.prototype.calculateTrimmedVertices;
	this._calculateBounds = Sprite2s.prototype._calculateBounds;
	PIXI.Container.prototype.convertTo2s.call(this);
};

Container.prototype.convertTo2s = function () {
	if (this.proj) return;
	this.proj = new Projection2d(this.transform);
	Object.defineProperty(this, "worldTransform", {
		get: function () {
			return this.proj;
		},
		enumerable: true,
		configurable: true
	});
};

Container.prototype.convertSubtreeTo2s = function () {
	this.convertTo2s();
	for (let i = 0; i < this.children.length; i++) {
		this.children[i].convertSubtreeTo2s();
	}
};

