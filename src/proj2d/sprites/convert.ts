declare module PIXI {
	interface Sprite {
		_texture: PIXI.Texture;
		vertexData: Float32Array;
		vertexTrimmedData: Float32Array;
		_transformID?: number;
		_textureID?: number;
		_transformTrimmedID?: number;
		_textureTrimmedID?: number;
		_anchor?: ObservablePoint;
		convertTo2d?(): void;
	}

	interface Container {
		convertTo2d?(): void;

		convertSubtreeTo2d?(): void;
	}

	interface SimpleMesh {
		convertTo2d?(): void;
	}

	interface Graphics {
		convertTo2d?(): void;
	}
}

namespace pixi_projection {

	function convertTo2d() {
		if (this.proj) return;
		this.proj = new Projection2d(this.transform);
		this.toLocal = Container2d.prototype.toLocal;
		Object.defineProperty(this, "worldTransform", {
			get: container2dWorldTransform,
			enumerable: true,
			configurable: true
		});
	}


	(PIXI as any).Container.prototype.convertTo2d = convertTo2d;

	(PIXI as any).Sprite.prototype.convertTo2d = function () {
		if (this.proj) return;
		this.calculateVertices = Sprite2d.prototype.calculateVertices;
		this.calculateTrimmedVertices = Sprite2d.prototype.calculateTrimmedVertices;
		this._calculateBounds = Sprite2d.prototype._calculateBounds;
		this.pluginName = 'batch2d';
		convertTo2d.call(this);
	};

	(PIXI as any).Container.prototype.convertSubtreeTo2d = function () {
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

	if (PIXI.TilingSprite) {
		(PIXI as any).TilingSprite.prototype.convertTo2d = function () {
			if (this.proj) return;

			this.tileProj = new Projection2d(this.tileTransform);
			this.tileProj.reverseLocalOrder = true;
			this.uvRespectAnchor = true;

			this.calculateTrimmedVertices = Sprite2d.prototype.calculateTrimmedVertices;
			this._calculateBounds = Sprite2d.prototype._calculateBounds;
			this._render = TilingSprite2d.prototype._render;

			this.pluginName = 'tilingSprite2d';
			convertTo2d.call(this);
		};
	}
}
