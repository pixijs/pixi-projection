namespace pixi_projection {
    export class Container2s extends PIXI.Sprite {
        constructor(texture: PIXI.Texture) {
            super(texture);
            this.proj = new ProjectionSurface(this.transform);
        }

        proj: ProjectionSurface;

        get worldTransform() {
            return this.proj as any;
        }
    }
}