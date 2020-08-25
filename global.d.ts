declare module '*.frag' {
    const value: string
    
    export default value
}

declare module '*.vert' {
    const value: string
    
    export default value
}

declare namespace PIXI {
    interface Container {
        convertTo2d(): void;
        convertSubtreeTo2d(): void;
        convertTo2s(): void;
		convertSubtreeTo2s(): void;
    }

    interface Sprite {
        convertTo2d(): void;
        convertTo2s(): void;
    }

    interface Sprite {
        _texture: PIXI.Texture;
        vertexData: Float32Array;
        vertexTrimmedData: Float32Array;
        _transformID?: number;
        _textureID?: number;
        _transformTrimmedID?: number;
        _textureTrimmedID?: number;
        _anchor?: ObservablePoint;
        convertTo2d(): void;
    }

    interface SimpleMesh {
        convertTo2d(): void;
    }

    interface Graphics {
        convertTo2d(): void;
    }
}