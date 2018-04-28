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
    }

    Text3d.prototype.calculateVertices = Sprite3d.prototype.calculateVertices;
    (Text3d.prototype as any).calculateTrimmedVertices = Sprite3d.prototype.calculateTrimmedVertices;
	(Text3d.prototype as any)._calculateBounds = Sprite3d.prototype._calculateBounds;
}
