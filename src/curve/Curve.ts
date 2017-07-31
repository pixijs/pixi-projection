namespace pixi_projection {
    import PointLike = PIXI.PointLike;

    export abstract class Curve {
        curveID = "default";

        _updateID: number = 0;

        vertexSrc: string = "";
        fragmentSrc: string = "";

        readonly uniforms: any;

        abstract apply(pos: PointLike, newPos: PointLike): PointLike;

        //TODO: remove props
        abstract applyInverse(pos: PointLike, newPos: PointLike): PointLike;
    }
}
