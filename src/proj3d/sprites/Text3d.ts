namespace pixi_projection {
    export class Text3d extends PIXI.Text {
        constructor(text?: string, style?: PIXI.TextStyle, canvas?: HTMLCanvasElement) {
            super(text, style, canvas);
            this.proj = new Projection3d(this.transform);
            this.pluginName = 'sprite2d';
            this.vertexData = new Float32Array(12);
        }

        proj: Projection3d;

        get worldTransform() {
	        return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
        }

	    toLocal<T extends PIXI.PointLike>(position: PIXI.PointLike, from?: PIXI.DisplayObject,
	                                      point?: T, skipUpdate?: boolean,
	                                      step = TRANSFORM_STEP.ALL): T {
		    return container3dToLocal.call(this, position, from, point, skipUpdate, step);
	    }

	    isFrontFace(forceUpdate?: boolean) {
		    return container3dIsFrontFace.call(this, forceUpdate);
	    }

	    getDepth(forceUpdate?: boolean) {
		    return container3dGetDepth.call(this, forceUpdate);
	    }

	    get position3d(): PIXI.PointLike {
		    return this.proj.position;
	    }
	    get scale3d(): PIXI.PointLike {
		    return this.proj.scale;
	    }
	    get euler(): Euler {
		    return this.proj.euler;
	    }
	    get pivot3d(): PIXI.PointLike {
		    return this.proj.pivot;
	    }
	    set position3d(value: PIXI.PointLike) {
		    this.proj.position.copy(value);
	    }
	    set scale3d(value: PIXI.PointLike) {
		    this.proj.scale.copy(value);
	    }
	    set euler(value: Euler) {
		    this.proj.euler.copy(value);
	    }
	    set pivot3d(value: PIXI.PointLike) {
		    this.proj.pivot.copy(value);
	    }
    }

    Text3d.prototype.calculateVertices = Sprite3d.prototype.calculateVertices;
    (Text3d.prototype as any).calculateTrimmedVertices = Sprite3d.prototype.calculateTrimmedVertices;
	(Text3d.prototype as any)._calculateBounds = Sprite3d.prototype._calculateBounds;
	(Text3d.prototype as any).containsPoint = Sprite3d.prototype.containsPoint;
	(Text3d.prototype as any)._render = Sprite3d.prototype._render;
}
