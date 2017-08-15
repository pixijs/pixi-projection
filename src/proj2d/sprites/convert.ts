declare module PIXI {
    interface Sprite {
        convertTo2d(): void;
    }

    interface Container {
        convertTo2d(): void;
        convertSubtreeTo2d(): void;
    }
}

namespace pixi_projection {
    (PIXI as any).Sprite.prototype.convertTo2d = function () {
        if (this.proj) return;
        this.calculateVertices = Sprite2d.prototype.calculateVertices;
        this.calculateTrimmedVertices = Sprite2d.prototype.calculateTrimmedVertices;
        //cointainer
        this.proj = new Projection2d(this.transform);
        this.pluginName = 'sprite2d';
        this.vertexData = new Float32Array(12);
        Object.defineProperty(this, "worldTransform", {
            get: container2dWorldTransform,
            enumerable: true,
            configurable: true
        });
    };

    (PIXI as any).Container.prototype.convertTo2d = function () {
        if (this.proj) return;
        this.proj = new Projection2d(this.transform);
        this.pluginName = 'sprite2d';
        Object.defineProperty(this, "worldTransform", {
            get: container2dWorldTransform,
            enumerable: true,
            configurable: true
        });
    };

    (PIXI as any).Container.prototype.convertSubtreeTo2d = function () {
        this.convertTo2d();
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].convertSubtreeTo2d();
        }
    };
}
