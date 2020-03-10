declare module PIXI {
	interface Container {
		convertTo3d(): void;
		convertSubtreeTo3d(): void;
	}
}

namespace pixi_projection {

	const containerProps: any = {
		worldTransform: {
			get: container3dWorldTransform,
			enumerable: true,
			configurable: true
		},
		position3d: {
			get: function() { return this.proj.position },
			set: function(value: any) { this.proj.position.copy(value) }
		},
		scale3d: {
			get: function() { return this.proj.scale },
			set: function(value: any) { this.proj.scale.copy(value) }
		},
		pivot3d: {
			get: function() { return this.proj.pivot },
			set: function(value: any) { this.proj.pivot.copy(value) }
		},
		euler: {
			get: function() { return this.proj.euler },
			set: function(value: any) { this.proj.euler.copy(value) }
		}
	};

	function convertTo3d() {
		if (this.proj) return;
		this.proj = new Projection3d(this.transform);
		this.toLocal = Container3d.prototype.toLocal;
		this.isFrontFace = Container3d.prototype.isFrontFace;
		this.getDepth = Container3d.prototype.getDepth;
		Object.defineProperties(this, containerProps);
	}

	(PIXI as any).Container.prototype.convertTo3d = convertTo3d;

	(PIXI as any).Sprite.prototype.convertTo3d = function () {
		if (this.proj) return;
		this.calculateVertices = Sprite3d.prototype.calculateVertices;
		this.calculateTrimmedVertices = Sprite3d.prototype.calculateTrimmedVertices;
		this._calculateBounds = Sprite3d.prototype._calculateBounds;
		this.containsPoint = Sprite3d.prototype.containsPoint;
		this.pluginName = 'batch2d';
		convertTo3d.call(this);
	};

	(PIXI as any).Container.prototype.convertSubtreeTo3d = function () {
		this.convertTo3d();
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].convertSubtreeTo3d();
		}
	};

	if (PIXI.SimpleMesh) {
		(PIXI as any).SimpleMesh.prototype.convertTo3d =
			(PIXI as any).SimpleRope.prototype.convertTo3d =
				function () {
					if (this.proj) return;
					this.calculateVertices = Mesh3d2d.prototype.calculateVertices;
					this._renderDefault = (Mesh3d2d.prototype as any)._renderDefault;
					if (this.material.pluginName !== 'batch2d') {
						this.material = new PIXI.MeshMaterial(this.material.texture, {
							program: PIXI.Program.from(Mesh2d.defaultVertexShader, Mesh2d.defaultFragmentShader),
							pluginName: 'batch2d'
						});
					}
					convertTo3d.call(this);
				};
	}
}
