namespace pixi_projection {
    export class Text2d extends PIXI.Text {
        constructor(text?: string, style?: PIXI.TextStyle, canvas?: HTMLCanvasElement) {
            super(text, style, canvas);
            this.proj = new Projection2d(this.transform);
            this.pluginName = 'sprite2d';
            this.vertexData = new Float32Array(12);
        }

        proj: Projection2d;

        get worldTransform() {
            return this.proj.world as any;
        }
    }

    Text2d.prototype.calculateVertices = Sprite2d.prototype.calculateVertices;
    (Text2d.prototype as any).calculateTrimmedVertices = Sprite2d.prototype.calculateTrimmedVertices;
}
