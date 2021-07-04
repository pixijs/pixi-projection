declare namespace GlobalMixins {
	export interface Transform {
		proj?: import('pixi-projection').AbstractProjection;
	}

	export interface Sprite {
		_texture: import('@pixi/core').Texture;
		convertTo2d?(): void;
	}

	export interface Container {
		convertTo2d?(): void;
		convertSubtreeTo2d?(): void;
		convertTo2s(): void;
		convertSubtreeTo2s(): void;
		convertTo3d?(): void;
		convertSubtreeTo3d?(): void;
	}

	export interface IPointData {
		z?: number;
	}

	export interface Point {
		set(x?: number, y?: number, z?: number): void;
	}

    // eslint-disable-next-line @typescript-eslint/no-empty-interface
	export interface Spine extends Partial<import('pixi-projection').IDisplayObject3d> {
    }
}
