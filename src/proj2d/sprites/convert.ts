/// <reference path="../../types.d.ts" />
/// <reference path="../../../global.d.ts" />

import { Container } from '@pixi/display';
import { Sprite } from '@pixi/sprite';
import { Sprite2d } from './Sprite2d';

function convertTo2d(this: Container | Sprite) {
	if (this.proj) return;
	this.proj = new Projection2d(this.transform);
	this.toLocal = Container2d.prototype.toLocal;

	Object.defineProperty(this, "worldTransform", {
		get: container2dWorldTransform,
		enumerable: true,
		configurable: true
	});
}


Container.prototype.convertTo2d = convertTo2d;

Sprite.prototype.convertTo2d = function () {
	if (this.proj) return;
	this.calculateVertices = Sprite2d.prototype.calculateVertices;
	this.calculateTrimmedVertices = Sprite2d.prototype.calculateTrimmedVertices;
	this._calculateBounds = Sprite2d.prototype._calculateBounds;
	this.pluginName = 'batch2d';
	convertTo2d.call(this);
};

Container.prototype.convertSubtreeTo2d = function () {
	this.convertTo2d();
	for (let i = 0; i < this.children.length; i++) {
		this.children[i].convertSubtreeTo2d();
	}
};

if (PIXI.SimpleMesh) {
	(PIXI as any).SimpleMesh.prototype.convertTo2d =
		(PIXI as any).SimpleRope.prototype.convertTo2d =
			function () {
				if (this.proj) return;
				this.calculateVertices = Mesh2d.prototype.calculateVertices;
				this._renderDefault = Mesh2d.prototype._renderDefault;
				if (this.material.pluginName !== 'batch2d') {
					this.material = new PIXI.MeshMaterial(this.material.texture, {
						program: PIXI.Program.from(Mesh2d.defaultVertexShader, Mesh2d.defaultFragmentShader),
						pluginName: 'batch2d'
					});
				}
				convertTo2d.call(this);
			};
}