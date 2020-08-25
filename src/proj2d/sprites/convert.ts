/// <reference path="../../types.d.ts" />
/// <reference path="../../../global.d.ts" />

import { Container } from '@pixi/display';
import { Program } from '@pixi/core';
import { Sprite } from '@pixi/sprite';
import { Sprite2d } from './Sprite2d';
import { Mesh2d } from '../mesh/Mesh2d';
import { MeshMaterial } from '@pixi/mesh';
import { SimpleMesh, SimpleRope } from '@pixi/mesh-extras';

import { Projection2d } from '../Projection2d';
import { Container2d, container2dWorldTransform } from '../Container2d';

function convertTo2d(this: Container | Sprite) {
	const _this = this as Container2d;
	
	if (_this.proj) return;

	_this.proj = new Projection2d(this.transform);
	_this.toLocal = Container2d.prototype.toLocal;

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

if (SimpleMesh) {
	SimpleMesh.prototype.convertTo2d =
		SimpleRope.prototype.convertTo2d =
			function () {
				if (this.proj) return;
				this.calculateVertices = Mesh2d.prototype.calculateVertices;
				this._renderDefault = Mesh2d.prototype._renderDefault;
				if (this.material.pluginName !== 'batch2d') {
					this.material = new MeshMaterial(this.material.texture, {
						program: Program.from(Mesh2d.defaultVertexShader, Mesh2d.defaultFragmentShader),
						pluginName: 'batch2d'
					});
				}
				convertTo2d.call(this);
			};
}