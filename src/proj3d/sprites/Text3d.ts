namespace pixi_projection {
    export class Text3d extends PIXI.Text {
        constructor(text?: string, style?: PIXI.TextStyle, canvas?: HTMLCanvasElement) {
            super(text, style, canvas);
            this.proj = new Projection3d(this.transform);
            this.pluginName = 'batch2d';
        }

        proj: Projection3d;
        vertexData2d: Float32Array = null;

        get worldTransform() {
	        return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
        }

	    toLocal<T extends PIXI.IPoint>(position: PIXI.IPoint, from?: PIXI.DisplayObject,
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

	    get position3d(): PIXI.IPoint {
		    return this.proj.position;
	    }
	    get scale3d(): PIXI.IPoint {
		    return this.proj.scale;
	    }
	    get euler(): IEuler {
		    return this.proj.euler;
	    }
	    get pivot3d(): PIXI.IPoint {
		    return this.proj.pivot;
	    }
	    set position3d(value: PIXI.IPoint) {
		    this.proj.position.copyFrom(value);
	    }
	    set scale3d(value: PIXI.IPoint) {
		    this.proj.scale.copyFrom(value);
	    }
	    set euler(value: IEuler) {
		    this.proj.euler.copyFrom(value);
	    }
	    set pivot3d(value: PIXI.IPoint) {
		    this.proj.pivot.copyFrom(value);
	    }
    }

    Text3d.prototype.calculateVertices = Sprite3d.prototype.calculateVertices;
    (Text3d.prototype as any).calculateTrimmedVertices = Sprite3d.prototype.calculateTrimmedVertices;
	(Text3d.prototype as any)._calculateBounds = Sprite3d.prototype._calculateBounds;
	(Text3d.prototype as any).containsPoint = Sprite3d.prototype.containsPoint;
	(Text3d.prototype as any)._render = Sprite3d.prototype._render;
}
