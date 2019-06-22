namespace pixi_projection {
    export class Text2d extends PIXI.Text {
        constructor(text?: string, style?: PIXI.TextStyle, canvas?: HTMLCanvasElement) {
            super(text, style, canvas);
            this.proj = new Projection2d(this.transform);
            this.pluginName = 'batch2d';
        }

        proj: Projection2d;
        vertexData2d: Float32Array = null;

        get worldTransform() {
	        return this.proj.affine ? this.transform.worldTransform : this.proj.world as any;
        }
    }

    Text2d.prototype.calculateVertices = Sprite2d.prototype.calculateVertices;
    (Text2d.prototype as any).calculateTrimmedVertices = Sprite2d.prototype.calculateTrimmedVertices;
	(Text2d.prototype as any)._calculateBounds = Sprite2d.prototype._calculateBounds;
}
