declare module PIXI {
	interface Sprite {
		convertTo2s(): void;
	}

	interface Container {
		convertTo2s(): void;

		convertSubtreeTo2s(): void;
	}
}

namespace pixi_projection {
	(PIXI as any).Sprite.prototype.convertTo2s = function () {
		if (this.proj) return;
		//cointainer
		this.pluginName = 'sprite_bilinear';
		this.calculateVertices = Sprite2s.prototype.calculateVertices;
		this.calculateTrimmedVertices = Sprite2s.prototype.calculateTrimmedVertices;
		PIXI.Container.prototype.convertTo2s.call(this);
	};

	(PIXI as any).Container.prototype.convertTo2s = function () {
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

	(PIXI as any).Container.prototype.convertSubtreeTo2s = function () {
		this.convertTo2s();
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].convertSubtreeTo2s();
		}
	};
}
